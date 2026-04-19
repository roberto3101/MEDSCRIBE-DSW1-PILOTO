# MedScribe AI

Sistema de Documentacion Medica Automatizada con Inteligencia Artificial.
Transcripcion por voz, diarizacion de hablantes, estructuracion inteligente y generacion de documentos clinicos.

## Tecnologias

| Componente | Tecnologia |
|---|---|
| Backend Gateway | C# .NET Core 9 (Web API) |
| Servicio IA | Python 3.12 + FastAPI |
| Frontend | React TSX + Vite + Tailwind CSS |
| Base de datos | SQL Server Express |
| Transcripcion | Whisper (Groq API) |
| Estructuracion | LLM (Groq API - Llama 3.3) |
| Diarizacion | Pyannote 3.1 + Deepgram Nova-3 |
| Documentos | ReportLab (PDF) + python-docx (Word) |

---

## Opcion A - Ejecucion con Docker (recomendado)

Levanta todo el stack con **un solo comando**. No necesitas instalar .NET, Python, Node, SQL Server ni FFmpeg — todo viene dentro de los contenedores.

### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) o Docker Engine + Compose (Linux)
- 8 GB RAM disponibles
- Puertos libres: `3000`, `5000`, `8000`, `1434`

### Pasos

**1. Clonar el repositorio**

```bash
git clone https://github.com/roberto3101/MEDSCRIBE-DSW1-PILOTO.git
cd MEDSCRIBE-DSW1-PILOTO
```

**2. Configurar variables de entorno**

```bash
cp .env.example .env
```

