FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/app/.hf_cache \
    TORCH_HOME=/app/.torch_cache

# Dependencias del sistema:
#   ffmpeg        -> conversion de audio (webm/mp3/m4a/ogg -> wav)
#   libsndfile1   -> soundfile (lectura/escritura WAV)
#   libgomp1      -> libgomp para torch
#   curl          -> healthcheck
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ffmpeg \
      libsndfile1 \
      libgomp1 \
      curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Torch CPU-only (pesa ~200 MB en vez de ~2 GB de la version CUDA)
RUN pip install --no-cache-dir \
      torch==2.5.1 \
      torchaudio==2.5.1 \
      --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/.hf_cache /app/.torch_cache /app/documentos-salida

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:8000/ || exit 1

CMD ["uvicorn", "principal:app", "--host", "0.0.0.0", "--port", "8000"]
