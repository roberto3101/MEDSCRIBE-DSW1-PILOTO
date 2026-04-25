# Arquitectura del Backend

El backend de MedScribe se compone de **dos microservicios** que se hablan por HTTP.

## Microservicio 1: Gateway (C# .NET 9)

### Tipo de arquitectura: Web API en capas (MVC + DAO)

```
┌──────────────────────────────────────────┐
│  CONTROLADORES (Controladores/)          │  Recibe peticiones HTTP, valida, delega
├──────────────────────────────────────────┤
│  SERVICIOS (Servicios/)                  │  Logica de negocio compleja (poco)
├──────────────────────────────────────────┤
│  DAOs (Datos/DAO/)                       │  Acceso a SQL Server via ADO.NET
├──────────────────────────────────────────┤
│  CONTRATOS (Contratos/)                  │  Interfaces para inyeccion de dependencias
└──────────────────────────────────────────┘
                    │
                    v
              SQL Server
              (stored procedures)
```

### Por que Web API y no MVC tradicional con vistas

- El frontend es una SPA en React. No necesita vistas renderizadas en el servidor.
- Web API genera JSON, lo cual es perfecto para que React lo consuma.
- Cumple los lineamientos del curso: `aplicacion en capas, MVC .net core y servicios web`.

### Por que ADO.NET puro (sin Entity Framework)

| Razon | Detalle |
|---|---|
| **Lo pide la rubrica** | Cibertec exige stored procedures en el proceso de negocio. |
| **Rendimiento** | Para operaciones complejas con joins, los SP son mas rapidos. |
| **Control total** | Controlamos cada SQL ejecutado, sin sorpresas del ORM. |
| **Logica en BD** | Las transacciones criticas viven en SQL, no en C#. |
| **Separacion clara** | El DBA puede tunear los SP sin tocar codigo C#. |

### Componentes clave

| Componente | Responsabilidad |
|---|---|
| `Program.cs` | Bootstrap: registra DAOs, JWT, CORS, Swagger. |
| `Controladores/` | Endpoints REST (`/api/...`). Solo orquestan, no tienen logica. |
| `Servicios/ClienteServicioIA.cs` | Cliente HTTP que habla con el servicio Python. |
| `Servicios/ProveedorContextoClinica.cs` | Extrae la clinica activa del JWT y la inyecta en cada request. |
| `Datos/DAO/*.cs` | Una clase por entidad. Cada metodo invoca un stored procedure. |
| `Modelos/Entidades/` | Clases C# que mapean filas de la BD. |
| `Modelos/Peticiones/` | DTOs de entrada con DataAnnotations para validar. |
| `Validadores/SanitizadorDeTexto.cs` | Limpia caracteres peligrosos en inputs. |
| `Intermediarios/ManejadorGlobalDeExcepciones.cs` | Middleware que atrapa errores no controlados y devuelve un JSON consistente. |

### Seguridad

- **JWT Bearer**: cada peticion lleva el token. El middleware lo valida automaticamente.
- **BCrypt**: las contrasenas se hashean con BCrypt cost factor 11.
- **RBAC granular**: el JWT incluye permisos JSON. Cada endpoint chequea modulo + accion.
- **Multi-tenant**: el `ProveedorContextoClinica` garantiza que cada usuario solo vea su propia clinica.
- **Parametros tipados**: ADO.NET con `SqlParameter` evita SQL injection por construccion.

---

## Microservicio 2: Servicio IA (Python + FastAPI)

### Tipo de arquitectura: Microservicio orientado a pipeline

```
┌──────────────────────────────────────────┐
│  RUTAS (rutas/)                          │  Endpoints FastAPI (POST /api/ia/...)
├──────────────────────────────────────────┤
│  ORQUESTADOR (pipeline_nota_clinica.py)  │  Coordina los pasos del pipeline
├──────────────────────────────────────────┤
│  SERVICIOS ESPECIALIZADOS (servicios/)   │  Whisper, LLM, RAG, generadores
├──────────────────────────────────────────┤
│  INFRAESTRUCTURA (servicios/...)         │  Circuit breaker, cola, redis, idempotencia
├──────────────────────────────────────────┤
│  VALIDADORES (validadores/)              │  Validan inputs antes de procesar
└──────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬─────────────┐
        v           v           v             v
   Groq Cloud  Deepgram    Qdrant         Redis
   (Whisper +  (Diariza-   (RAG           (cola y
   Llama 3.3)  cion)        vectorial)     cache)
```

