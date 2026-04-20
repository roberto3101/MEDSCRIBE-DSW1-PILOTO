import hashlib
import json
import logging
from typing import Optional

import redis

from app.servicios.conexion_redis import obtener_cliente_redis

logger = logging.getLogger(__name__)

PREFIJO_CLAVE_IDEMPOTENCIA = "medscribe:idem:"
SEGUNDOS_RETENCION_RESULTADO = 86400
MAX_LONGITUD_CLAVE_CLIENTE = 120


def _construir_clave_redis_para_idempotencia(clave_cliente: str, huella_payload: str) -> str:
    clave_limpia = clave_cliente.strip()[:MAX_LONGITUD_CLAVE_CLIENTE]
    return f"{PREFIJO_CLAVE_IDEMPOTENCIA}{clave_limpia}:{huella_payload}"


def calcular_huella_payload(datos: dict) -> str:
    serializado = json.dumps(datos, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(serializado.encode("utf-8")).hexdigest()[:16]


def buscar_resultado_previo_para_clave(clave_cliente: str, huella_payload: str) -> Optional[dict]:
    if not clave_cliente:
        return None
    try:
        cliente = obtener_cliente_redis()
        clave_redis = _construir_clave_redis_para_idempotencia(clave_cliente, huella_payload)
        serializado = cliente.get(clave_redis)
        if serializado:
            logger.info("idempotencia: hit para clave=%s", clave_cliente[:20])
            return json.loads(serializado)
    except redis.exceptions.RedisError as error:
        logger.warning("idempotencia: Redis no disponible, se procesara sin deduplicacion (%s)", error)
    return None


def guardar_resultado_para_clave(clave_cliente: str, huella_payload: str, resultado: dict) -> None:
    if not clave_cliente:
        return
    try:
        cliente = obtener_cliente_redis()
        clave_redis = _construir_clave_redis_para_idempotencia(clave_cliente, huella_payload)
        cliente.setex(
            clave_redis,
            SEGUNDOS_RETENCION_RESULTADO,
            json.dumps(resultado, ensure_ascii=False, default=str),
        )
    except redis.exceptions.RedisError as error:
        logger.warning("idempotencia: no se pudo persistir resultado (%s)", error)
