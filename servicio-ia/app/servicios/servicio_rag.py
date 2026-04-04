import os

DIRECTORIO_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_INDICACIONES = os.path.join(DIRECTORIO_BASE, "indicaciones")
RUTA_CONTEXTO = os.path.join(DIRECTORIO_BASE, "contexto")

MAPA_PLANTILLAS_POR_TIPO_DOCUMENTO = {
    "SOAP": "nota_soap.md",
    "HistoriaClinica": "historia_clinica.md",
    "Receta": "receta.md",
}


def _leer_archivo_markdown_si_existe(ruta: str) -> str:
    try:
        with open(ruta, "r", encoding="utf-8") as archivo:
            return archivo.read()
    except FileNotFoundError:
        return ""


def _cargar_indicacion_base_del_sistema() -> str:
    return _leer_archivo_markdown_si_existe(
        os.path.join(RUTA_INDICACIONES, "base_sistema.md")
    )


def _cargar_plantilla_por_tipo_documento(tipo_documento: str) -> str:
    nombre_archivo = MAPA_PLANTILLAS_POR_TIPO_DOCUMENTO.get(tipo_documento, "nota_soap.md")
    return _leer_archivo_markdown_si_existe(
        os.path.join(RUTA_INDICACIONES, nombre_archivo)
    )


def _cargar_contexto_por_especialidad(especialidad: str) -> str:
    return _leer_archivo_markdown_si_existe(
        os.path.join(RUTA_CONTEXTO, "especialidades", f"{especialidad}.md")
    )


def _cargar_terminologia_farmacologica_si_aplica(entidades: dict) -> str:
    if not entidades.get("medicamento"):
        return ""
    return _leer_archivo_markdown_si_existe(
        os.path.join(RUTA_CONTEXTO, "terminologia", "farmacos_peru.md")
    )


def _cargar_codigos_cie10_si_hay_diagnostico(entidades: dict) -> str:
    if not entidades.get("diagnostico"):
        return ""
    return _leer_archivo_markdown_si_existe(
        os.path.join(RUTA_CONTEXTO, "terminologia", "cie10_comunes.md")
    )


def obtener_contexto_relevante_para_consulta(especialidad: str, tipo_documento: str, entidades: dict) -> str:
    partes = []

    base = _cargar_indicacion_base_del_sistema()
    if base:
        partes.append(base)

    plantilla = _cargar_plantilla_por_tipo_documento(tipo_documento)
    if plantilla:
        partes.append(plantilla)

    contexto_especialidad = _cargar_contexto_por_especialidad(especialidad)
    if contexto_especialidad:
        partes.append(contexto_especialidad)

    farmacos = _cargar_terminologia_farmacologica_si_aplica(entidades)
    if farmacos:
        partes.append(farmacos)

    cie10 = _cargar_codigos_cie10_si_hay_diagnostico(entidades)
    if cie10:
        partes.append(cie10)

    return "\n\n---\n\n".join(partes)
