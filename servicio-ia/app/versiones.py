import hashlib
import os
from functools import lru_cache

VERSION_CLASIFICADOR = "clasificador-v2.0.0"
VERSION_RAG = "rag-v1.1.0"
VERSION_PROMPT_SISTEMA = "prompt-v1.2.0"
VERSION_PIPELINE = "pipeline-v2.0.0"


def _calcular_hash_corto_de_archivo(ruta_absoluta: str) -> str:
    try:
        with open(ruta_absoluta, "rb") as archivo:
            contenido = archivo.read()
        return hashlib.sha256(contenido).hexdigest()[:10]
    except FileNotFoundError:
        return "inexistente"


@lru_cache(maxsize=1)
def calcular_huella_artefactos_pipeline() -> dict:
    directorio_base = os.path.dirname(os.path.abspath(__file__))
    ruta_indicaciones = os.path.join(directorio_base, "indicaciones")
    archivos_criticos = {
        "base_sistema": os.path.join(ruta_indicaciones, "base_sistema.md"),
        "nota_soap": os.path.join(ruta_indicaciones, "nota_soap.md"),
        "historia_clinica": os.path.join(ruta_indicaciones, "historia_clinica.md"),
        "receta": os.path.join(ruta_indicaciones, "receta.md"),
    }
    return {
        nombre: _calcular_hash_corto_de_archivo(ruta)
        for nombre, ruta in archivos_criticos.items()
    }


def obtener_descriptor_version_pipeline() -> dict:
    return {
        "pipeline": VERSION_PIPELINE,
        "clasificador": VERSION_CLASIFICADOR,
        "rag": VERSION_RAG,
        "prompt_sistema": VERSION_PROMPT_SISTEMA,
        "modelo_llm": os.getenv("AI_MODEL", "llama-3.3-70b-versatile"),
        "huella_artefactos": calcular_huella_artefactos_pipeline(),
    }
