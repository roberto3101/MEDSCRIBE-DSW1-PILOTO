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

MINIMO_CARACTERES_TRANSCRIPCION = 30
MINIMO_PALABRAS_TRANSCRIPCION = 8


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


def validar_longitud_minima_transcripcion(transcripcion: str) -> None:
    texto = transcripcion.strip()
    if len(texto) < MINIMO_CARACTERES_TRANSCRIPCION or len(texto.split()) < MINIMO_PALABRAS_TRANSCRIPCION:
        raise HTTPException(
            status_code=400,
            detail=(
                "La transcripcion es demasiado corta para generar una nota clinica "
                f"(minimo {MINIMO_CARACTERES_TRANSCRIPCION} caracteres y "
                f"{MINIMO_PALABRAS_TRANSCRIPCION} palabras)."
            ),
        )


def validar_clasificacion_estructurada(clasificacion: dict) -> None:
    if not isinstance(clasificacion, dict):
        raise HTTPException(status_code=500, detail="Clasificacion invalida: no es un diccionario")
    claves_requeridas = {"especialidad", "intencion_principal", "entidades"}
    faltantes = claves_requeridas - clasificacion.keys()
    if faltantes:
        raise HTTPException(
            status_code=500,
            detail=f"Clasificacion incompleta, faltan claves: {', '.join(sorted(faltantes))}",
        )


def validar_peticion_procesamiento_completa(transcripcion: str, especialidad: str, tipo_documento: str) -> None:
    validar_transcripcion_no_vacia(transcripcion)
    validar_longitud_minima_transcripcion(transcripcion)
    validar_tipo_documento_existente(tipo_documento)
