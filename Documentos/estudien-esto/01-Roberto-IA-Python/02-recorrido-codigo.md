# Recorrido por el codigo

Mapa de archivos del servicio IA. Si te preguntan "donde esta X", aqui lo encuentras.

## Punto de entrada

### `servicio-ia/principal.py`
Es el primer archivo que se ejecuta cuando levantas el servicio. Aqui se:
- Crea la app FastAPI
- Registran los routers (endpoints)
- Configura CORS
- Configura logs
- Se inicializa Qdrant y Redis al arrancar

**Si te preguntan**: "este archivo es el `Program.cs` del servicio Python".

---

## Endpoints (rutas)

Carpeta: `servicio-ia/app/rutas/`

### `rutas_transcripcion.py`
- **POST /api/ia/transcribir** - Recibe audio y devuelve texto + diarizacion
- Es el endpoint mas importante: convierte voz en texto

### `rutas_procesamiento.py`
- **POST /api/ia/procesar** - Recibe texto transcrito y lo convierte en nota clinica estructurada con LLM + RAG

### `rutas_generacion.py`
- **POST /api/ia/generar-pdf** - Genera el archivo PDF
- **POST /api/ia/generar-word** - Genera el archivo Word

### `rutas_trabajos.py`
- Endpoints para consultar el estado de trabajos asincronos (cola)

### `rutas_documentos_guardados.py`
- Recupera documentos ya generados desde el almacenamiento

### `rutas_configuracion.py`
- Configurar plantillas de notas

---

## Servicios (logica)

Carpeta: `servicio-ia/app/servicios/`

### El orquestador

#### `pipeline_nota_clinica.py` - **EL ARCHIVO MAS IMPORTANTE**
Aqui se coordina TODO el pipeline. Lee este si solo tienes tiempo para leer un archivo.

Contiene la funcion principal que:
1. Recibe la transcripcion
2. Llama al clasificador
3. Llama al RAG
4. Llama al LLM
5. Devuelve la nota estructurada

### Servicios de IA

#### `servicio_whisper.py`
Cliente HTTP para Groq. Toma el audio, lo manda a Groq, devuelve el texto.

#### `diarizador_voces.py`
Implementacion local con Pyannote. Carga el modelo en memoria y procesa el audio.

#### `diarizador_deepgram.py`
Implementacion en nube. Manda el audio a Deepgram y recibe el texto con etiquetas.

#### `clasificador_intenciones.py`
Lee el texto y devuelve el tipo de consulta: `primera_consulta`, `seguimiento`, `urgencia`, `receta_simple`.

#### `servicio_claude.py`
Cliente del LLM (Llama 3.3 via Groq). El nombre `claude` es historico (antes usabamos Claude). Hoy llama a Llama, pero el archivo no se renombro.

#### `servicio_rag.py`
Busca en Qdrant los chunks de documentos mas relevantes para una consulta.

#### `indice_vectorial.py`
Al arrancar el servicio, lee documentos markdown desde disco, los chunka, genera embeddings y los indexa en Qdrant.

### Generadores de documentos

#### `generador_pdf.py`
Usa ReportLab para crear el PDF. Define colores, fuentes, tablas, logo.

#### `generador_word.py`
Usa python-docx para crear el .docx. Misma estructura que el PDF.

#### `formatos_documento.py`
Estilos compartidos entre PDF y Word.

#### `configuracion_documentos.py`
Permite que cada clinica personalice su plantilla.

### Infraestructura

#### `circuito_llm.py`
Circuit breaker para evitar saturar Groq cuando esta caido.

#### `cola_trabajos.py`
Cola en memoria para procesar audios largos sin bloquear al usuario.

#### `almacen_trabajos.py`
Guarda el estado de cada trabajo (en proceso, completado, error).

#### `conexion_redis.py`
Cliente Redis. Se usa para idempotencia y cola distribuida.

#### `idempotencia.py`
Maneja la deduplicacion de peticiones con el mismo ID.

---

## Validadores

Carpeta: `servicio-ia/app/validadores/`

### `validador_audio.py`
Valida que el archivo de audio sea valido:
- Formato (.wav, .mp3, .m4a)
- Tamano (max 25 MB)
- Duracion (max 10 minutos)

### `validador_consulta.py`
Valida que el JSON de la peticion tenga los campos requeridos.

---

## Schemas (modelos de datos)

Carpeta: `servicio-ia/app/esquemas/`

### `consulta.py`
Modelos Pydantic para los requests y responses relacionados con consultas.

### `documento.py`
Modelos Pydantic para los documentos generados.

---

## Archivos de configuracion

### `servicio-ia/requirements.txt`
Lista de dependencias pip. Las mas importantes:
- `fastapi` - El framework
- `uvicorn` - El servidor ASGI
- `openai` - SDK que usamos para Groq (compatible OpenAI)
- `pyannote.audio` - Para diarizacion local
- `qdrant-client` - Cliente Qdrant
- `redis` - Cliente Redis
- `reportlab` - Generador PDF
- `python-docx` - Generador Word

### `servicio-ia/Dockerfile`
Empaquetado para contenedor Docker.

---

## Resumen visual

```
servicio-ia/
├── principal.py                 <- aqui empieza todo
└── app/
    ├── rutas/                   <- endpoints (que el mundo ve)
    ├── servicios/               <- logica (donde pasa todo)
    │   ├── pipeline_nota_clinica.py  ★ EL CORAZON
    │   ├── servicio_whisper.py       (audio -> texto)
    │   ├── diarizador_*.py           (texto -> texto + oradores)
    │   ├── clasificador_intenciones.py (texto -> tipo)
    │   ├── servicio_rag.py           (busca contexto)
    │   ├── servicio_claude.py        (LLM)
    │   ├── generador_pdf.py          (nota -> PDF)
    │   └── generador_word.py         (nota -> Word)
    ├── validadores/             <- validacion de inputs
    ├── esquemas/                <- modelos Pydantic
    └── validadores/
```

## Que decir si te preguntan "donde esta..."

| Pregunta | Tu respuesta |
|---|---|
| ¿Donde se transcribe el audio? | `servicio_whisper.py`, llama a Groq |
| ¿Donde se identifican los oradores? | `diarizador_voces.py` o `diarizador_deepgram.py` |
| ¿Donde esta el cerebro del sistema? | `pipeline_nota_clinica.py` |
| ¿Donde se llama al LLM? | `servicio_claude.py` (a pesar del nombre, usa Llama) |
| ¿Donde se busca el contexto medico? | `servicio_rag.py` con Qdrant |
| ¿Donde se genera el PDF? | `generador_pdf.py` con ReportLab |
| ¿Donde estan los endpoints? | `app/rutas/` |
| ¿Donde esta el manejo de errores del LLM? | `circuito_llm.py` |
