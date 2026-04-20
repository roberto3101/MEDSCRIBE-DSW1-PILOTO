import logging
import time
import uuid

from fastapi import APIRouter, HTTPException

from app.esquemas.consulta import PeticionProcesamiento
from app.servicios.clasificador_intenciones import clasificar_transcripcion_por_especialidad
from app.servicios.servicio_claude import generar_nota_clinica_con_claude
from app.servicios.servicio_rag import obtener_contexto_relevante_para_consulta
from app.validadores.validador_consulta import (
    normalizar_especialidad,
    validar_clasificacion_estructurada,
    validar_peticion_procesamiento_completa,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/procesar")
async def procesar_transcripcion_medica(peticion: PeticionProcesamiento):
    request_id = uuid.uuid4().hex[:10]
    inicio_total = time.perf_counter()

    logger.info(
        "procesar: inicio request_id=%s tipo=%s especialidad=%s long_transcripcion=%d",
        request_id, peticion.tipo_documento, peticion.especialidad, len(peticion.transcripcion),
    )

    validar_peticion_procesamiento_completa(
        peticion.transcripcion, peticion.especialidad, peticion.tipo_documento
    )
    especialidad_normalizada = normalizar_especialidad(peticion.especialidad)

    try:
        inicio = time.perf_counter()
        clasificacion = clasificar_transcripcion_por_especialidad(
            peticion.transcripcion, especialidad_normalizada
        )
        duracion_clasificacion_ms = (time.perf_counter() - inicio) * 1000
        validar_clasificacion_estructurada(clasificacion)
        logger.info(
            "procesar: clasificacion request_id=%s especialidad=%s intencion=%s calidad=%.2f tiempo_ms=%.1f",
            request_id, clasificacion.get("especialidad"), clasificacion.get("intencion_principal"),
            clasificacion.get("calidad_estimada", 0.0), duracion_clasificacion_ms,
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("procesar: error en clasificacion request_id=%s", request_id)
        raise HTTPException(status_code=500, detail=f"Error al clasificar la transcripcion: {str(error)}")

    try:
        inicio = time.perf_counter()
        contexto_info = obtener_contexto_relevante_para_consulta(
            especialidad=clasificacion["especialidad"],
            tipo_documento=peticion.tipo_documento,
            entidades=clasificacion.get("entidades", {}),
            intencion=clasificacion.get("intencion_principal", "consulta_general"),
            longitud_categoria=clasificacion.get("longitud_categoria", "media"),
            transcripcion=peticion.transcripcion,
        )
        duracion_rag_ms = (time.perf_counter() - inicio) * 1000
        logger.info(
            "procesar: rag request_id=%s fragmentos=%s chars=%d tiempo_ms=%.1f",
            request_id, contexto_info["fragmentos_incluidos"],
            contexto_info["tamano_caracteres"], duracion_rag_ms,
        )
    except Exception as error:
        logger.exception("procesar: error en RAG request_id=%s", request_id)
        raise HTTPException(status_code=500, detail=f"Error al obtener contexto RAG: {str(error)}")

    try:
        inicio = time.perf_counter()
        nota_clinica = await generar_nota_clinica_con_claude(
            transcripcion=peticion.transcripcion,
            contexto=contexto_info["contexto"],
            tipo_documento=peticion.tipo_documento,
            clasificacion=clasificacion,
            request_id=request_id,
        )
        duracion_llm_ms = (time.perf_counter() - inicio) * 1000
        logger.info(
            "procesar: llm request_id=%s chars_respuesta=%d tiempo_ms=%.1f",
            request_id, len(nota_clinica), duracion_llm_ms,
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("procesar: error en LLM request_id=%s", request_id)
        raise HTTPException(status_code=500, detail=f"Error al generar nota clinica con IA: {str(error)}")

    duracion_total_ms = (time.perf_counter() - inicio_total) * 1000
    logger.info(
        "procesar: fin request_id=%s tiempo_total_ms=%.1f",
        request_id, duracion_total_ms,
    )

    return {
        "nota_clinica": nota_clinica,
        "clasificacion": clasificacion,
        "metadata": {
            "request_id": request_id,
            "fragmentos_rag": contexto_info["fragmentos_incluidos"],
            "tiempo_total_ms": round(duracion_total_ms, 1),
        },
    }
