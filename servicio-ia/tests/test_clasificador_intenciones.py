from app.servicios.clasificador_intenciones import (
    clasificar_transcripcion_por_especialidad,
)


def _clasificar(texto: str, especialidad_sugerida: str = ""):
    return clasificar_transcripcion_por_especialidad(texto, especialidad_sugerida)


def test_receta_simple_detecta_intencion_correcta():
    texto = (
        "Paciente con hipertension arterial controlada acude a renovar medicacion. "
        "Indico losartan 50 mg cada 24 horas por 30 dias."
    )
    r = _clasificar(texto, "Medicina General")
    assert r["intencion_principal"] == "receta_simple"
    assert "losartan" in r["entidades"].get("medicamento", [])


def test_urgencia_cardiaca_detecta_urgencia():
    texto = (
        "Paciente con dolor toracico opresivo retroesternal irradiado a brazo izquierdo, "
        "diaforesis y disnea. Se activa codigo infarto y se coordina traslado urgente a hemodinamia."
    )
    r = _clasificar(texto, "Cardiologia")
    assert r["intencion_principal"] == "urgencia"
    assert r["especialidad"] == "cardiologia"


def test_primera_consulta_prevalece_sobre_urgencia_simulada():
    texto = (
        "Paciente varon de 28 anos primera vez en consulta acude por dolor intenso en rodilla "
        "tras caida jugando futbol. Maniobra de Lachman positiva."
    )
    r = _clasificar(texto, "Traumatologia")
    assert r["intencion_principal"] == "primera_consulta"


def test_entidades_no_incluyen_unidades_de_posologia():
    texto = "Indico paracetamol 500 mg cada 8 horas por 3 dias."
    r = _clasificar(texto, "Medicina General")
    medicamentos = r["entidades"].get("medicamento", [])
    for palabra_basura in ("mg", "cada", "horas", "dias"):
        assert palabra_basura not in medicamentos, f"{palabra_basura} no debe ser medicamento"
    assert "paracetamol" in medicamentos


def test_entidades_no_incluyen_verbo_presenta_como_diagnostico():
    texto = "Al examen el paciente presenta edema y dolor a la palpacion."
    r = _clasificar(texto, "Medicina General")
    diagnosticos = r["entidades"].get("diagnostico", [])
    assert "presenta" not in diagnosticos


def test_word_boundary_no_matchea_control_dentro_de_controlada():
    texto = "Paciente con hipertension controlada sin sintomas."
    r = _clasificar(texto, "Medicina General")
    assert r["intencion_principal"] != "control_rutinario"


def test_calidad_baja_detecta_muletillas():
    texto = (
        "entonces bueno doctor vengo porque me duele algo aqui no se desde hace un tiempo "
        "creo que desde la semana pasada o antes no recuerdo me parece que eran para dolor"
    )
    r = _clasificar(texto, "Medicina General")
    assert r["calidad_estimada"] < 0.6, f"calidad deberia ser baja, fue {r['calidad_estimada']}"


def test_calidad_alta_para_transcripcion_tecnica():
    texto = (
        "Paciente varon de 45 anos con antecedente de diabetes mellitus tipo 2 acude por "
        "polidipsia, poliuria y perdida de peso de un mes. Glicemia capilar 280 mg/dl."
    )
    r = _clasificar(texto, "Medicina General")
    assert r["calidad_estimada"] >= 0.8


def test_especialidad_sugerida_tiene_prioridad():
    texto = "Paciente con lesiones cutaneas eritematosas en codos y rodillas."
    r = _clasificar(texto, "Dermatologia")
    assert r["especialidad"] == "dermatologia"
    assert r["confianza_especialidad"] == 1.0


def test_especialidad_detectada_por_keywords_cuando_no_hay_sugerida():
    texto = "Paciente con fractura de tobillo requiere inmovilizacion con yeso."
    r = _clasificar(texto, "")
    assert r["especialidad"] == "traumatologia"


def test_longitud_categorias_corta_media_extensa():
    corta = _clasificar(" ".join(["palabra"] * 30))
    media = _clasificar(" ".join(["palabra"] * 100))
    extensa = _clasificar(" ".join(["palabra"] * 250))
    assert corta["longitud_categoria"] == "corta"
    assert media["longitud_categoria"] == "media"
    assert extensa["longitud_categoria"] == "extensa"


def test_estructura_de_respuesta_tiene_todas_las_claves_requeridas():
    r = _clasificar("Paciente con tos seca y fiebre de 38 grados desde hace 2 dias.", "Medicina General")
    claves_requeridas = {
        "especialidad", "confianza_especialidad", "intencion_principal",
        "longitud_categoria", "calidad_estimada", "entidades",
        "tiene_sintomas", "tiene_diagnostico", "tiene_tratamiento",
        "tiene_medicamento", "tiene_antecedentes", "tiene_examen_fisico",
    }
    assert claves_requeridas.issubset(r.keys())


def test_texto_vacio_no_revienta():
    r = _clasificar("", "")
    assert r["especialidad"] == "general"
    assert r["calidad_estimada"] == 0.0


def test_seguimiento_detectado_por_frase():
    texto = "El paciente mejoro con el tratamiento indicado desde la ultima consulta."
    r = _clasificar(texto, "Medicina General")
    assert r["intencion_principal"] == "seguimiento"
