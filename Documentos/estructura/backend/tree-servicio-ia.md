# Arbol del Servicio IA (Python + FastAPI)

> Microservicio en Python encargado de toda la inteligencia artificial: transcripcion, estructuracion y generacion de documentos.

```
servicio-ia/
├── principal.py                    # PUNTO DE ENTRADA
│   Crea la app FastAPI, registra los routers, configura CORS y middlewares.
│
├── requirements.txt                # Dependencias pip (FastAPI, openai, pyannote, etc.)
├── Dockerfile                      # Empaquetado para Docker
│
├── app/                            # CODIGO PRINCIPAL
│   ├── __init__.py
│   ├── versiones.py                       - Versiones de los servicios
│   │
│   ├── rutas/                      # ENDPOINTS REST (routers de FastAPI)
│   │   ├── __init__.py
│   │   ├── rutas_transcripcion.py        - POST /api/ia/transcribir (Whisper)
│   │   ├── rutas_procesamiento.py        - POST /api/ia/procesar (LLM + RAG)
│   │   ├── rutas_generacion.py           - POST /api/ia/generar-pdf y /generar-word
│   │   ├── rutas_trabajos.py             - Cola asincrona (estado, resultado)
│   │   ├── rutas_documentos_guardados.py - Recuperar docs procesados
│   │   └── rutas_configuracion.py        - Configurar plantillas
│   │
│   ├── servicios/                  # LOGICA DE NEGOCIO E INTEGRACIONES
│   │   │
│   │   ├── pipeline_nota_clinica.py      - ORQUESTADOR PRINCIPAL del pipeline IA
│   │   │
│   │   ├── servicio_whisper.py           - Cliente Whisper (Groq) para transcribir
│   │   ├── diarizador_voces.py           - Diarizacion local con Pyannote
│   │   ├── diarizador_deepgram.py        - Diarizacion en nube con Deepgram
│   │   ├── clasificador_intenciones.py   - Detecta tipo de consulta
│   │   ├── servicio_claude.py            - Cliente LLM (Llama 3.3 via Groq)
│   │   ├── servicio_rag.py               - Busca contexto medico en Qdrant
│   │   ├── indice_vectorial.py           - Indexa docs en Qdrant
│   │   │
│   │   ├── generador_pdf.py              - Genera PDF con ReportLab
│   │   ├── generador_word.py             - Genera Word con python-docx
│   │   ├── formatos_documento.py         - Estilos comunes
│   │   ├── configuracion_documentos.py   - Plantillas configurables
│   │   │
│   │   ├── circuito_llm.py               - Circuit breaker para Groq
│   │   ├── cola_trabajos.py              - Cola asincrona en memoria
│   │   ├── almacen_trabajos.py           - Estado de trabajos
│   │   ├── conexion_redis.py             - Cliente Redis
│   │   └── idempotencia.py               - Evita reprocesar misma peticion
│   │
│   ├── esquemas/                   # MODELOS PYDANTIC (validacion de DTOs)
│   │   ├── consulta.py                   - Schemas de consulta
│   │   └── documento.py                  - Schemas de documento
│   │
│   └── validadores/                # VALIDACION DE INPUTS
│       ├── __init__.py
│       ├── validador_audio.py            - Formato, tamano, duracion
│       └── validador_consulta.py         - Estructura del request
│
├── documentos-salida/              # CARPETA DE OUTPUTS
│   PDFs y Words generados, mas su sidecar JSON con metadata.
│
├── pruebas/                        # SCRIPTS DE PRUEBA MANUAL
│
└── tests/                          # TESTS UNITARIOS
```

## Patrones de organizacion

### Patron Pipeline (cadena de pasos)
El archivo clave es **`servicios/pipeline_nota_clinica.py`**. Este orquesta toda la cadena:

```
audio  --[whisper]-->  texto
texto  --[diarizador]-->  texto con oradores
texto  --[clasificador]-->  intencion
intencion + texto  --[rag]-->  contexto medico
todo lo anterior  --[claude/llama]-->  nota estructurada JSON
nota  --[generador_pdf/word]-->  archivos descargables
```

### Patron Strategy
Hay **dos diarizadores intercambiables**: `diarizador_voces.py` (Pyannote local) y `diarizador_deepgram.py` (cloud). Se elige por configuracion sin cambiar el codigo del pipeline.

### Patron Circuit Breaker
`circuito_llm.py`: si el LLM falla muchas veces seguidas, se "abre el circuito" y devuelve error rapido por 30 segundos sin llamar a Groq. Evita saturar.

### Patron Idempotencia
`idempotencia.py`: cada peticion lleva un ID unico. Si llega dos veces el mismo ID (porque el cliente reintento), devuelve la respuesta cacheada en lugar de reprocesar.

### RAG (Retrieval Augmented Generation)
1. Al arrancar, `indice_vectorial.py` lee documentos markdown con guias clinicas y formatos SOAP, los chunka, genera embeddings y los guarda en Qdrant.
2. En cada peticion, `servicio_rag.py` busca los chunks mas relevantes y los inyecta en el prompt del LLM.
3. Esto le da al LLM **contexto medico fresco** sin necesidad de re-entrenarlo.

## Convencion de nombres

- **snake_case** en todo (convencion de Python)
- **Nombres en espanol** (lenguaje ubicuo, igual que el resto del proyecto)
- Prefijos: `servicio_`, `generador_`, `validador_`, `rutas_`, `diarizador_`

## Punto de entrada

`principal.py` levanta la app FastAPI:

```python
app = FastAPI()
app.include_router(rutas_transcripcion.router)
app.include_router(rutas_procesamiento.router)
app.include_router(rutas_generacion.router)
# ... etc
```

Cada `rutas_*.py` define sus propios endpoints con decoradores `@router.post(...)`.

## Como llega una peticion

```
Frontend o Gateway manda POST /api/ia/transcribir
            │
            v
    FastAPI enruta a rutas_transcripcion.transcribir(audio)
            │
            v
    Validador valida formato y tamano del audio
            │
            v
    Pipeline: servicio_whisper.transcribir(audio)
            │
            v
    Pipeline: diarizador.identificar_oradores(audio)
            │
            v
    Combina texto + oradores y devuelve JSON
```