### Por que Python + FastAPI

| Razon | Detalle |
|---|---|
| **Ecosistema IA** | PyTorch, Pyannote, OpenAI SDK, transformers... todo vive en Python. |
| **FastAPI moderno** | Async nativo, validacion con Pydantic, docs automaticas Swagger. |
| **Performance** | FastAPI usa Uvicorn (asincrono). Aguanta cargas concurrentes. |
| **Tipado opcional** | Pydantic da seguridad sin forzar TypeScript. |

### Por que separar de C#

- Si todo fuera C#, no podriamos usar Pyannote, Whisper local, etc.
- Si todo fuera Python, perderiamos las garantias de tipado fuerte de C# en el negocio.
- **Cada lenguaje en lo que mejor hace**.

### Componentes clave

| Componente | Responsabilidad |
|---|---|
| `principal.py` | Bootstrap FastAPI, monta routers, configura CORS. |
| `rutas/` | 6 routers, cada uno maneja un grupo de endpoints. |
| `pipeline_nota_clinica.py` | El cerebro. Orquesta toda la cadena de pasos. |
| `servicio_whisper.py` | Convierte audio en texto (Groq Whisper). |
| `diarizador_*.py` | Identifica oradores. Dos implementaciones intercambiables. |
| `clasificador_intenciones.py` | Detecta el tipo de consulta para elegir plantilla. |
| `servicio_rag.py` | Busca contexto medico relevante en Qdrant. |
| `servicio_claude.py` | Llama al LLM (Llama 3.3 via Groq). |
| `generador_pdf.py` | Crea PDF profesional con ReportLab. |
| `generador_word.py` | Crea Word editable con python-docx. |
| `circuito_llm.py` | Circuit breaker para no saturar Groq. |
| `cola_trabajos.py` | Procesamiento async para audios largos. |
| `idempotencia.py` | Evita reprocesar la misma peticion. |

### Resiliencia

- **Circuit breaker** en LLM: cierra llamadas si Groq falla repetidas veces.
- **Backoff exponencial**: reintentos con espera creciente.
- **Idempotencia con Redis**: misma peticion = misma respuesta cacheada.
- **Validacion temprana**: rechaza audios invalidos antes de gastar API.
- **Logs estructurados**: cada paso del pipeline queda trazado.

---

## Comunicacion entre los dos microservicios

```
[Gateway C#]
      │
      │  HTTP POST /api/ia/transcribir
      │  (con audio en multipart)
      v
[Servicio IA Python]
      │
      │  Devuelve JSON con la nota
      v
[Gateway C#]
      │
      │  Guarda en SQL Server con SP transaccional
      v
[Gateway C#] devuelve JSON al frontend
```

El cliente del Gateway esta en `gateway-dotnet/.../Servicios/ClienteServicioIA.cs`.
Es un `HttpClient` configurado en `Program.cs` con la URL base del servicio IA.

---

## Resumen de tecnologias del backend

| Capa | Tecnologia |
|---|---|
| Framework C# | ASP.NET Core 9 Web API |
| Acceso a datos C# | ADO.NET + SqlCommand |
| Autenticacion | JWT Bearer + BCrypt |
| Framework Python | FastAPI 0.115+ |
| Validacion Python | Pydantic 2 |
| Servidor Python | Uvicorn (ASGI) |
| LLM | Groq (Llama 3.3 70B) via OpenAI SDK |
| Transcripcion | Groq Whisper |
| Diarizacion | Pyannote 3.1 / Deepgram Nova-3 |
| Embeddings y RAG | Qdrant |
| Cola async y cache | Redis |
| Documentos | ReportLab (PDF) + python-docx (Word) |
| Empaquetado | Docker + Docker Compose |
