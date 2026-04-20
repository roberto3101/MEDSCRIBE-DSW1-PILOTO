import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

import redis

from app.servicios.conexion_redis import obtener_cliente_redis

logger = logging.getLogger(__name__)

PREFIJO_CLAVE_TRABAJO = "medscribe:trabajo:"
CLAVE_LISTA_DLQ = "medscribe:dlq:trabajos_fallidos"
SEGUNDOS_RETENCION_TRABAJO = 172800
SEGUNDOS_RETENCION_DLQ = 604800

ESTADO_EN_COLA = "en_cola"
ESTADO_TRANSCRIBIENDO = "transcribiendo"
ESTADO_CLASIFICANDO = "clasificando"
ESTADO_CONSULTANDO_RAG = "consultando_rag"
ESTADO_GENERANDO_LLM = "generando_llm"
ESTADO_COMPLETADO = "completado"
ESTADO_FALLIDO = "fallido"


def _clave_redis(job_id: str) -> str:
    return f"{PREFIJO_CLAVE_TRABAJO}{job_id}"


def _iso_utc_ahora() -> str:
    return datetime.now(timezone.utc).isoformat()


def crear_trabajo_en_almacen(datos_iniciales: dict) -> str:
    job_id = uuid.uuid4().hex
    registro = {
        "job_id": job_id,
        "estado": ESTADO_EN_COLA,
        "creado_en": _iso_utc_ahora(),
        "actualizado_en": _iso_utc_ahora(),
        "resultado": None,
        "error": None,
        "etapas_completadas": [],
        "datos_iniciales": datos_iniciales,
    }
    try:
        cliente = obtener_cliente_redis()
        cliente.setex(_clave_redis(job_id), SEGUNDOS_RETENCION_TRABAJO, json.dumps(registro, ensure_ascii=False, default=str))
    except redis.exceptions.RedisError as error:
        logger.error("almacen_trabajos: no se pudo crear trabajo %s (%s)", job_id, error)
        raise
    return job_id


def leer_trabajo_del_almacen(job_id: str) -> Optional[dict]:
    try:
        cliente = obtener_cliente_redis()
        serializado = cliente.get(_clave_redis(job_id))
        if serializado:
            return json.loads(serializado)
    except redis.exceptions.RedisError as error:
        logger.warning("almacen_trabajos: error leyendo trabajo %s (%s)", job_id, error)
    return None


def actualizar_trabajo_con_cambios(job_id: str, cambios: dict) -> Optional[dict]:
    try:
        cliente = obtener_cliente_redis()
        clave = _clave_redis(job_id)
        serializado = cliente.get(clave)
        if not serializado:
            logger.warning("almacen_trabajos: trabajo %s no encontrado para actualizar", job_id)
            return None
        registro = json.loads(serializado)
        registro.update(cambios)
        registro["actualizado_en"] = _iso_utc_ahora()
        if cambios.get("etapa_recien_completada"):
            registro.setdefault("etapas_completadas", []).append(cambios["etapa_recien_completada"])
            registro.pop("etapa_recien_completada", None)
        cliente.setex(clave, SEGUNDOS_RETENCION_TRABAJO, json.dumps(registro, ensure_ascii=False, default=str))
        return registro
    except redis.exceptions.RedisError as error:
        logger.error("almacen_trabajos: error actualizando %s (%s)", job_id, error)
        return None


def marcar_trabajo_completado(job_id: str, resultado: dict) -> None:
    actualizar_trabajo_con_cambios(job_id, {
        "estado": ESTADO_COMPLETADO,
        "resultado": resultado,
    })


def marcar_trabajo_fallido_y_enviar_a_dlq(job_id: str, detalle_error: str, etapa_fallida: str) -> None:
    registro = actualizar_trabajo_con_cambios(job_id, {
        "estado": ESTADO_FALLIDO,
        "error": {"detalle": detalle_error, "etapa": etapa_fallida, "timestamp": _iso_utc_ahora()},
    })
    try:
        cliente = obtener_cliente_redis()
        entrada_dlq = {
            "job_id": job_id,
            "error": detalle_error,
            "etapa": etapa_fallida,
            "registrado_en": _iso_utc_ahora(),
            "snapshot": registro,
        }
        cliente.lpush(CLAVE_LISTA_DLQ, json.dumps(entrada_dlq, ensure_ascii=False, default=str))
        cliente.ltrim(CLAVE_LISTA_DLQ, 0, 999)
        cliente.expire(CLAVE_LISTA_DLQ, SEGUNDOS_RETENCION_DLQ)
        logger.error("almacen_trabajos: job_id=%s enviado a DLQ (etapa=%s)", job_id, etapa_fallida)
    except redis.exceptions.RedisError as error:
        logger.error("almacen_trabajos: no se pudo escribir a DLQ (%s)", error)


def listar_trabajos_en_dlq(limite: int = 50) -> list:
    try:
        cliente = obtener_cliente_redis()
        crudos = cliente.lrange(CLAVE_LISTA_DLQ, 0, max(0, limite - 1))
        return [json.loads(item) for item in crudos]
    except redis.exceptions.RedisError as error:
        logger.warning("almacen_trabajos: error listando DLQ (%s)", error)
        return []


def esperar_hasta_completar(job_id: str, timeout_segundos: float = 90.0, intervalo_polling: float = 0.4) -> dict:
    deadline = time.monotonic() + timeout_segundos
    while time.monotonic() < deadline:
        registro = leer_trabajo_del_almacen(job_id)
        if registro and registro.get("estado") in {ESTADO_COMPLETADO, ESTADO_FALLIDO}:
            return registro
        time.sleep(intervalo_polling)
    raise TimeoutError(f"Trabajo {job_id} no completo dentro de {timeout_segundos}s")


async def esperar_hasta_completar_async(job_id: str, timeout_segundos: float = 90.0, intervalo_polling: float = 0.4) -> dict:
    deadline = time.monotonic() + timeout_segundos
    while time.monotonic() < deadline:
        registro = leer_trabajo_del_almacen(job_id)
        if registro and registro.get("estado") in {ESTADO_COMPLETADO, ESTADO_FALLIDO}:
            return registro
        await asyncio.sleep(intervalo_polling)
    raise TimeoutError(f"Trabajo {job_id} no completo dentro de {timeout_segundos}s")
