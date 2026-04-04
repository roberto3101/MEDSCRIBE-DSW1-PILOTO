# MedScribe AI

Sistema de Documentacion Medica Automatizada con Inteligencia Artificial.
Transcripcion por voz, diarizacion de hablantes, estructuracion inteligente y generacion de documentos clinicos.

## Tecnologias

| Componente | Tecnologia |
|---|---|
| Backend Gateway | C# .NET Core 9 (Web API) |
| Servicio IA | Python 3.13 + FastAPI |
| Frontend | React TSX + Vite + Tailwind CSS |
| Base de datos | SQL Server Express |
| Transcripcion | Whisper (Groq API) |
| Estructuracion | LLM (Groq API - Llama 3.3) |
| Diarizacion | Pyannote 3.1 + Deepgram Nova-3 |
| Documentos | ReportLab (PDF) + python-docx (Word) |

## Requisitos previos

- [.NET SDK 9](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Python 3.12+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- [SQL Server Management Studio (SSMS)](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- [FFmpeg](https://ffmpeg.org/download.html) (para diarizacion con Pyannote)

## Configuracion paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/roberto3101/MEDSCRIBE-DSW1-PILOTO.git
cd MEDSCRIBE-DSW1-PILOTO
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y llena tus credenciales:

```bash
cp .env.example .env
```

Abre `.env` y configura:

```
# OBLIGATORIO - Groq (transcripcion + LLM)
# Registrarse en https://console.groq.com
AI_API_KEY=tu-api-key-de-groq
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile

# OPCIONAL - Deepgram (diarizacion cloud)
# Registrarse en https://deepgram.com ($200 credito gratis)
DEEPGRAM_API_KEY=tu-api-key-de-deepgram

# OPCIONAL - HuggingFace (diarizacion local con Pyannote)
# Registrarse en https://huggingface.co
AI_EXTRA_5_API_KEY=tu-token-de-huggingface
```

### 3. Configurar HuggingFace (solo si usas Pyannote)

Si vas a usar diarizacion local con Pyannote, necesitas aceptar los terminos de estos modelos en HuggingFace:

1. Ir a https://huggingface.co/settings/tokens
2. Crear un token con permisos de **Read** y **Read access to contents of all public gated repos you can access**
3. Aceptar terminos en estos modelos (click "Agree and access repository" en cada uno):
   - https://huggingface.co/pyannote/speaker-diarization-3.1
   - https://huggingface.co/pyannote/segmentation-3.0
   - https://huggingface.co/pyannote/speaker-diarization-community-1

### 4. Crear la base de datos

1. Abrir SQL Server Management Studio (SSMS)
2. Conectar a tu instancia (ej: `DESKTOP-XXXXX\SQLEXPRESS`)
3. Abrir el archivo `base-datos/migraciones/MedScribeDB_MigracionCompleta.sql`
4. Presionar F5 para ejecutar
5. Verificar que se creo la BD `MedScribeDB` con todas las tablas

### 5. Configurar la conexion a SQL Server

Editar `gateway-dotnet/src/MedScribe.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "sql": "Server=TU-PC\\SQLEXPRESS;Database=MedScribeDB;User Id=sa;Password=tu-password;TrustServerCertificate=True;"
  }
}
```

Reemplaza `TU-PC\\SQLEXPRESS` con el nombre de tu instancia de SQL Server.

### 6. Instalar dependencias

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

### 7. Ejecutar el proyecto

Doble click en `iniciar.bat` o ejecutar:

```bash
./iniciar.bat
```

Esto levanta los 3 servicios:
- Frontend: http://localhost:3000
- Gateway C#: http://localhost:5000
- Servicio IA: http://localhost:8000

### 8. Credenciales de prueba

| Usuario | Correo | Contrasena | Rol |
|---|---|---|---|
| Admin | admin@medscribe.pe | Admin2026! | Administrador |
| Dr. Roberto | jroberto@medscribe.pe | Medico2026! | Medico |

## Estructura del proyecto

```
MedScribe-AI/
├── gateway-dotnet/          # Backend C# .NET Core (API REST)
├── servicio-ia/             # Servicio Python (Whisper + LLM + RAG)
├── cliente-web/             # Frontend React TSX
├── base-datos/              # SQL Server (migraciones + stored procedures)
├── postman/                 # Coleccion Postman para testing
├── Documentos/              # Documentacion del proyecto
├── iniciar.bat              # Script para levantar todo
├── docker-compose.yml       # Deploy con Docker
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
