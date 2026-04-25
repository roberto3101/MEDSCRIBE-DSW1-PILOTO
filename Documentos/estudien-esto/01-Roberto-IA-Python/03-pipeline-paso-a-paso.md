# El pipeline de IA paso a paso

> Esta es la cadena completa que convierte un audio en una nota clinica. Si dominas esto, dominas tu exposicion.

## Vista general del flujo

```
1. AUDIO entra al servicio
        |
2. WHISPER lo transcribe (audio -> texto)
        |
3. DIARIZADOR identifica oradores (texto -> texto + etiquetas)
        |
4. CLASIFICADOR detecta tipo de consulta
        |
5. RAG busca contexto medico relevante en Qdrant
        |
6. LLAMA 3.3 (LLM) genera la nota estructurada en JSON
        |
7. GENERADORES crean PDF y Word
        |
8. RESPUESTA al gateway
```

---

## Paso 1: Recibir el audio

**Endpoint**: `POST /api/ia/transcribir`
**Archivo**: `app/rutas/rutas_transcripcion.py`

El frontend manda el audio como `multipart/form-data`. FastAPI lo recibe como `UploadFile`.

```python
@router.post("/transcribir")
async def transcribir(audio: UploadFile = File(...)):
    # 1. Validamos el archivo
    validador_audio.validar(audio)
    # 2. Llamamos al pipeline
    resultado = await pipeline.procesar_audio(audio)
    return resultado
```

### Validaciones que hacemos
- Formato: solo `.wav`, `.mp3`, `.m4a`, `.webm`
- Tamano maximo: 25 MB
- Duracion maxima: 10 minutos

Si falla, devolvemos HTTP 422 con un mensaje claro.

---

## Paso 2: Transcripcion con Whisper

**Archivo**: `app/servicios/servicio_whisper.py`

### Que hace
Toma el audio y lo manda a Groq via API. Groq usa Whisper-large-v3 (el mejor modelo).

### Codigo conceptual
```python
async def transcribir(audio_bytes: bytes) -> str:
    cliente = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    respuesta = cliente.audio.transcriptions.create(
        file=audio_bytes,
        model="whisper-large-v3",
        language="es",
        response_format="verbose_json"  # incluye timestamps
    )
    return respuesta.text
```

### Que devuelve
Texto plano + timestamps por segmento.

Ejemplo:
```
[0.00 - 4.25]: Buenos dias doctor.
[4.25 - 9.10]: Hola, ¿en que le puedo ayudar?
[9.10 - 15.30]: Tengo dolor de cabeza desde ayer.
```

### Velocidad
~1 segundo para audios cortos (1-2 min). Hasta 5 segundos para audios largos.

---

## Paso 3: Diarizacion

**Archivos**:
- `app/servicios/diarizador_voces.py` (Pyannote, local)
- `app/servicios/diarizador_deepgram.py` (Deepgram, nube)

### El problema que resuelve
Whisper te da el texto, pero no sabe quien lo dijo. La diarizacion etiqueta cada segmento con el orador.

### Como funciona Pyannote (local)
1. Carga el modelo `pyannote/speaker-diarization-3.1` en memoria.
2. Procesa el audio y detecta cambios de orador por caracteristicas vocales.
3. Devuelve segmentos con etiquetas tipo `SPEAKER_00`, `SPEAKER_01`.

### Como funciona Deepgram (nube)
1. Manda el audio a la API de Deepgram con `diarize=true`.
2. Deepgram devuelve el texto ya con etiquetas integradas.
3. Mas rapido pero requiere internet.

### Combinacion
Despues de Whisper + diarizador, tenemos:
```
[Medico]:    "Buenos dias, ¿en que le puedo ayudar?"
[Paciente]:  "Doctor, tengo dolor de cabeza desde ayer."
[Medico]:    "¿En que parte?"
[Paciente]:  "En la frente, sobre todo cuando me agacho."
```

> **Tip**: el etiquetado de quien es medico vs paciente lo hacemos por contexto (el primero que habla suele ser el medico) o porque el sistema sabe quien grabo desde el frontend.

---

## Paso 4: Clasificacion de intenciones

**Archivo**: `app/servicios/clasificador_intenciones.py`

### Que hace
Lee la transcripcion y decide que tipo de consulta es:

| Tipo | Cuando se aplica |
|---|---|
| `primera_consulta` | Es la primera vez que viene el paciente |
| `seguimiento` | Ya tiene historial, viene a ver evolucion |
| `urgencia` | Caso agudo, requiere accion inmediata |
| `receta_simple` | Solo necesita prescribir medicamentos |
| `informe_medico` | Necesita un certificado o informe |

### Como decide
Usando un LLM pequeno con un prompt corto. El LLM lee las primeras frases y devuelve la categoria.

