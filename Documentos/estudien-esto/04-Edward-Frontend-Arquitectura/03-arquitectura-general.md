# 03. Arquitectura general del sistema

> Como tu eres el que abre la presentacion, tienes que dominar la vision arquitectonica completa, no solo el frontend.

---

## La arquitectura en una frase

MedScribe es una **arquitectura de microservicios en capas, con 4 capas funcionales y 6 contenedores Docker desplegados con un solo comando**.

---

## Las 4 capas funcionales

```
┌─────────────────────────────────────────────────┐
│  CAPA 1: PRESENTACION                           │
│  Frontend React (SPA)                           │
│  Lo que el usuario ve y toca                    │
└─────────────────┬───────────────────────────────┘
                  │ HTTP REST + JWT
                  v
┌─────────────────────────────────────────────────┐
│  CAPA 2: NEGOCIO                                │
│  Gateway C# .NET 9                              │
│  Validacion, seguridad, multi-tenant, RBAC      │
└────────┬────────────────────┬───────────────────┘
         │ HTTP               │ ADO.NET + Stored Procedures
         v                    v
┌──────────────────┐   ┌──────────────────────────┐
│  CAPA 3: IA      │   │  CAPA 4: DATOS           │
│  Servicio Python │   │  SQL Server              │
│  Whisper + LLM   │   │  Qdrant (vectorial)      │
│  + RAG           │   │  Redis (cola)            │
│                  │   │  Sistema de archivos     │
└──────────────────┘   └──────────────────────────┘
```

---

## Por que microservicios y no monolito

| Razon | Explicacion |
|---|---|
| **Cada lenguaje en su fortaleza** | C# para negocio (lo pide la rubrica). Python para IA (todas las librerias estan ahi). React para UI. |
| **Trabajo paralelo** | 4 personas, 4 microservicios. Roberto trabaja en Python sin tocar C#, etc. |
| **Escalabilidad selectiva** | Si la IA se satura, escalamos solo el servicio Python sin tocar el resto. |
| **Reemplazo facil** | Manana cambiamos Llama por GPT sin tocar el frontend ni la BD. |
| **Resiliencia** | Si el servicio IA cae, el resto sigue funcionando para operaciones que no necesitan IA. |
| **Deploy independiente** | Podemos actualizar el frontend sin tocar el backend. |

---

## Los 6 contenedores Docker

### 1. `cliente-web`
- **Que es**: nginx + el build de produccion del frontend React.
- **Puerto**: 3000.
- **Construido desde**: `cliente-web/Dockerfile`.

### 2. `gateway`
- **Que es**: la API REST en C# .NET 9.
- **Puerto**: 5000.
- **Construido desde**: `gateway-dotnet/src/MedScribe.API/Dockerfile`.

### 3. `servicio-ia`
- **Que es**: el microservicio Python con FastAPI.
- **Puerto**: 8000.
- **Construido desde**: `servicio-ia/Dockerfile`.

### 4. `db`
- **Que es**: SQL Server Express.
- **Puerto**: 1434 (mapeado desde el 1433 interno).
- **Imagen**: `mcr.microsoft.com/mssql/server:2022-latest`.

### 5. `qdrant`
- **Que es**: base de datos vectorial.
- **Puerto**: 6333.
- **Imagen**: `qdrant/qdrant:latest`.

### 6. `redis`
- **Que es**: cache y cola de trabajos.
- **Puerto**: 6379.
- **Imagen**: `redis:7-alpine`.

---

## Como se comunican

```
[Browser]
   │
   │ HTTP 3000
   v
[cliente-web (React)]
   │
   │ HTTP 5000 (con header Authorization: Bearer <jwt>)
   v
[gateway (C# .NET)]
   │
   ├──── HTTP 8000 ────> [servicio-ia (Python)]
   │                            │
   │                            │ TCP
   │                            v
   │                      [Qdrant + Redis + APIs externas (Groq)]
   │
   └──── TCP 1434 ────> [db (SQL Server)]
```

**Punto clave**: el frontend solo se comunica con el gateway. Nunca habla directo con la BD ni con el servicio Python. Eso le da seguridad y simplicidad.

---

## El archivo `docker-compose.yml`

Es el orquestador. Define los 6 servicios, sus dependencias, las redes internas y los volumenes persistentes.

