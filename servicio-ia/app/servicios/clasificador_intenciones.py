import re

PALABRAS_CLAVE_POR_ESPECIALIDAD = {
    "pediatria": [
        "nino", "nina", "pediatra", "infante", "bebe", "vacuna", "crecimiento",
        "lactante", "recien nacido", "pediatrico", "escolar",
    ],
    "cardiologia": [
        "corazon", "cardio", "presion arterial", "hipertension", "arritmia", "infarto",
        "palpitaciones", "taquicardia", "soplo", "angina", "cardiopatia",
    ],
    "ginecologia": [
        "embarazo", "gestacion", "menstruacion", "ovario", "utero", "prenatal",
        "parto", "menopausia", "sangrado vaginal", "papanicolau", "ginecologico",
    ],
    "traumatologia": [
        "fractura", "hueso", "articulacion", "esguince", "luxacion", "yeso",
        "radiografia", "tendinitis", "trauma", "caida", "rodilla", "tobillo",
        "menisco", "ligamento",
    ],
    "dermatologia": [
        "piel", "dermatitis", "erupcion", "acne", "mancha", "lesion cutanea",
        "prurito", "urticaria", "verruga", "eccema", "picazon", "psoriasis",
    ],
    "general": [],
}

PALABRAS_CLAVE_POR_ENTIDAD_CLINICA = {
    "sintomas": [
        "dolor", "fiebre", "tos", "nauseas", "mareo", "fatiga", "malestar",
        "inflamacion", "ardor", "cefalea", "vomito", "diarrea", "disnea",
        "diaforesis",
    ],
    "diagnostico": [
        "diagnostico", "diagnostica", "cuadro", "sindrome",
        "compatible con", "impresion diagnostica", "infarto", "psoriasis",
    ],
    "tratamiento": [
        "tratamiento", "recetar", "prescribir", "indicar", "medicar", "terapia",
        "reposo absoluto", "control en", "referir", "traslado",
    ],
    "medicamento": [
        "tableta", "capsula", "jarabe", "ampolla", "gotas", "via oral",
        "inyectable", "omeprazol", "losartan", "paracetamol", "ibuprofeno",
        "aspirina", "clopidogrel", "diclofenaco", "amoxicilina", "azitromicina",
        "metformina", "atorvastatina", "betametasona", "calcipotriol",
    ],
    "antecedentes": [
        "antecedente", "historia familiar", "alergia", "cronico", "quirurgico",
        "operacion previa", "diabetes", "asma", "dislipidemia",
    ],
    "examen_fisico": [
        "auscultacion", "palpacion", "inspeccion", "examen fisico", "signos vitales",
        "temperatura", "saturacion", "frecuencia cardiaca", "presion arterial",
    ],
}

PALABRAS_CLAVE_POR_INTENCION = {
    "urgencia": [
        "emergencia", "urgente", "codigo infarto", "codigo rojo",
        "sangrado abundante", "perdida de conciencia", "disnea severa",
        "dolor toracico opresivo", "elevacion del segmento st",
        "traslado urgente",
    ],
    "primera_consulta": [
        "primera vez", "primera consulta", "nuevo paciente", "nunca antes",
        "debut", "inicio del cuadro",
    ],
    "seguimiento": [
        "como le fue", "mejoro", "empeoro", "continua con", "sigue igual",
        "desde la ultima", "ultimo control",
    ],
    "receta_simple": [
        "solo necesito receta", "renovar receta", "repetir receta",
        "renovar medicacion", "solo indicaciones",
    ],
    "control_rutinario": [
        "chequeo", "rutina", "revision periodica", "control de",
    ],
}

MARCADORES_INCERTIDUMBRE = [
    "no se", "no recuerdo", "no sabe", "no recuerda", "creo que",
    "me parece", "tal vez", "quizas", "no estoy seguro", "no esta seguro",
    "algo asi", "mas o menos",
]

LIMITE_PALABRAS_CONSULTA_CORTA = 60
LIMITE_PALABRAS_CONSULTA_MEDIA = 200


def _coincide_como_palabra_completa(texto: str, palabra_o_frase: str) -> bool:
    patron = r"(?<!\w)" + re.escape(palabra_o_frase) + r"(?!\w)"
    return re.search(patron, texto) is not None


