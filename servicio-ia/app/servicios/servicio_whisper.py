import openai
import os
import subprocess
import tempfile
import httpx

TIEMPO_ESPERA_WHISPER_SEGUNDOS = 120
FORMATOS_QUE_CONVIERTEN_A_WAV = {"webm", "ogg", "m4a", "opus"}

cliente = openai.OpenAI(
    api_key=os.getenv("AI_API_KEY", ""),
    base_url=os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1"),
    timeout=httpx.Timeout(TIEMPO_ESPERA_WHISPER_SEGUNDOS)
)


def _convertir_a_wav_normalizado(contenido_audio: bytes, extension: str) -> tuple[bytes, str]:
    if extension.lower() not in FORMATOS_QUE_CONVIERTEN_A_WAV:
        return contenido_audio, extension

    ruta_entrada = tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False).name
    ruta_salida = ruta_entrada.rsplit(".", 1)[0] + "_norm.wav"
    try:
        with open(ruta_entrada, "wb") as f:
            f.write(contenido_audio)
        subprocess.run(
            ["ffmpeg", "-y", "-i", ruta_entrada, "-ar", "16000", "-ac", "1", "-f", "wav", ruta_salida],
            capture_output=True, check=True, timeout=60,
        )
        with open(ruta_salida, "rb") as f:
            return f.read(), "wav"
    finally:
        if os.path.exists(ruta_entrada):
            os.unlink(ruta_entrada)
        if os.path.exists(ruta_salida):
            os.unlink(ruta_salida)


async def transcribir_audio_con_whisper(contenido_audio: bytes, nombre_archivo: str) -> str:
    extension = nombre_archivo.rsplit(".", 1)[-1] if "." in nombre_archivo else "wav"
    contenido_audio, extension = _convertir_a_wav_normalizado(contenido_audio, extension)

    with tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False) as tmp:
        tmp.write(contenido_audio)
        ruta_temporal = tmp.name

    try:
        with open(ruta_temporal, "rb") as archivo_audio:
            respuesta = cliente.audio.transcriptions.create(
                model="whisper-large-v3",
                file=archivo_audio,
                language="es",
                response_format="text"
            )
        return respuesta
    except openai.APITimeoutError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=504,
            detail="Whisper API no respondio dentro del tiempo limite"
        )
    except openai.APIError as error:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=502,
            detail=f"Error en Whisper API: {str(error)}"
        )
    finally:
        os.unlink(ruta_temporal)
