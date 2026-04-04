from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from app.servicios.configuracion_documentos import obtener_configuracion_de_documentos, guardar_configuracion_de_documentos
from app.servicios.formatos_documento import listar_formatos_disponibles
import os
import shutil

router = APIRouter()

DIRECTORIO_LOGOS = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "..", "gateway-dotnet", "src", "MedScribe.API", "documentos-generados", "logos"
)


TAMANO_MAXIMO_FIRMA_BASE64 = 200_000

class PeticionConfiguracion(BaseModel):
    nombre_clinica: str = Field(default="", max_length=200, pattern=r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-,&']*$")
    ruc: str = Field(default="", max_length=11, pattern=r"^(\d{11})?$")
    direccion: str = Field(default="", max_length=300, pattern=r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\d\.\-,#/°]*$")
    telefono: str = Field(default="", max_length=20, pattern=r"^[\d\s\-\+\(\)]*$")
    correo: str = Field(default="", max_length=150, pattern=r"^([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})?$")
    nombre_medico: str = Field(default="", max_length=100, pattern=r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-]*$")
    colegiatura: str = Field(default="", max_length=20, pattern=r"^(CMP-\d{4,6})?$")
    especialidad_medico: str = Field(default="", max_length=100, pattern=r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-]*$")
    formato_documento: str = Field(default="moderno_medico", max_length=50)
    firma_medico: str = Field(default="", max_length=TAMANO_MAXIMO_FIRMA_BASE64)
    firma_clinica: str = Field(default="", max_length=TAMANO_MAXIMO_FIRMA_BASE64)


@router.get("/formatos")
async def listar_formatos_de_documentos_disponibles():
    return {"formatos": listar_formatos_disponibles()}


@router.get("/obtener")
async def obtener_configuracion_actual():
    config = obtener_configuracion_de_documentos()
    if config.get("logo_path") and os.path.exists(config["logo_path"]):
        config["logo_url"] = "/api/ia/configuracion/logo"
    else:
        config["logo_url"] = ""
    return config


@router.get("/logo")
async def servir_logo_de_clinica():
    config = obtener_configuracion_de_documentos()
    logo_path = config.get("logo_path", "")
    if not logo_path or not os.path.exists(logo_path):
        raise HTTPException(status_code=404, detail="Logo no encontrado")
    extension = logo_path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "svg": "image/svg+xml", "webp": "image/webp"}
    return FileResponse(logo_path, media_type=mime.get(extension, "image/png"))


@router.post("/guardar")
async def guardar_configuracion(peticion: PeticionConfiguracion):
    if peticion.firma_medico and not peticion.firma_medico.startswith("data:image"):
        raise HTTPException(status_code=400, detail="La firma del medico debe ser una imagen base64 valida")
    if peticion.firma_clinica and not peticion.firma_clinica.startswith("data:image"):
        raise HTTPException(status_code=400, detail="La firma de la clinica debe ser una imagen base64 valida")

    config = peticion.model_dump(exclude_unset=False)
    config_existente = obtener_configuracion_de_documentos()

    campos_que_aceptan_sobreescritura_vacia = {"formato_documento"}

    for campo, valor in config.items():
        if campo in ("firma_medico", "firma_clinica"):
            if valor and valor.startswith("data:image"):
                config_existente[campo] = valor
        elif valor or campo in campos_que_aceptan_sobreescritura_vacia:
            config_existente[campo] = valor
    resultado = guardar_configuracion_de_documentos(config_existente)
    return {"mensaje": "Configuracion guardada", "configuracion": resultado}


NOTAS_EJEMPLO_POR_TIPO = {
    "SOAP": """## S - Subjetivo
Paciente masculino de 52 anos acude por dolor epigastrico de 5 dias de evolucion. Refiere ardor despues de comer, especialmente alimentos grasos. Nauseas ocasionales sin vomitos.

## O - Objetivo
Presion arterial: 125/80 mmHg. FC: 76 lpm. Temperatura: 36.8 C. Saturacion: 98%.
Abdomen: dolor a la palpacion en epigastrio, blando depresible, sin signos de irritacion peritoneal. Ruidos hidroaereos presentes.

## A - Analisis
Diagnostico principal: Gastritis cronica (CIE-10: K29.5).
Diagnostico secundario: Enfermedad por reflujo gastroesofagico (CIE-10: K21.0).

## P - Plan
- Omeprazol 20mg, 1 capsula en ayunas, 30 minutos antes del desayuno, por 30 dias
- Metoclopramida 10mg, 1 tableta antes de cada comida, 3 veces al dia, por 14 dias
- Dieta blanda, evitar grasas, picantes, cafe, alcohol y tabaco
- Endoscopia digestiva alta y test de Helicobacter pylori
- No acostarse inmediatamente despues de comer, esperar 2 horas
- Control en 2 semanas con resultados de endoscopia
- Si presenta vomitos con sangre o heces oscuras, acudir a emergencia""",

    "HistoriaClinica": """## Datos del Paciente
Nombre: Maria Elena Garcia Lopez. Edad: 34 anos. Sexo: Femenino. DNI: 72345678.

## Motivo de Consulta
Cefalea intensa de 3 dias de evolucion que no cede con analgesicos habituales.

## Enfermedad Actual
Paciente refiere inicio subito de cefalea frontal y temporal bilateral hace 3 dias, de intensidad 8/10, pulsatil, que se acompana de nauseas, fotofobia y fonofobia. Refiere haber tomado paracetamol 500mg sin mejoria significativa. Niega traumatismo craneal previo, fiebre o rigidez de nuca.

## Antecedentes
Personales: Migrana diagnosticada a los 20 anos, episodios 2-3 veces por mes. Alergia a AINES. Sin cirugias previas.
Familiares: Madre con migrana. Padre con hipertension arterial.

## Examen Fisico
PA: 118/72 mmHg. FC: 68 lpm. FR: 16 rpm. T: 36.5 C. Sat: 99%.
Neurologico: Glasgow 15/15. Pupilas isocoricas reactivas. Pares craneales sin alteracion. Fuerza muscular conservada. Sin signos meningeos. Fondo de ojo normal.

## Diagnostico
Diagnostico principal: Migrana sin aura (CIE-10: G43.0).
Diagnostico diferencial: Cefalea tensional, Cefalea por abuso de analgesicos.

## Plan de Tratamiento
- Sumatriptan 50mg VO al inicio de la crisis, puede repetir en 2 horas si no cede (max 200mg/dia)
- Metoclopramida 10mg VO si nauseas
- Evitar desencadenantes: estres, falta de sueno, alimentos procesados, alcohol
- Llevar diario de cefaleas por 1 mes
- Control en 4 semanas. Si frecuencia mayor a 4 episodios/mes, iniciar profilaxis con propranolol""",

    "Receta": """## Diagnostico
Faringoamigdalitis aguda bacteriana (CIE-10: J03.9)

## Prescripcion
- Amoxicilina + Acido Clavulanico 875/125mg, tableta, via oral, cada 12 horas, por 7 dias. Tomar con alimentos.
- Ibuprofeno 400mg, tableta, via oral, cada 8 horas por 3 dias, si dolor o fiebre. Tomar despues de comer.
- Cloruro de Cetilpiridinio 1.33mg/mL, solucion para gargaras, cada 8 horas, por 5 dias. No ingerir.

## Indicaciones Generales
- Reposo relativo por 3 dias
- Dieta blanda, tibia, evitar alimentos irritantes, acidos o muy frios
- Abundante liquido tibio (minimo 2 litros al dia)
- No suspender antibiotico aunque mejore antes de completar los 7 dias

## Proxima Cita
Control en 5 dias para evaluar evolucion. Si fiebre mayor a 39 C que no cede, dificultad para tragar o respirar, acudir a emergencia de inmediato.""",
}


@router.get("/preview-formato/{codigo_formato}")
async def generar_vista_previa_del_formato(codigo_formato: str, tipo_documento: str = "SOAP"):
    from app.servicios.generador_pdf import generar_pdf_desde_nota_clinica
    from app.servicios.formatos_documento import obtener_formato_por_codigo
    from fastapi.responses import StreamingResponse
    import io

    formato = obtener_formato_por_codigo(codigo_formato)
    if not formato:
        raise HTTPException(status_code=404, detail="Formato no encontrado")

    config = obtener_configuracion_de_documentos()
    config["formato_documento"] = codigo_formato

    nota = NOTAS_EJEMPLO_POR_TIPO.get(tipo_documento, NOTAS_EJEMPLO_POR_TIPO["SOAP"])

    pdf_bytes = generar_pdf_desde_nota_clinica(nota, tipo_documento, config)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=preview_{codigo_formato}_{tipo_documento}.pdf"},
    )


