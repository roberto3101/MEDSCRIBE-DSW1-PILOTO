FORMATOS_DISPONIBLES = {
    "clasico_minsa": {
        "nombre": "Clasico MINSA",
        "descripcion": "Formato oficial del Ministerio de Salud del Peru. Bordes dobles, secciones con fondo gris claro, tipografia serif.",
        "colores": {
            "primario": "#1a365d",
            "secundario": "#2d3748",
            "fondo_seccion": "#f7fafc",
            "borde": "#cbd5e0",
            "acento": "#2b6cb0",
            "texto": "#1a202c",
            "texto_suave": "#718096",
        },
        "fuente_titulo": "Times-Bold",
        "fuente_cuerpo": "Times-Roman",
        "borde_seccion": True,
        "doble_linea_encabezado": True,
        "fondo_titulo": "#edf2f7",
    },
    "moderno_medico": {
        "nombre": "Moderno Medico",
        "descripcion": "Diseno contemporaneo con acentos en azul medico. Tipografia sans-serif, secciones con borde lateral de color.",
        "colores": {
            "primario": "#0369a1",
            "secundario": "#075985",
            "fondo_seccion": "#f0f9ff",
            "borde": "#e2e8f0",
            "acento": "#0ea5e9",
            "texto": "#1e293b",
            "texto_suave": "#64748b",
        },
        "fuente_titulo": "Helvetica-Bold",
        "fuente_cuerpo": "Helvetica",
        "borde_seccion": False,
        "doble_linea_encabezado": False,
        "fondo_titulo": "#f0f9ff",
    },
    "clinico_elegante": {
        "nombre": "Clinico Elegante",
        "descripcion": "Formato premium para clinicas privadas. Lineas finas, espaciado generoso, acentos en verde esmeralda.",
        "colores": {
            "primario": "#065f46",
            "secundario": "#047857",
            "fondo_seccion": "#f0fdf4",
            "borde": "#d1d5db",
            "acento": "#10b981",
            "texto": "#1f2937",
            "texto_suave": "#6b7280",
        },
        "fuente_titulo": "Helvetica-Bold",
        "fuente_cuerpo": "Helvetica",
        "borde_seccion": True,
        "doble_linea_encabezado": True,
        "fondo_titulo": "#ecfdf5",
    },
    "compacto_funcional": {
        "nombre": "Compacto Funcional",
        "descripcion": "Maximo contenido en minimo espacio. Ideal para recetas y notas rapidas. Margenes reducidos, fuente pequeña.",
        "colores": {
            "primario": "#4338ca",
            "secundario": "#3730a3",
            "fondo_seccion": "#eef2ff",
            "borde": "#c7d2fe",
            "acento": "#6366f1",
            "texto": "#1e1b4b",
            "texto_suave": "#6b7280",
        },
        "fuente_titulo": "Helvetica-Bold",
        "fuente_cuerpo": "Helvetica",
        "borde_seccion": False,
        "doble_linea_encabezado": False,
        "fondo_titulo": "#eef2ff",
    },
}


def obtener_formato_por_codigo(codigo: str) -> dict:
    return FORMATOS_DISPONIBLES.get(codigo, FORMATOS_DISPONIBLES["moderno_medico"])


def listar_formatos_disponibles() -> list[dict]:
    return [
        {"codigo": codigo, **{k: v for k, v in datos.items() if k in ("nombre", "descripcion")}}
        for codigo, datos in FORMATOS_DISPONIBLES.items()
    ]
