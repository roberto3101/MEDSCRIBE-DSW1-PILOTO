from dotenv import load_dotenv
from pathlib import Path
import logging
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.rutas import rutas_transcripcion, rutas_procesamiento, rutas_generacion
from app.rutas import rutas_documentos_guardados, rutas_configuracion, rutas_trabajos

app = FastAPI(
    title="MedScribe AI - Servicio de Inteligencia Artificial",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rutas_transcripcion.router, prefix="/api/ia", tags=["Transcripcion"])
app.include_router(rutas_procesamiento.router, prefix="/api/ia", tags=["Procesamiento"])
app.include_router(rutas_trabajos.router, prefix="/api/ia", tags=["Trabajos"])
app.include_router(rutas_generacion.router, prefix="/api/ia", tags=["Generacion"])
app.include_router(rutas_documentos_guardados.router, prefix="/api/ia/documentos", tags=["Documentos"])
app.include_router(rutas_configuracion.router, prefix="/api/ia/configuracion", tags=["Configuracion"])


@app.get("/")
def verificar_estado_del_servicio():
    return {"servicio": "MedScribe AI", "estado": "activo"}


@app.on_event("startup")
def indexar_rag_vectorial_si_corresponde():
    import threading
    import logging as _logging

    def _tarea_indexacion():
        try:
            from app.servicios.indice_vectorial import (
                consultar_estado_indice,
                reindexar_todos_los_documentos_rag,
            )
            estado = consultar_estado_indice()
            if not estado.get("disponible"):
                _logging.getLogger(__name__).warning("Startup: Qdrant no disponible, indexado RAG vectorial omitido")
                return
            if estado.get("chunks", 0) > 0:
                _logging.getLogger(__name__).info("Startup: indice vectorial ya contiene %d chunks, no se reindexa", estado["chunks"])
                return
            _logging.getLogger(__name__).info("Startup: indice vectorial vacio, iniciando indexado inicial")
            resumen = reindexar_todos_los_documentos_rag()
            _logging.getLogger(__name__).info("Startup: indexado inicial completo %s", resumen)
        except Exception as error:
            _logging.getLogger(__name__).warning("Startup: indexado RAG vectorial fallo, fallback activo (%s)", error)

    threading.Thread(target=_tarea_indexacion, daemon=True).start()
