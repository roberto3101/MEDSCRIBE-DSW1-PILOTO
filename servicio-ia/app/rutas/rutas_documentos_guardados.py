from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import json
import os
from datetime import datetime

router = APIRouter()

DIRECTORIO_DOCUMENTOS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "gateway-dotnet", "src", "MedScribe.API", "documentos-generados")


def _leer_metadata_sidecar(nombre_archivo: str) -> dict:
    nombre_base = nombre_archivo.rsplit(".", 1)[0]
    ruta_meta = os.path.join(DIRECTORIO_DOCUMENTOS, f"{nombre_base}.meta.json")
    if not os.path.exists(ruta_meta):
        return {}
    try:
        with open(ruta_meta, "r", encoding="utf-8") as archivo_meta:
            return json.load(archivo_meta)
    except (OSError, json.JSONDecodeError):
        return {}


@router.get("/listar")
async def listar_documentos_generados(
    tipo: str = "",
    formato: str = "",
    busqueda: str = "",
    pagina: int = 1,
    por_pagina: int = 12,
):
    if not os.path.exists(DIRECTORIO_DOCUMENTOS):
        return {"documentos": []}

    archivos = os.listdir(DIRECTORIO_DOCUMENTOS)
    documentos = []

    for nombre in sorted(archivos, reverse=True):
        ruta = os.path.join(DIRECTORIO_DOCUMENTOS, nombre)
        if not os.path.isfile(ruta):
            continue

        extension = nombre.rsplit(".", 1)[-1].lower() if "." in nombre else ""
        if extension not in ("pdf", "docx"):
            continue

        tamano = os.path.getsize(ruta)
        fecha_modificacion = datetime.fromtimestamp(os.path.getmtime(ruta))

        partes = nombre.replace("MedScribe_", "").rsplit(".", 1)[0].split("_")
        tipo_documento = partes[0] if len(partes) > 0 else "Desconocido"
        formato_archivo = "PDF" if extension == "pdf" else "Word"

        metadata = _leer_metadata_sidecar(nombre)
        nombre_paciente = metadata.get("nombre_paciente", "") or ""
        especialidad = metadata.get("especialidad", "") or ""

        if tipo and tipo_documento.lower() != tipo.lower():
            continue
        if formato and formato_archivo.lower() != formato.lower():
            continue
        if busqueda:
            termino = busqueda.lower()
            en_nombre_archivo = termino in nombre.lower()
            en_paciente = termino in nombre_paciente.lower()
            en_especialidad = termino in especialidad.lower()
            if not (en_nombre_archivo or en_paciente or en_especialidad):
                continue

        documentos.append({
            "nombre_archivo": nombre,
            "tipo_documento": tipo_documento,
            "formato": formato_archivo,
            "tamano_bytes": tamano,
            "tamano_legible": f"{tamano / 1024:.1f} KB" if tamano < 1048576 else f"{tamano / 1048576:.1f} MB",
            "fecha_generacion": fecha_modificacion.isoformat(),
            "fecha_legible": fecha_modificacion.strftime("%d/%m/%Y %H:%M"),
            "nombre_paciente": nombre_paciente,
            "especialidad": especialidad,
        })

    total = len(documentos)
    inicio = (pagina - 1) * por_pagina
    fin = inicio + por_pagina
    documentos_paginados = documentos[inicio:fin]
    total_paginas = (total + por_pagina - 1) // por_pagina

    return {
        "documentos": documentos_paginados,
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "total_paginas": total_paginas,
    }


@router.get("/descargar/{nombre_archivo}")
async def descargar_documento_por_nombre(nombre_archivo: str):
    nombre_limpio = os.path.basename(nombre_archivo)
    ruta = os.path.join(DIRECTORIO_DOCUMENTOS, nombre_limpio)

    if not os.path.exists(ruta):
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    extension = nombre_limpio.rsplit(".", 1)[-1].lower()
    tipo_mime = "application/pdf" if extension == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(ruta, media_type=tipo_mime, filename=nombre_limpio)
