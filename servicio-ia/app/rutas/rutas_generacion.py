from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from app.esquemas.documento import PeticionGeneracion, PeticionGenerarYGuardar
from app.servicios.generador_pdf import generar_pdf_desde_nota_clinica
from app.servicios.generador_word import generar_word_desde_nota_clinica
from app.servicios.configuracion_documentos import obtener_configuracion_de_documentos
import io
import os
import uuid
from datetime import datetime

router = APIRouter()

DIRECTORIO_DOCUMENTOS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "gateway-dotnet", "src", "MedScribe.API", "documentos-generados")


def _asegurar_directorio_existe():
    os.makedirs(DIRECTORIO_DOCUMENTOS, exist_ok=True)


def _generar_nombre_archivo(tipo_documento: str, formato: str) -> str:
    fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
    identificador = str(uuid.uuid4())[:8]
    return f"MedScribe_{tipo_documento}_{fecha}_{identificador}.{formato}"


def _config_con_paciente(peticion: PeticionGeneracion) -> dict:
    config = obtener_configuracion_de_documentos()
    if peticion.paciente:
        config["paciente"] = peticion.paciente.model_dump()
    if peticion.especialidad:
        config["especialidad_consulta"] = peticion.especialidad
    return config


@router.post("/generar-pdf")
async def generar_documento_pdf_desde_nota(peticion: PeticionGeneracion):
    try:
        config = _config_con_paciente(peticion)
        archivo_bytes = generar_pdf_desde_nota_clinica(peticion.nota_clinica, peticion.tipo_documento, config)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error al generar el PDF: {str(error)}")

    _asegurar_directorio_existe()
    nombre_archivo = _generar_nombre_archivo(peticion.tipo_documento, "pdf")
    ruta_completa = os.path.join(DIRECTORIO_DOCUMENTOS, nombre_archivo)

    with open(ruta_completa, "wb") as archivo:
        archivo.write(archivo_bytes)

    return StreamingResponse(
        io.BytesIO(archivo_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={nombre_archivo}",
            "X-Ruta-Archivo": ruta_completa,
            "X-Nombre-Archivo": nombre_archivo,
        },
    )


@router.post("/generar-word")
async def generar_documento_word_desde_nota(peticion: PeticionGeneracion):
    try:
        config = _config_con_paciente(peticion)
        archivo_bytes = generar_word_desde_nota_clinica(peticion.nota_clinica, peticion.tipo_documento, config)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error al generar el Word: {str(error)}")

    _asegurar_directorio_existe()
    nombre_archivo = _generar_nombre_archivo(peticion.tipo_documento, "docx")
    ruta_completa = os.path.join(DIRECTORIO_DOCUMENTOS, nombre_archivo)

    with open(ruta_completa, "wb") as archivo:
        archivo.write(archivo_bytes)

    return StreamingResponse(
        io.BytesIO(archivo_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename={nombre_archivo}",
            "X-Ruta-Archivo": ruta_completa,
            "X-Nombre-Archivo": nombre_archivo,
        },
    )


@router.post("/generar-y-guardar")
async def generar_documento_guardar_en_disco_y_retornar_metadata(peticion: PeticionGenerarYGuardar):
    _asegurar_directorio_existe()
    archivos_generados = []

    try:
        config = obtener_configuracion_de_documentos()
        nombre_pdf = _generar_nombre_archivo(peticion.tipo_documento, "pdf")
        ruta_pdf = os.path.join(DIRECTORIO_DOCUMENTOS, nombre_pdf)
        bytes_pdf = generar_pdf_desde_nota_clinica(peticion.nota_clinica, peticion.tipo_documento, config)
        with open(ruta_pdf, "wb") as f:
            f.write(bytes_pdf)
        archivos_generados.append({
            "formato": "PDF",
            "nombre_archivo": nombre_pdf,
            "ruta_archivo": ruta_pdf,
            "tamano_bytes": len(bytes_pdf),
        })
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(error)}")

    try:
        nombre_word = _generar_nombre_archivo(peticion.tipo_documento, "docx")
        ruta_word = os.path.join(DIRECTORIO_DOCUMENTOS, nombre_word)
        bytes_word = generar_word_desde_nota_clinica(peticion.nota_clinica, peticion.tipo_documento, config)
        with open(ruta_word, "wb") as f:
            f.write(bytes_word)
        archivos_generados.append({
            "formato": "Word",
            "nombre_archivo": nombre_word,
            "ruta_archivo": ruta_word,
            "tamano_bytes": len(bytes_word),
        })
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Error al generar Word: {str(error)}")

    return {
        "mensaje": "Documentos generados y guardados exitosamente",
        "tipo_documento": peticion.tipo_documento,
        "archivos": archivos_generados,
    }
