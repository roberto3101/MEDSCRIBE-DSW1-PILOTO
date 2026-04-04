from fastapi import APIRouter, HTTPException
from app.esquemas.consulta import PeticionProcesamiento
from app.servicios.clasificador_intenciones import clasificar_transcripcion_por_especialidad
from app.servicios.servicio_rag import obtener_contexto_relevante_para_consulta
from app.servicios.servicio_claude import generar_nota_clinica_con_claude
from app.validadores.validador_consulta import validar_peticion_procesamiento_completa, normalizar_especialidad

router = APIRouter()


@router.post("/procesar")
async def procesar_transcripcion_medica(peticion: PeticionProcesamiento):
    validar_peticion_procesamiento_completa(
        peticion.transcripcion, peticion.especialidad, peticion.tipo_documento
    )

    especialidad_normalizada = normalizar_especialidad(peticion.especialidad)

    try:
        clasificacion = clasificar_transcripcion_por_especialidad(
            peticion.transcripcion, especialidad_normalizada
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Error al clasificar la transcripcion: {str(error)}"
        )

    try:
        contexto = obtener_contexto_relevante_para_consulta(
            especialidad=clasificacion["especialidad"],
            tipo_documento=peticion.tipo_documento,
            entidades=clasificacion["entidades"]
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener contexto RAG: {str(error)}"
        )

    try:
        nota_clinica = await generar_nota_clinica_con_claude(
            transcripcion=peticion.transcripcion,
            contexto=contexto,
            tipo_documento=peticion.tipo_documento,
            clasificacion=clasificacion
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar nota clinica con IA: {str(error)}"
        )

    return {
        "nota_clinica": nota_clinica,
        "clasificacion": clasificacion
    }