def _detectar_especialidad_por_coincidencia(texto: str, especialidad_sugerida: str) -> tuple[str, float]:
    if especialidad_sugerida:
        return especialidad_sugerida.lower(), 1.0

    especialidad_detectada = "general"
    mejor_puntaje = 0

    for especialidad, palabras in PALABRAS_CLAVE_POR_ESPECIALIDAD.items():
        puntaje = sum(1 for palabra in palabras if _coincide_como_palabra_completa(texto, palabra))
        if puntaje > mejor_puntaje:
            mejor_puntaje = puntaje
            especialidad_detectada = especialidad

    confianza = min(1.0, mejor_puntaje / 3.0) if mejor_puntaje > 0 else 0.0
    return especialidad_detectada, confianza


def _detectar_entidades_clinicas_en_texto(texto: str) -> dict:
    entidades = {}
    for tipo, palabras in PALABRAS_CLAVE_POR_ENTIDAD_CLINICA.items():
        coincidencias = [palabra for palabra in palabras if _coincide_como_palabra_completa(texto, palabra)]
        if coincidencias:
            entidades[tipo] = coincidencias
    return entidades


def _detectar_intencion_principal(texto: str, entidades: dict) -> str:
    for intencion, frases in PALABRAS_CLAVE_POR_INTENCION.items():
        if any(_coincide_como_palabra_completa(texto, frase) for frase in frases):
            return intencion

    if entidades.get("medicamento") and not entidades.get("examen_fisico") and not entidades.get("diagnostico"):
        return "receta_simple"
    if entidades.get("antecedentes") and entidades.get("examen_fisico"):
        return "primera_consulta"
    if entidades.get("diagnostico") and entidades.get("tratamiento"):
        return "consulta_diagnostica"
    return "consulta_general"


def _categorizar_longitud_transcripcion(texto: str) -> str:
    cantidad_palabras = len(texto.split())
    if cantidad_palabras < LIMITE_PALABRAS_CONSULTA_CORTA:
        return "corta"
    if cantidad_palabras < LIMITE_PALABRAS_CONSULTA_MEDIA:
        return "media"
    return "extensa"


def _estimar_calidad_transcripcion(texto: str) -> float:
    if not texto:
        return 0.0
    palabras = texto.split()
    if len(palabras) < 5:
        return 0.1

    proporcion_alfabetico = sum(1 for c in texto if c.isalpha() or c.isspace()) / max(len(texto), 1)
    unicas = len(set(palabra.lower() for palabra in palabras))
    diversidad = min(1.0, unicas / max(len(palabras), 1) * 2)

    marcadores_encontrados = sum(
        1 for marcador in MARCADORES_INCERTIDUMBRE
        if _coincide_como_palabra_completa(texto, marcador)
    )
    penalizacion_incertidumbre = min(0.6, marcadores_encontrados * 0.15)

    calidad_base = proporcion_alfabetico * 0.6 + diversidad * 0.4
    return round(max(0.0, min(1.0, calidad_base - penalizacion_incertidumbre)), 2)


def clasificar_transcripcion_por_especialidad(transcripcion: str, especialidad_sugerida: str = "") -> dict:
    texto = transcripcion.lower()
    especialidad, confianza_especialidad = _detectar_especialidad_por_coincidencia(texto, especialidad_sugerida)
    entidades = _detectar_entidades_clinicas_en_texto(texto)
    intencion = _detectar_intencion_principal(texto, entidades)
    longitud_categoria = _categorizar_longitud_transcripcion(texto)
    calidad = _estimar_calidad_transcripcion(texto)

    return {
        "especialidad": especialidad,
        "confianza_especialidad": confianza_especialidad,
        "intencion_principal": intencion,
        "longitud_categoria": longitud_categoria,
        "calidad_estimada": calidad,
        "entidades": entidades,
        "tiene_sintomas": "sintomas" in entidades,
        "tiene_diagnostico": "diagnostico" in entidades,
        "tiene_tratamiento": "tratamiento" in entidades,
        "tiene_medicamento": "medicamento" in entidades,
        "tiene_antecedentes": "antecedentes" in entidades,
        "tiene_examen_fisico": "examen_fisico" in entidades,
    }
