import openai
import os
import tempfile
import httpx

TIEMPO_ESPERA_WHISPER_SEGUNDOS = 120

cliente = openai.OpenAI(
    api_key=os.getenv("AI_API_KEY", ""),
    base_url=os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1"),
    timeout=httpx.Timeout(TIEMPO_ESPERA_WHISPER_SEGUNDOS)
)


async def transcribir_audio_con_whisper(contenido_audio: bytes, nombre_archivo: str) -> str:
    extension = nombre_archivo.rsplit(".", 1)[-1] if "." in nombre_archivo else "wav"

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