@router.post("/eliminar-firma")
async def eliminar_firma_digital(tipo: str = "medico"):
    if tipo not in ("medico", "clinica"):
        raise HTTPException(status_code=400, detail="Tipo debe ser 'medico' o 'clinica'")
    config = obtener_configuracion_de_documentos()
    campo = f"firma_{tipo}"
    config[campo] = ""
    guardar_configuracion_de_documentos(config)
    return {"mensaje": f"Firma de {tipo} eliminada"}


EXTENSIONES_IMAGEN_PERMITIDAS = {"png", "jpg", "jpeg", "svg", "webp"}
TAMANO_MAXIMO_LOGO_BYTES = 2 * 1024 * 1024
MIME_TYPES_IMAGEN_PERMITIDOS = {"image/png", "image/jpeg", "image/svg+xml", "image/webp"}

FIRMAS_MAGICAS_IMAGEN = {
    b'\x89PNG': "png",
    b'\xff\xd8\xff': "jpg",
    b'<svg': "svg",
    b'RIFF': "webp",
}


def _validar_firma_magica_de_imagen(contenido: bytes) -> bool:
    for firma in FIRMAS_MAGICAS_IMAGEN:
        if contenido[:len(firma)] == firma:
            return True
    if contenido[:5] == b'<?xml' and b'<svg' in contenido[:500]:
        return True
    return False


