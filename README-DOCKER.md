# MedScribe AI - Ejecucion con Docker

Guia rapida para levantar todo el stack en cualquier maquina con un solo comando.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) o Docker Engine + Compose plugin (Linux)
- 8 GB RAM disponibles (SQL Server necesita al menos 2 GB)
- Puertos libres en tu maquina: `3000`, `5000`, `8000`, `1434`
  (SQL Server del contenedor se expone en `1434` para **no chocar** con un SQL Server local que uses en `1433`)

## Pasos

### 1. Clonar el repositorio

```bash
git clone https://github.com/roberto3101/MEDSCRIBE-DSW1-PILOTO.git
cd MEDSCRIBE-DSW1-PILOTO
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y llena las API keys segun lo que vayas a usar:

| Variable | Para que sirve | Como obtenerla |
|---|---|---|
| `AI_API_KEY` | **Obligatorio**. Groq: Whisper (transcripcion) + LLM para generar notas clinicas. | https://console.groq.com (gratis) |
| `DEEPGRAM_API_KEY` | Opcional. Diarizacion cloud (mejor calidad, en ingles sobre todo). | https://deepgram.com ($200 credito gratis) |
| `AI_EXTRA_5_API_KEY` | Opcional. Token de HuggingFace para diarizacion local con Pyannote (gratis, sin limites). | https://huggingface.co/settings/tokens |

Si vas a usar Pyannote (diarizacion local), ademas de generar el token de HuggingFace debes aceptar los terminos de estos modelos (click "Agree and access repository" en cada uno):

- https://huggingface.co/pyannote/speaker-diarization-3.1
- https://huggingface.co/pyannote/segmentation-3.0

El resto tiene valores por defecto que funcionan para correr el proyecto en local.

### 3. Levantar todos los servicios

```bash
docker compose up --build
```

La primera vez tarda 10-20 minutos (descarga SQL Server, instala PyTorch + Pyannote, compila .NET, instala npm). Las siguientes ejecuciones son casi instantaneas.

> La primera vez que uses diarizacion con Pyannote, el servicio descarga ~1 GB de modelos desde HuggingFace. Quedan cacheados en un volumen (`hf_cache`), asi que solo pasa una vez.

Cuando veas algo como:
```
medscribe-cliente-web  | ... nginx started
medscribe-gateway      | ... Now listening on: http://[::]:5000
medscribe-servicio-ia  | INFO:     Uvicorn running on http://0.0.0.0:8000
```

Ya esta todo arriba.

### 4. Abrir la aplicacion

- Frontend: http://localhost:3000
- Gateway (.NET API): http://localhost:5000
- Servicio IA (FastAPI): http://localhost:8000
- SQL Server (contenedor): `localhost,1434` (usuario `sa`, password la que pusiste en `.env`)

> Tu SQL Server local sigue vivo en `localhost,1433` (o `localhost\SQLEXPRESS`). Son bases de datos **distintas** — las dos pueden correr a la vez sin problema.

### 5. Credenciales de prueba

| Usuario | Correo | Contrasena |
|---|---|---|
| Admin | admin@medscribe.pe | Admin2026! |
| Medico | jroberto@medscribe.pe | Medico2026! |

## Comandos utiles

```bash
# Levantar en background
docker compose up -d --build

# Ver logs en vivo
docker compose logs -f

# Ver logs de un servicio
docker compose logs -f gateway

# Parar todo
docker compose down

# Parar y borrar datos de la BD (reset completo)
docker compose down -v

# Reconstruir un solo servicio
docker compose up -d --build servicio-ia

# Abrir shell en un contenedor
docker compose exec gateway bash
docker compose exec sqlserver bash
```

## Arquitectura

```
  Navegador
      |
      v
  [cliente-web]  nginx:80 -> expuesto como localhost:3000
      |  /api/*  -> proxy a gateway:5000
      |
      v
  [gateway]  .NET 9 API -> expuesto como localhost:5000
      |                       |
      |                       v
      |                  [sqlserver]  SQL Server 2022
      |                       ^
      |                       | migracion automatica al iniciar
      |                  [db-init]  (ejecuta SQL y termina)
      v
  [servicio-ia]  Python + FastAPI -> expuesto como localhost:8000
```

Los servicios se comunican entre si por la red interna `medscribe` usando los nombres de contenedor como hostnames (`sqlserver`, `gateway`, `servicio-ia`).

## Troubleshooting

### "Port is already allocated"

Tienes algo corriendo en ese puerto. Cambialo en `.env`:

```
GATEWAY_PORT=5001       # si ya corres el gateway localmente
AI_SERVICE_PORT=8001    # si ya corres el servicio IA localmente
SQL_HOST_PORT=1435      # si ya tienes algo en 1433 y 1434
```

Causas comunes:
- `dotnet run` / `npm run dev` / `uvicorn` levantados localmente en paralelo → detenlos o cambia los puertos de Docker.
- SQL Server Express ocupando 1433 → ya se evito mapeando el contenedor a 1434.

### La migracion de BD falla

Borra el volumen y vuelve a levantar:

```bash
docker compose down -v
docker compose up --build
```

### "npm run build" falla en cliente-web

Si hay errores de TypeScript, corrigelos en tu codigo local y reintenta. El build TSC es estricto.

### Cambios en codigo no se reflejan

Las imagenes se compilan una sola vez. Para ver cambios:

```bash
docker compose up -d --build <servicio>
```

## Que incluye la imagen

Todo lo necesario para que funcione "de un click":

- **Transcripcion (Whisper via Groq)** - requiere `AI_API_KEY`
- **LLM para notas clinicas (Llama 3.3 via Groq)** - misma key
- **Diarizacion con Deepgram** (cloud) - requiere `DEEPGRAM_API_KEY`
- **Diarizacion con Pyannote** (local, gratis, usa CPU) - requiere `AI_EXTRA_5_API_KEY` (token HF)
- **FFmpeg** para convertir audio webm/mp3/m4a/ogg a wav
- **PyTorch CPU-only** (no necesitas GPU)
- **SQL Server 2022 Express** con migraciones y stored procedures ejecutados automaticamente

Los datos persisten en volumenes Docker:
- `sqlserver_data` - base de datos
- `gateway_documentos` - PDFs y Word generados
- `hf_cache` - modelos de HuggingFace (Pyannote)
- `torch_cache` - cache de PyTorch

Si necesitas conectarte a la BD desde SSMS u otra herramienta, usa `localhost,1433` con usuario `sa` y la password de tu `.env`.
