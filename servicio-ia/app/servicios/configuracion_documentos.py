import os
import json

_DIRECTORIO_PERSISTENTE = os.environ.get(
    "MEDSCRIBE_CONFIG_DIR",
    "/app/documentos-salida" if os.path.isdir("/app/documentos-salida") else os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "documentos-salida",
    ),
)
os.makedirs(_DIRECTORIO_PERSISTENTE, exist_ok=True)

RUTA_CONFIGURACION = os.path.join(_DIRECTORIO_PERSISTENTE, "config_documentos.json")

CONFIGURACION_POR_DEFECTO = {
    "nombre_clinica": "MedScribe AI",
    "ruc": "",
    "direccion": "",
    "telefono": "",
    "correo": "",
    "logo_path": "",
    "nombre_medico": "",
    "colegiatura": "",
    "especialidad_medico": "",
    "color_primario": "#0369a1",
    "formato_documento": "moderno_medico",
    "firma_medico": "",
    "firma_clinica": "",
}


def obtener_configuracion_de_documentos() -> dict:
    if os.path.exists(RUTA_CONFIGURACION):
        with open(RUTA_CONFIGURACION, "r", encoding="utf-8") as f:
            config_guardada = json.load(f)
            return {**CONFIGURACION_POR_DEFECTO, **config_guardada}
    return CONFIGURACION_POR_DEFECTO.copy()


def guardar_configuracion_de_documentos(config: dict) -> dict:
    os.makedirs(os.path.dirname(RUTA_CONFIGURACION), exist_ok=True)
    config_final = {**CONFIGURACION_POR_DEFECTO, **config}
    with open(RUTA_CONFIGURACION, "w", encoding="utf-8") as f:
        json.dump(config_final, f, ensure_ascii=False, indent=2)
    return config_final
