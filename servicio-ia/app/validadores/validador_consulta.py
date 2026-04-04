from fastapi import HTTPException

TIPOS_DOCUMENTO_VALIDOS = {"SOAP", "HistoriaClinica", "Receta", "Personalizada"}

MAPA_ESPECIALIDADES = {
    "medicina general": "general",
    "general": "general",
    "pediatria": "pediatria",
    "cardiologia": "cardiologia",
    "ginecologia": "ginecologia",
    "traumatologia": "traumatologia",
    "dermatologia": "dermatologia",
    "": "general",
}


def normalizar_especialidad(especialidad: str) -> str:
    return MAPA_ESPECIALIDADES.get(especialidad.lower().strip(), especialidad.lower().strip())


def validar_tipo_documento_existente(tipo_documento: str) -> None:
    if tipo_documento not in TIPOS_DOCUMENTO_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de documento invalido: {tipo_documento}. Validos: {', '.join(TIPOS_DOCUMENTO_VALIDOS)}"
        )


def validar_transcripcion_no_vacia(transcripcion: str) -> None:
    if not transcripcion or not transcripcion.strip():
        raise HTTPException(
            status_code=400,
            detail="La transcripcion no puede estar vacia"
        )


def validar_peticion_procesamiento_completa(transcripcion: str, especialidad: str, tipo_documento: str) -> None:
    validar_transcripcion_no_vacia(transcripcion)
    validar_tipo_documento_existente(tipo_documento)
