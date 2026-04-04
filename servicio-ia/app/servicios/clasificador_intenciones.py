PALABRAS_CLAVE_POR_ESPECIALIDAD = {
    "pediatria": ["nino", "nina", "pediatra", "infante", "bebe", "vacuna", "crecimiento", "lactante"],
    "cardiologia": ["corazon", "cardio", "presion", "hipertension", "arritmia", "infarto", "palpitaciones"],
    "ginecologia": ["embarazo", "gestacion", "menstruacion", "ovario", "utero", "prenatal", "parto"],
    "traumatologia": ["fractura", "hueso", "articulacion", "esguince", "luxacion", "yeso", "radiografia"],
    "dermatologia": ["piel", "dermatitis", "erupcion", "acne", "mancha", "lesion cutanea"],
    "general": []
}

PALABRAS_CLAVE_POR_ENTIDAD_CLINICA = {
    "sintomas": ["dolor", "fiebre", "tos", "nauseas", "mareo", "fatiga", "malestar", "inflamacion", "ardor"],
    "diagnostico": ["diagnostico", "diagnostica", "presenta", "cuadro", "sindrome", "compatible con"],
    "tratamiento": ["tratamiento", "recetar", "prescribir", "indicar", "medicar", "terapia"],
    "medicamento": ["mg", "ml", "tableta", "capsula", "jarabe", "ampolla", "gotas", "cada", "horas", "dias"],
}


def _detectar_especialidad_por_coincidencia(texto: str, especialidad_sugerida: str) -> str:
    if especialidad_sugerida:
        return especialidad_sugerida.lower()

    especialidad_detectada = "general"
    mejor_puntaje = 0

    for especialidad, palabras in PALABRAS_CLAVE_POR_ESPECIALIDAD.items():
        puntaje = sum(1 for palabra in palabras if palabra in texto)
        if puntaje > mejor_puntaje:
            mejor_puntaje = puntaje
            especialidad_detectada = especialidad

    return especialidad_detectada


def _detectar_entidades_clinicas_en_texto(texto: str) -> dict:
    entidades = {}
    for tipo, palabras in PALABRAS_CLAVE_POR_ENTIDAD_CLINICA.items():
        coincidencias = [palabra for palabra in palabras if palabra in texto]
        if coincidencias:
            entidades[tipo] = coincidencias
    return entidades


def clasificar_transcripcion_por_especialidad(transcripcion: str, especialidad_sugerida: str = "") -> dict:
    texto = transcripcion.lower()
    especialidad = _detectar_especialidad_por_coincidencia(texto, especialidad_sugerida)
    entidades = _detectar_entidades_clinicas_en_texto(texto)

    return {
        "especialidad": especialidad,
        "entidades": entidades,
        "tiene_sintomas": "sintomas" in entidades,
        "tiene_diagnostico": "diagnostico" in entidades,
        "tiene_tratamiento": "tratamiento" in entidades,
        "tiene_medicamento": "medicamento" in entidades,
    }
