import logging
import os
import time
from threading import Lock

logger = logging.getLogger(__name__)

REINTENTOS_LECTURA_ARCHIVO = 3
ESPERA_BASE_SEGUNDOS_LECTURA = 0.1

DIRECTORIO_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_INDICACIONES = os.path.join(DIRECTORIO_BASE, "indicaciones")
RUTA_CONTEXTO = os.path.join(DIRECTORIO_BASE, "contexto")

MAPA_PLANTILLAS_POR_TIPO_DOCUMENTO = {
    "SOAP": "nota_soap.md",
    "HistoriaClinica": "historia_clinica.md",
    "Receta": "receta.md",
}

INTENCIONES_QUE_REQUIEREN_CONTEXTO_COMPLETO = {
    "primera_consulta", "consulta_diagnostica", "urgencia",
}

INTENCIONES_MINIMALISTAS = {"receta_simple"}

_cache_contenido_por_ruta: dict[str, tuple[float, str]] = {}
_cerrojo_cache = Lock()


def _leer_archivo_desde_disco_con_reintentos(ruta: str) -> str:
    ultimo_error: Exception | None = None
    for intento in range(1, REINTENTOS_LECTURA_ARCHIVO + 1):
        try:
            with open(ruta, "r", encoding="utf-8") as archivo:
                return archivo.read()
        except FileNotFoundError:
            logger.warning("RAG: archivo no encontrado, se omite del contexto: %s", ruta)
            return ""
        except (OSError, IOError) as error:
            ultimo_error = error
            if intento == REINTENTOS_LECTURA_ARCHIVO:
                break
            espera = ESPERA_BASE_SEGUNDOS_LECTURA * (2 ** (intento - 1))
            logger.warning(
                "RAG: error transitorio leyendo %s (%s). Reintento %d/%d en %.2fs",
                ruta, type(error).__name__, intento, REINTENTOS_LECTURA_ARCHIVO, espera,
            )
            time.sleep(espera)
    logger.error("RAG: no se pudo leer %s tras %d intentos (%s). Se omite.",
                 ruta, REINTENTOS_LECTURA_ARCHIVO, ultimo_error)
    return ""


def _leer_archivo_markdown_si_existe(ruta: str) -> str:
    try:
        mtime_actual = os.path.getmtime(ruta)
    except (OSError, FileNotFoundError):
        with _cerrojo_cache:
            _cache_contenido_por_ruta.pop(ruta, None)
        return _leer_archivo_desde_disco_con_reintentos(ruta)

    with _cerrojo_cache:
        entrada = _cache_contenido_por_ruta.get(ruta)
        if entrada and entrada[0] == mtime_actual:
            return entrada[1]

    contenido = _leer_archivo_desde_disco_con_reintentos(ruta)
    with _cerrojo_cache:
        _cache_contenido_por_ruta[ruta] = (mtime_actual, contenido)
    return contenido


def limpiar_cache_rag() -> int:
    with _cerrojo_cache:
        cantidad = len(_cache_contenido_por_ruta)
        _cache_contenido_por_ruta.clear()
    logger.info("RAG: cache limpiado, %d entradas eliminadas", cantidad)
    return cantidad


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


def _cargar_codigos_cie10_si_hay_diagnostico(entidades: dict, intencion: str) -> str:
    if not entidades.get("diagnostico") and intencion not in INTENCIONES_QUE_REQUIEREN_CONTEXTO_COMPLETO:
        return ""
    return _leer_archivo_markdown_si_existe(
        os.path.join(RUTA_CONTEXTO, "terminologia", "cie10_comunes.md")
    )


TOP_K_CHUNKS_VECTORIAL = int(os.getenv("TOP_K_CHUNKS_RAG", "5"))
USAR_BUSQUEDA_VECTORIAL = os.getenv("USAR_BUSQUEDA_VECTORIAL", "true").lower() == "true"


def _construir_contexto_dinamico_vectorial(transcripcion: str, especialidad: str, tipo_documento: str) -> tuple[list[str], list[str]]:
    try:
        from app.servicios.indice_vectorial import buscar_chunks_relevantes, consultar_estado_indice
        estado = consultar_estado_indice()
        if not estado.get("disponible") or estado.get("chunks", 0) == 0:
            return [], []
        resultados = buscar_chunks_relevantes(
            consulta_texto=transcripcion,
            top_k=TOP_K_CHUNKS_VECTORIAL,
            especialidad=especialidad,
            tipo_documento=tipo_documento,
        )
    except Exception as error:
        logger.warning("RAG: busqueda vectorial fallo, usando fallback (%s)", error)
        return [], []

    partes: list[str] = []
    fragmentos: list[str] = []
    for r in resultados:
        partes.append(r["texto"])
        fragmentos.append(f"vectorial:{r['archivo']}#{r['seccion']}:{r['score']:.2f}")
    return partes, fragmentos


def _construir_contexto_dinamico_clasico(
    especialidad: str, entidades: dict, intencion: str, longitud_categoria: str
) -> tuple[list[str], list[str]]:
    partes: list[str] = []
    fragmentos: list[str] = []

    if intencion not in INTENCIONES_MINIMALISTAS or longitud_categoria != "corta":
        contexto_especialidad = _cargar_contexto_por_especialidad(especialidad)
        if contexto_especialidad:
            partes.append(contexto_especialidad)
            fragmentos.append(f"especialidad:{especialidad}")

    farmacos = _cargar_terminologia_farmacologica_si_aplica(entidades)
    if farmacos:
        partes.append(farmacos)
        fragmentos.append("farmacos")

    cie10 = _cargar_codigos_cie10_si_hay_diagnostico(entidades, intencion)
    if cie10:
        partes.append(cie10)
        fragmentos.append("cie10")

    return partes, fragmentos


def obtener_contexto_relevante_para_consulta(
    especialidad: str,
    tipo_documento: str,
    entidades: dict,
    intencion: str = "consulta_general",
    longitud_categoria: str = "media",
    transcripcion: str = "",
) -> dict:
    partes: list[str] = []
    fragmentos_incluidos: list[str] = []

    base = _cargar_indicacion_base_del_sistema()
    if base:
        partes.append(base)
        fragmentos_incluidos.append("base_sistema")

    plantilla = _cargar_plantilla_por_tipo_documento(tipo_documento)
    if plantilla:
        partes.append(plantilla)
        fragmentos_incluidos.append(f"plantilla:{tipo_documento}")

    partes_dinamicas: list[str] = []
    fragmentos_dinamicos: list[str] = []

    if USAR_BUSQUEDA_VECTORIAL and transcripcion:
        partes_dinamicas, fragmentos_dinamicos = _construir_contexto_dinamico_vectorial(
            transcripcion=transcripcion,
            especialidad=especialidad,
            tipo_documento=tipo_documento,
        )

    if not partes_dinamicas:
        partes_dinamicas, fragmentos_dinamicos = _construir_contexto_dinamico_clasico(
            especialidad=especialidad,
            entidades=entidades,
            intencion=intencion,
            longitud_categoria=longitud_categoria,
        )

    partes.extend(partes_dinamicas)
    fragmentos_incluidos.extend(fragmentos_dinamicos)

    contexto_unido = "\n\n---\n\n".join(partes)
    return {
        "contexto": contexto_unido,
        "fragmentos_incluidos": fragmentos_incluidos,
        "tamano_caracteres": len(contexto_unido),
    }
