import asyncio
import logging
import time
import uuid
from typing import Any

from app.servicios.almacen_trabajos import (
    ESTADO_CLASIFICANDO,
    ESTADO_CONSULTANDO_RAG,
    ESTADO_GENERANDO_LLM,
    actualizar_trabajo_con_cambios,
    marcar_trabajo_completado,
    marcar_trabajo_fallido_y_enviar_a_dlq,
)
from app.servicios.clasificador_intenciones import clasificar_transcripcion_por_especialidad
from app.servicios.servicio_claude import generar_nota_clinica_con_claude
from app.servicios.servicio_rag import obtener_contexto_relevante_para_consulta
from app.validadores.validador_consulta import (
    normalizar_especialidad,
    validar_clasificacion_estructurada,
    validar_peticion_procesamiento_completa,
)
from app.versiones import obtener_descriptor_version_pipeline

logger = logging.getLogger(__name__)


async def ejecutar_pipeline_de_nota_clinica(
    transcripcion: str,
    especialidad: str,
    tipo_documento: str,
    request_id: str = "",
    job_id: str = "",
) -> dict[str, Any]:
    request_id = request_id or uuid.uuid4().hex[:10]
    inicio_total = time.perf_counter()
    descriptor_version = obtener_descriptor_version_pipeline()

    logger.info(
        "pipeline: inicio request_id=%s job_id=%s tipo=%s especialidad=%s long_transcripcion=%d",
        request_id, job_id or "-", tipo_documento, especialidad, len(transcripcion),
    )

    validar_peticion_procesamiento_completa(transcripcion, especialidad, tipo_documento)
    especialidad_normalizada = normalizar_especialidad(especialidad)

    if job_id:
        actualizar_trabajo_con_cambios(job_id, {"estado": ESTADO_CLASIFICANDO})

    inicio = time.perf_counter()
    clasificacion = clasificar_transcripcion_por_especialidad(transcripcion, especialidad_normalizada)
    duracion_clasificacion_ms = (time.perf_counter() - inicio) * 1000
    validar_clasificacion_estructurada(clasificacion)
    logger.info(
        "pipeline: clasificacion request_id=%s especialidad=%s intencion=%s calidad=%.2f tiempo_ms=%.1f",
        request_id, clasificacion.get("especialidad"), clasificacion.get("intencion_principal"),
        clasificacion.get("calidad_estimada", 0.0), duracion_clasificacion_ms,
    )
    if job_id:
        actualizar_trabajo_con_cambios(job_id, {
            "estado": ESTADO_CONSULTANDO_RAG,
            "clasificacion": clasificacion,
            "etapa_recien_completada": "clasificacion",
        })

    inicio = time.perf_counter()
    contexto_info = obtener_contexto_relevante_para_consulta(
        especialidad=clasificacion["especialidad"],
        tipo_documento=tipo_documento,
        entidades=clasificacion.get("entidades", {}),
        intencion=clasificacion.get("intencion_principal", "consulta_general"),
        longitud_categoria=clasificacion.get("longitud_categoria", "media"),
        transcripcion=transcripcion,
    )
    duracion_rag_ms = (time.perf_counter() - inicio) * 1000
    logger.info(
        "pipeline: rag request_id=%s fragmentos=%s chars=%d tiempo_ms=%.1f",
        request_id, contexto_info["fragmentos_incluidos"],
        contexto_info["tamano_caracteres"], duracion_rag_ms,
    )
    if job_id:
        actualizar_trabajo_con_cambios(job_id, {
            "estado": ESTADO_GENERANDO_LLM,
            "fragmentos_rag": contexto_info["fragmentos_incluidos"],
            "etapa_recien_completada": "rag",
        })

    inicio = time.perf_counter()
    nota_clinica = await generar_nota_clinica_con_claude(
        transcripcion=transcripcion,
        contexto=contexto_info["contexto"],
        tipo_documento=tipo_documento,
        clasificacion=clasificacion,
        request_id=request_id,
    )
    duracion_llm_ms = (time.perf_counter() - inicio) * 1000
    duracion_total_ms = (time.perf_counter() - inicio_total) * 1000
    logger.info(
        "pipeline: fin request_id=%s chars_respuesta=%d tiempo_llm_ms=%.1f tiempo_total_ms=%.1f",
        request_id, len(nota_clinica), duracion_llm_ms, duracion_total_ms,
    )

    resultado = {
        "nota_clinica": nota_clinica,
        "clasificacion": clasificacion,
        "metadata": {
            "request_id": request_id,
            "job_id": job_id or None,
            "fragmentos_rag": contexto_info["fragmentos_incluidos"],
            "tiempo_total_ms": round(duracion_total_ms, 1),
            "tiempos_por_etapa_ms": {
                "clasificacion": round(duracion_clasificacion_ms, 1),
                "rag": round(duracion_rag_ms, 1),
                "llm": round(duracion_llm_ms, 1),
            },
            "version_pipeline": descriptor_version,
        },
    }
    return resultado


def ejecutar_pipeline_sincrono_para_worker(
    job_id: str,
    transcripcion: str,
    especialidad: str,
    tipo_documento: str,
    request_id: str = "",
) -> None:
    try:
        resultado = asyncio.run(ejecutar_pipeline_de_nota_clinica(
            transcripcion=transcripcion,
            especialidad=especialidad,
            tipo_documento=tipo_documento,
            request_id=request_id,
            job_id=job_id,
        ))
        marcar_trabajo_completado(job_id, resultado)
    except Exception as error:
        etapa = "desconocida"
        try:
            from app.servicios.almacen_trabajos import leer_trabajo_del_almacen
            snapshot = leer_trabajo_del_almacen(job_id)
            if snapshot:
                etapa = snapshot.get("estado", "desconocida")
        except Exception:
            pass
        marcar_trabajo_fallido_y_enviar_a_dlq(job_id, f"{type(error).__name__}: {error}", etapa)
        raise
