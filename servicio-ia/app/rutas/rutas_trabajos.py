import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from app.esquemas.consulta import PeticionProcesamiento
from app.servicios.almacen_trabajos import (
    ESTADO_COMPLETADO,
    ESTADO_FALLIDO,
    crear_trabajo_en_almacen,
    esperar_hasta_completar_async,
    leer_trabajo_del_almacen,
    listar_trabajos_en_dlq,
)
from app.servicios.circuito_llm import circuito_llm_global
from app.servicios.cola_trabajos import encolar_pipeline_nota_clinica
from app.servicios.conexion_redis import redis_esta_disponible
from app.servicios.indice_vectorial import (
    buscar_chunks_relevantes,
    consultar_estado_indice,
    reindexar_todos_los_documentos_rag,
)
from app.servicios.servicio_claude import verificar_salud_llm
from app.servicios.servicio_rag import limpiar_cache_rag
from app.servicios.idempotencia import (
    buscar_resultado_previo_para_clave,
    calcular_huella_payload,
    guardar_resultado_para_clave,
)
from app.validadores.validador_consulta import (
    normalizar_especialidad,
    validar_peticion_procesamiento_completa,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/procesar-async", status_code=202)
async def encolar_procesamiento_transcripcion_medica(
    peticion: PeticionProcesamiento,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
):
    request_id = uuid.uuid4().hex[:10]
    validar_peticion_procesamiento_completa(
        peticion.transcripcion, peticion.especialidad, peticion.tipo_documento
    )
    especialidad_normalizada = normalizar_especialidad(peticion.especialidad)

    payload_huella = {
        "transcripcion": peticion.transcripcion,
        "especialidad": especialidad_normalizada,
        "tipo_documento": peticion.tipo_documento,
    }
    huella = calcular_huella_payload(payload_huella)

    if idempotency_key:
        resultado_previo = buscar_resultado_previo_para_clave(idempotency_key, huella)
        if resultado_previo:
            logger.info(
                "procesar-async: idempotencia hit request_id=%s clave=%s",
                request_id, idempotency_key[:20],
            )
            return {
                "job_id": resultado_previo.get("job_id"),
                "estado": ESTADO_COMPLETADO,
                "resultado": resultado_previo,
                "reutilizado_por_idempotencia": True,
            }

    if not redis_esta_disponible():
        raise HTTPException(
            status_code=503,
            detail="Cola de trabajos no disponible (Redis caido). Use /procesar (sincrono) como respaldo.",
        )

    job_id = crear_trabajo_en_almacen({
        "especialidad": especialidad_normalizada,
        "tipo_documento": peticion.tipo_documento,
        "longitud_transcripcion": len(peticion.transcripcion),
        "request_id": request_id,
        "idempotency_key": idempotency_key or None,
        "huella_payload": huella,
    })

    try:
        encolar_pipeline_nota_clinica(
            job_id=job_id,
            transcripcion=peticion.transcripcion,
            especialidad=especialidad_normalizada,
            tipo_documento=peticion.tipo_documento,
            request_id=request_id,
        )
    except Exception as error:
        logger.exception("procesar-async: fallo al encolar request_id=%s", request_id)
        raise HTTPException(status_code=503, detail=f"No se pudo encolar el trabajo: {error}")

    logger.info(
        "procesar-async: encolado request_id=%s job_id=%s tipo=%s especialidad=%s",
        request_id, job_id, peticion.tipo_documento, especialidad_normalizada,
    )

    return {
        "job_id": job_id,
        "estado": "en_cola",
        "request_id": request_id,
        "endpoint_polling": f"/api/ia/procesar-async/{job_id}",
    }


@router.get("/procesar-async/{job_id}")
async def consultar_estado_trabajo(
    job_id: str,
    esperar: bool = Query(default=False, description="Si es true, bloquea hasta que el trabajo termine"),
    timeout_segundos: float = Query(default=60.0, ge=1.0, le=300.0),
):
    if esperar:
        try:
            registro = await esperar_hasta_completar_async(job_id, timeout_segundos=timeout_segundos)
        except TimeoutError as error:
            raise HTTPException(status_code=408, detail=str(error))
    else:
        registro = leer_trabajo_del_almacen(job_id)
        if not registro:
            raise HTTPException(status_code=404, detail=f"Trabajo {job_id} no encontrado o expirado")

    estado = registro.get("estado")

    if estado == ESTADO_COMPLETADO and not registro.get("idempotencia_persistida"):
        resultado = registro.get("resultado") or {}
        datos_iniciales = registro.get("datos_iniciales", {}) or {}
        clave_idempotencia = datos_iniciales.get("idempotency_key")
        huella = datos_iniciales.get("huella_payload")
        if clave_idempotencia and huella:
            resultado_con_job = {**resultado, "job_id": job_id}
            guardar_resultado_para_clave(clave_idempotencia, huella, resultado_con_job)
            from app.servicios.almacen_trabajos import actualizar_trabajo_con_cambios
            actualizar_trabajo_con_cambios(job_id, {"idempotencia_persistida": True})

    return registro


@router.get("/diagnostico/circuito")
def consultar_estado_circuito_llm():
    return circuito_llm_global.consultar_estado()


@router.get("/diagnostico/dlq")
def consultar_trabajos_en_dlq(limite: int = Query(default=50, ge=1, le=500)):
    return {"trabajos": listar_trabajos_en_dlq(limite=limite)}


@router.get("/diagnostico/salud-redis")
def consultar_salud_redis():
    disponible = redis_esta_disponible()
    return {"redis_disponible": disponible}


@router.get("/diagnostico/salud-llm")
def consultar_salud_llm():
    return verificar_salud_llm()


@router.post("/diagnostico/limpiar-cache-rag")
def forzar_limpieza_cache_rag():
    entradas_eliminadas = limpiar_cache_rag()
    return {"entradas_eliminadas": entradas_eliminadas}


@router.get("/diagnostico/indice-vectorial")
def consultar_estado_indice_vectorial():
    return consultar_estado_indice()


@router.post("/diagnostico/reindexar-vectorial")
def forzar_reindexado_vectorial(forzar_recreacion: bool = Query(default=False)):
    return reindexar_todos_los_documentos_rag(forzar_recreacion=forzar_recreacion)


@router.get("/diagnostico/buscar-chunks")
def buscar_chunks_diagnostico(
    consulta: str = Query(..., min_length=3),
    top_k: int = Query(default=5, ge=1, le=20),
    especialidad: Optional[str] = Query(default=None),
    tipo_documento: Optional[str] = Query(default=None),
):
    resultados = buscar_chunks_relevantes(
        consulta_texto=consulta,
        top_k=top_k,
        especialidad=especialidad,
        tipo_documento=tipo_documento,
    )
    return {
        "consulta": consulta,
        "total": len(resultados),
        "resultados": [
            {"score": r["score"], "archivo": r["archivo"], "seccion": r["seccion"],
             "categoria": r["categoria"], "especialidad": r["especialidad"],
             "preview": r["texto"][:200] + ("..." if len(r["texto"]) > 200 else "")}
            for r in resultados
        ],
    }
