from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.servicios.servicio_whisper import transcribir_audio_con_whisper
from app.validadores.validador_audio import validar_archivo_de_audio_completo

router = APIRouter()


@router.post("/transcribir")
async def transcribir_archivo_de_audio(
    archivo: UploadFile = File(...),
    diarizar: bool = Query(default=False),
    motor_diarizacion: str = Query(default="pyannote", regex="^(pyannote|deepgram)$"),
):
    contenido = await archivo.read()
    validar_archivo_de_audio_completo(contenido, archivo.filename)
    extension = archivo.filename.rsplit(".", 1)[-1] if "." in archivo.filename else "webm"

    if not diarizar:
        try:
            resultado = await transcribir_audio_con_whisper(contenido, archivo.filename)
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Error al transcribir: {str(error)}")
        return {"transcripcion": resultado}

    if motor_diarizacion == "deepgram":
        try:
            from app.servicios.diarizador_deepgram import transcribir_y_diarizar_con_deepgram
            return await transcribir_y_diarizar_con_deepgram(contenido, extension)
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Error en Deepgram: {str(error)}")

    try:
        from app.servicios.diarizador_voces import transcribir_y_diarizar_con_pyannote
        return await transcribir_y_diarizar_con_pyannote(contenido, extension)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error en Pyannote: {str(error)}")