@router.post("/subir-logo")
async def subir_logo_de_clinica(archivo: UploadFile = File(...)):
    if not archivo.content_type or archivo.content_type not in MIME_TYPES_IMAGEN_PERMITIDOS:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Solo: PNG, JPG, SVG, WEBP")

    extension = archivo.filename.rsplit(".", 1)[-1].lower() if "." in archivo.filename else ""
    if extension not in EXTENSIONES_IMAGEN_PERMITIDAS:
        raise HTTPException(status_code=400, detail="Extension no permitida. Solo: png, jpg, jpeg, svg, webp")

    contenido = await archivo.read()

    if len(contenido) > TAMANO_MAXIMO_LOGO_BYTES:
        raise HTTPException(status_code=400, detail="El logo no debe superar 2 MB")

    if len(contenido) < 100:
        raise HTTPException(status_code=400, detail="El archivo esta vacio o es demasiado pequeno")

    if not _validar_firma_magica_de_imagen(contenido):
        raise HTTPException(status_code=400, detail="El contenido del archivo no corresponde a una imagen valida")

    os.makedirs(DIRECTORIO_LOGOS, exist_ok=True)
    ruta_logo = os.path.join(DIRECTORIO_LOGOS, f"logo_clinica.{extension}")

    with open(ruta_logo, "wb") as f:
        f.write(contenido)

    config = obtener_configuracion_de_documentos()
    config["logo_path"] = ruta_logo
    guardar_configuracion_de_documentos(config)

    return {"mensaje": "Logo subido exitosamente", "ruta": ruta_logo}
