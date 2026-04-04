from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.rutas import rutas_transcripcion, rutas_procesamiento, rutas_generacion
from app.rutas import rutas_documentos_guardados, rutas_configuracion

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
app.include_router(rutas_generacion.router, prefix="/api/ia", tags=["Generacion"])
app.include_router(rutas_documentos_guardados.router, prefix="/api/ia/documentos", tags=["Documentos"])
app.include_router(rutas_configuracion.router, prefix="/api/ia/configuracion", tags=["Configuracion"])


@app.get("/")
def verificar_estado_del_servicio():
    return {"servicio": "MedScribe AI", "estado": "activo"}
