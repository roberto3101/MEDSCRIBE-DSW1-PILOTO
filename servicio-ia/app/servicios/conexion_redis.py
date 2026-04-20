import logging
import os
from functools import lru_cache

import redis

logger = logging.getLogger(__name__)

URL_REDIS = os.getenv("REDIS_URL", "redis://redis:6379/0")


@lru_cache(maxsize=1)
def obtener_cliente_redis() -> redis.Redis:
    cliente = redis.Redis.from_url(URL_REDIS, decode_responses=True, socket_connect_timeout=3, socket_timeout=3)
    try:
        cliente.ping()
        logger.info("Redis conectado en %s", URL_REDIS)
    except redis.exceptions.RedisError as error:
        logger.warning("Redis no disponible en %s (%s). Funciones que lo requieren estaran degradadas.", URL_REDIS, error)
    return cliente


def redis_esta_disponible() -> bool:
    try:
        obtener_cliente_redis().ping()
        return True
    except redis.exceptions.RedisError:
        return False