Abre `.env` y llena al menos la API key de Groq (gratis en https://console.groq.com):

```
AI_API_KEY=tu-api-key-de-groq
```

Opcionales:

| Variable | Para que sirve | Como obtenerla |
|---|---|---|
| `DEEPGRAM_API_KEY` | Diarizacion cloud con Deepgram. | https://deepgram.com ($200 credito gratis) |
| `AI_EXTRA_5_API_KEY` | Token de HuggingFace para diarizacion local con Pyannote. | https://huggingface.co/settings/tokens |

Si vas a usar Pyannote, acepta los terminos de estos modelos (click "Agree and access repository"):
- https://huggingface.co/pyannote/speaker-diarization-3.1
- https://huggingface.co/pyannote/segmentation-3.0

**3. Levantar todo el stack**

```bash
docker compose up --build
```

La primera vez tarda 10-20 min (descarga SQL Server, instala PyTorch + Pyannote, compila .NET, build de React). Las siguientes son casi instantaneas.

Cuando veas:
```
medscribe-cliente-web  | ... nginx started
medscribe-gateway      | ... Now listening on: http://[::]:5000
medscribe-servicio-ia  | INFO:     Uvicorn running on http://0.0.0.0:8000
medscribe-db-init      | Base de datos lista.
```

Todo esta arriba.

**4. Abrir la aplicacion**

- Frontend: http://localhost:3000
- Gateway (.NET API): http://localhost:5000
- Servicio IA (FastAPI): http://localhost:8000
- SQL Server (contenedor): `localhost,1434` (usuario `sa`, password la de `.env`)

> SQL Server del contenedor corre en el puerto **1434** para no chocar con un SQL Server local que ya tengas en `1433`.

**5. Credenciales de prueba**

| Usuario | Correo | Contrasena | Rol |
|---|---|---|---|
| Admin | admin@medscribe.pe | Admin2026! | Administrador |
| Dr. Roberto | jroberto@medscribe.pe | Medico2026! | Medico |

### Comandos utiles

```bash
docker compose up -d --build         # levantar en background
docker compose logs -f               # ver logs en vivo
docker compose logs -f gateway       # logs de un servicio
docker compose down                  # parar todo
docker compose down -v               # parar + borrar BD (reset completo)
docker compose up -d --build gateway # rebuild de un servicio tras cambios
docker compose exec gateway bash     # abrir shell en un contenedor
```

### Troubleshooting

- **"Port is already allocated"**: tienes algo corriendo en el puerto. Cambialo en `.env` (`GATEWAY_PORT`, `AI_SERVICE_PORT`, `SQL_HOST_PORT`).
- **Docker Desktop no esta corriendo**: abre Docker Desktop y espera a que diga "Docker Desktop is running".
- **La migracion de BD falla**: `docker compose down -v && docker compose up --build` para reset total.
- **Cambios en codigo no se reflejan**: rebuild con `docker compose up -d --build <servicio>`.

---

## Opcion B - Ejecucion manual (desarrollo local)

Util si quieres iterar rapido con hot reload de cada servicio.

### Requisitos previos

- [.NET SDK 9](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Python 3.12+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- [SQL Server Management Studio (SSMS)](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- [FFmpeg](https://ffmpeg.org/download.html) (para diarizacion con Pyannote)

### Configuracion paso a paso

**1. Clonar el repositorio**

```bash
git clone https://github.com/roberto3101/MEDSCRIBE-DSW1-PILOTO.git
cd MEDSCRIBE-DSW1-PILOTO
```

**2. Configurar variables de entorno**

```bash
cp .env.example .env
```

Abre `.env` y configura:

```
# OBLIGATORIO - Groq (transcripcion + LLM)
AI_API_KEY=tu-api-key-de-groq
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile

# OPCIONAL - Deepgram (diarizacion cloud)
DEEPGRAM_API_KEY=tu-api-key-de-deepgram

# OPCIONAL - HuggingFace (diarizacion local con Pyannote)
AI_EXTRA_5_API_KEY=tu-token-de-huggingface
```

**3. Configurar HuggingFace (solo si usas Pyannote)**

1. Ir a https://huggingface.co/settings/tokens
2. Crear un token con permisos de **Read** y **Read access to contents of all public gated repos you can access**
3. Aceptar terminos en estos modelos:
   - https://huggingface.co/pyannote/speaker-diarization-3.1
   - https://huggingface.co/pyannote/segmentation-3.0

**4. Crear la base de datos**

1. Abrir SQL Server Management Studio (SSMS)
2. Conectar a tu instancia (ej: `DESKTOP-XXXXX\SQLEXPRESS`)
3. Abrir `base-datos/migraciones/MedScribeDB_MigracionCompleta.sql` y presionar F5
4. Ejecutar tambien los archivos de `base-datos/storedProcedures/`
5. Verificar que se creo la BD `MedScribeDB` con todas las tablas

**5. Configurar la conexion a SQL Server**

Editar `gateway-dotnet/src/MedScribe.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "sql": "Server=TU-PC\\SQLEXPRESS;Database=MedScribeDB;User Id=sa;Password=tu-password;TrustServerCertificate=True;"
  }
}
```

**6. Instalar dependencias**

```bash
# Frontend
cd cliente-web
npm install
cd ..

# Python
cd servicio-ia
pip install -r requirements.txt
cd ..

# .NET (se restaura automaticamente al compilar)
```

**7. Ejecutar el proyecto**

Doble click en `iniciar.bat` o ejecutar:

```bash
./iniciar.bat        # Windows
./iniciar.sh         # Linux/Mac
```

Esto levanta los 3 servicios:
- Frontend: http://localhost:3000
- Gateway C#: http://localhost:5000
- Servicio IA: http://localhost:8000

**8. Credenciales de prueba**

| Usuario | Correo | Contrasena | Rol |
|---|---|---|---|
| Admin | admin@medscribe.pe | Admin2026! | Administrador |
| Dr. Roberto | jroberto@medscribe.pe | Medico2026! | Medico |

---

## Estructura del proyecto

```
MedScribe-AI/
├── gateway-dotnet/          # Backend C# .NET Core (API REST)
├── servicio-ia/             # Servicio Python (Whisper + LLM + RAG)
├── cliente-web/             # Frontend React TSX + nginx
├── base-datos/              # SQL Server (migraciones + stored procedures)
├── postman/                 # Coleccion Postman para testing
├── Documentos/              # Documentacion del proyecto
├── docker-compose.yml       # Stack completo dockerizado
├── iniciar.bat / iniciar.sh # Scripts de ejecucion manual
├── .env.example             # Plantilla de variables de entorno
└── .env                     # Variables de entorno (no se sube)
```

## Integrantes

- Jose Roberto La Rosa Ledezma (Coordinador)
- Jason
- Alexander
- Curi

## Curso

Desarrollo de Servicios Web I (DSW1) - Quinto Ciclo
IES CIBERTEC - 2026
