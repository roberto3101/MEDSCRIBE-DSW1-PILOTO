import logging
import os
from functools import lru_cache

from rq import Queue

from app.servicios.conexion_redis import obtener_cliente_redis

logger = logging.getLogger(__name__)

NOMBRE_COLA_PIPELINE = "pipeline_nota_clinica"
TIMEOUT_TRABAJO_SEGUNDOS = int(os.getenv("TIMEOUT_TRABAJO_PIPELINE_SEGUNDOS", "300"))
TTL_RESULTADO_SEGUNDOS = int(os.getenv("TTL_RESULTADO_RQ_SEGUNDOS", "3600"))


@lru_cache(maxsize=1)
def obtener_cola_pipeline() -> Queue:
    cliente_redis = obtener_cliente_redis()
    return Queue(
        name=NOMBRE_COLA_PIPELINE,
        connection=cliente_redis,
        default_timeout=TIMEOUT_TRABAJO_SEGUNDOS,
    )


def encolar_pipeline_nota_clinica(
    job_id: str,
    transcripcion: str,
    especialidad: str,
    tipo_documento: str,
    request_id: str,
) -> None:
    cola = obtener_cola_pipeline()
    cola.enqueue(
        "app.servicios.pipeline_nota_clinica.ejecutar_pipeline_sincrono_para_worker",
        kwargs={
            "job_id": job_id,
            "transcripcion": transcripcion,
            "especialidad": especialidad,
            "tipo_documento": tipo_documento,
            "request_id": request_id,
        },
        result_ttl=TTL_RESULTADO_SEGUNDOS,
        failure_ttl=TTL_RESULTADO_SEGUNDOS,
        job_id=job_id,
    )
    logger.info("cola_trabajos: job_id=%s encolado en %s", job_id, NOMBRE_COLA_PIPELINE)