**Ejemplo simplificado**:
```yaml
services:
  cliente-web:
    build: ./cliente-web
    ports:
      - "3000:80"
    depends_on:
      - gateway

  gateway:
    build: ./gateway-dotnet
    ports:
      - "5000:5000"
    depends_on:
      - db
      - servicio-ia
    environment:
      - ConnectionStrings__sql=...

  servicio-ia:
    build: ./servicio-ia
    ports:
      - "8000:8000"
    depends_on:
      - qdrant
      - redis
    environment:
      - GROQ_API_KEY=...

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    ports:
      - "1434:1433"
    volumes:
      - db_data:/var/opt/mssql

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  db_data:
```

**Para levantar todo**: `docker compose up --build`.

**Para detener**: `docker compose down`.

---

## Patrones de diseno aplicados

| Patron | Donde | Para que |
|---|---|---|
| **MVC** | Backend C# | Separar Modelo, Vista (JSON), Controlador |
| **Repository / DAO** | `gateway-dotnet/Datos/DAO/` | Aislar acceso a BD |
| **Dependency Injection** | C# y Python | Inyectar dependencias |
| **Circuit Breaker** | `circuito_llm.py` | Manejar fallos del LLM |
| **Retry con backoff** | `servicio_claude.py` | Reintentar peticiones lentas |
| **Idempotencia** | `idempotencia.py` | Evitar reprocesar peticiones |
| **Multi-tenant** | `ProveedorContextoClinica.cs` | Aislar datos por clinica |
| **RBAC** | C# + JSON en BD | Permisos por rol |
| **RAG** | `servicio_rag.py` | Dar contexto al LLM |
| **Pipeline** | `pipeline_nota_clinica.py` | Cadena de pasos IA |
| **Pattern Strategy** | dos diarizadores | Implementaciones intercambiables |
| **SPA** | Frontend React | UX fluida sin recargas |

---

## Flujo end-to-end de una consulta nueva

```
[1] Medico abre /consultas/nueva en el navegador.
    Cliente-web (React) renderiza la pagina.

[2] Selecciona paciente, plantilla, graba audio, click "Procesar".
    Cliente-web manda POST /api/consultas al gateway con el audio.
    Header: Authorization: Bearer <jwt>

[3] Gateway valida el JWT y los permisos (consultas.crear).
    Extrae IdClinica del JWT con ProveedorContextoClinica.

[4] Gateway llama al servicio IA: POST /api/ia/transcribir
    Servicio IA usa Whisper (Groq) para transcribir.
    Servicio IA usa Pyannote/Deepgram para diarizar.
    Devuelve transcripcion estructurada.

[5] Gateway llama al servicio IA: POST /api/ia/procesar
    Servicio IA clasifica intencion.
    Busca contexto en Qdrant (RAG).
    Llama a Llama 3.3 (Groq) para generar nota JSON.
    Devuelve nota estructurada.

[6] Gateway llama al DAO: ConsultaDAO.CrearConsultaConDocumento(...)
    DAO ejecuta SP usp_Consultas_CrearConsultaConDocumentoEnTransaccion.
    SQL Server inserta atomicamente en 4 tablas.

[7] Gateway llama al servicio IA: POST /api/ia/generar-pdf
    Servicio IA usa ReportLab para generar PDF.
    Servicio IA usa python-docx para generar Word.
    Devuelve rutas de archivos.

[8] Gateway devuelve al frontend: 201 Created con la consulta + rutas.

[9] Cliente-web muestra la nota en el editor.
    Medico revisa, edita si quiere, aprueba.

[10] Click en "Aprobar":
     POST /api/consultas/{id}/aprobar
     Gateway ejecuta usp_Consultas_AprobarConsultaYDocumentosEnTransaccion.
     Inserta en AuditoriaDeConsultas.
```

**Tiempo total tipico**: 15-25 segundos.

---

## Como levantar el sistema completo (instalacion rapida)

```bash
# 1. Clonar
git clone https://github.com/roberto3101/MEDSCRIBE-DSW1-PILOTO.git
cd MEDSCRIBE-DSW1-PILOTO

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar GROQ_API_KEY

# 3. Levantar todo
docker compose up --build

# Esperar 10-20 minutos la primera vez (descarga imagenes, compila .NET, build React).
# Las siguientes veces es casi instantaneo.

# 4. Abrir en el navegador:
# http://localhost:3000
```

**Verificar que todo este arriba**:
- `http://localhost:3000` → frontend.
- `http://localhost:5000/swagger` → API documentada.
- `http://localhost:8000/docs` → API IA documentada.

---

## Diagramas que debes mirar antes de presentar

1. **Arquitectura general** (figura 1 del informe): vista de las 4 capas.
2. **Componentes** (figura 8): vista interna de cada capa.
3. **Despliegue** (figura 9): los contenedores Docker.

Todos estan en `Documentos/Tecnico/Diagramas/` y embebidos en el HTML.