### Por que sirve esto
Cada tipo de consulta usa una **plantilla distinta** de nota clinica. Asi no aplicamos la misma plantilla SOAP a una receta simple.

---

## Paso 5: RAG con Qdrant

**Archivo**: `app/servicios/servicio_rag.py`

### Que hace
Busca en Qdrant los documentos medicos mas relevantes para esta consulta y los inyecta como contexto al LLM.

### Por que es importante
Sin RAG, el LLM podria inventar el formato de la nota. Con RAG, le damos las plantillas oficiales y guias clinicas que la clinica usa.

### Flujo
1. Toma la transcripcion + el tipo de consulta.
2. Genera embeddings de la transcripcion.
3. Busca en Qdrant los 3-5 chunks mas similares.
4. Devuelve esos chunks como contexto.

### Que hay en Qdrant
Documentos markdown con:
- Plantillas SOAP completas
- Indicaciones por especialidad (cardiologia, pediatria, etc.)
- Formato peruano de receta
- Codigos CIE-10 comunes
- Ejemplos de notas bien escritas

### Caching
Los chunks se cachean en memoria para que no se vaya cada vez al disco. Thread-safe para concurrencia.

---

## Paso 6: Generacion con LLM (Llama 3.3)

**Archivo**: `app/servicios/servicio_claude.py`

> **Importante**: el archivo se llama `servicio_claude.py` por razones historicas (antes usabamos Claude de Anthropic). Hoy llama a Llama 3.3 via Groq, pero el nombre del archivo no se cambio para no romper imports.

### Que hace
Construye un prompt con la transcripcion + contexto RAG y se lo manda a Llama 3.3.

### Estructura del prompt
```
Eres un asistente medico. Genera una nota clinica estructurada en JSON.

CONTEXTO MEDICO RELEVANTE:
{contexto_rag}

TRANSCRIPCION DE LA CONSULTA:
{transcripcion}

Devuelve un JSON con las secciones: anamnesis, examen_fisico, diagnostico, plan.
```

### Por que Llama 3.3 70B
- 70 mil millones de parametros (muy potente)
- Open source (no estamos atados)
- Groq lo sirve **gratis** y muy rapido (~2 segundos)
- Compite con GPT-4 en calidad

### Resiliencia
- **Circuit breaker** (`circuito_llm.py`): si Groq falla mucho, corta las llamadas.
- **Backoff exponencial**: reintenta con espera creciente (1s, 2s, 4s, 8s).
- **Validacion del JSON**: si Llama devuelve algo mal formado, reintenta.

### Que devuelve
JSON estructurado:
```json
{
  "motivo_consulta": "Cefalea de 24 horas de evolucion",
  "anamnesis": "Paciente refiere dolor frontal...",
  "examen_fisico": "Lucido, orientado...",
  "diagnostico": "Cefalea tensional probable",
  "plan": "Paracetamol 500mg cada 8 horas..."
}
```

---

## Paso 7: Generacion de documentos

### PDF
**Archivo**: `app/servicios/generador_pdf.py`
- Usa **ReportLab**
- Aplica plantilla configurada en `configuracion_documentos.py`
- Incluye logo de la clinica, datos del medico, fecha
- Aplica estilos: titulos en color, tablas formateadas
- Tamano A4, margenes profesionales

### Word
**Archivo**: `app/servicios/generador_word.py`
- Usa **python-docx**
- Mismo contenido que el PDF pero editable
- El medico puede abrirlo en Word y modificar lo que quiera

### Sidecar JSON
Cada archivo generado guarda al lado un `.json` con metadata:
```json
{
  "id_consulta": 12345,
  "fecha_generacion": "2026-04-25T16:30:00",
  "version_modelo": "llama-3.3-70b-versatile",
  "version_whisper": "whisper-large-v3"
}
```

Esto sirve para auditoria y para reproducir el documento si se borra.

---

## Paso 8: Respuesta al gateway

El servicio IA devuelve al gateway:
```json
{
  "id_trabajo": "uuid-1234",
  "transcripcion": "...",
  "nota_clinica": {...},
  "ruta_pdf": "/documentos-salida/consulta-12345.pdf",
  "ruta_word": "/documentos-salida/consulta-12345.docx",
  "duracion_total_segundos": 18.5
}
```

El gateway luego guarda la consulta en SQL Server y devuelve al frontend.

---

## Resumen para repetir mentalmente

> "El audio entra. Whisper lo transcribe. El diarizador separa oradores. El clasificador detecta el tipo. RAG trae el contexto. Llama 3.3 arma la nota. ReportLab genera el PDF. python-docx genera el Word. Devolvemos todo."

Si lo dices asi de fluido, el profesor te creera todo.
