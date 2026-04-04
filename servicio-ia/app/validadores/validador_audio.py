from fastapi import HTTPException, UploadFile

TAMANO_MAXIMO_BYTES = 50 * 1024 * 1024
FORMATOS_PERMITIDOS = {"wav", "mp3", "m4a", "ogg", "webm"}


def extraer_extension_de_nombre_archivo(nombre_archivo: str) -> str:
    if not nombre_archivo or "." not in nombre_archivo:
        raise HTTPException(
            status_code=400,
            detail="El archivo debe tener una extension valida"
        )
    return nombre_archivo.rsplit(".", 1)[-1].lower()


def validar_formato_audio_permitido(nombre_archivo: str) -> str:
    extension = extraer_extension_de_nombre_archivo(nombre_archivo)
    if extension not in FORMATOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no permitido: .{extension}. Formatos validos: {', '.join(FORMATOS_PERMITIDOS)}"
        )
    return extension


def validar_tamano_archivo_dentro_del_limite(contenido: bytes) -> None:
    if len(contenido) > TAMANO_MAXIMO_BYTES:
        tamano_mb = len(contenido) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"El archivo pesa {tamano_mb:.1f}MB. El maximo permitido es 50MB"
        )


def validar_archivo_de_audio_completo(contenido: bytes, nombre_archivo: str) -> str:
    validar_tamano_archivo_dentro_del_limite(contenido)
    extension = validar_formato_audio_permitido(nombre_archivo)
    return extension
