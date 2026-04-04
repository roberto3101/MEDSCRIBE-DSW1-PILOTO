from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
import io
import os
from datetime import datetime


AZUL_PRIMARIO = RGBColor(0x03, 0x69, 0xA1)
AZUL_CLARO = RGBColor(0x0E, 0xA5, 0xE9)
TEXTO_OSCURO = RGBColor(0x1E, 0x29, 0x3B)
TEXTO_SUAVE = RGBColor(0x64, 0x74, 0x8B)
TEXTO_CLARO = RGBColor(0x94, 0xA3, 0xB8)
FONDO_SECCION = "F0F9FF"


def _configurar_documento(doc: Document) -> None:
    for seccion in doc.sections:
        seccion.top_margin = Cm(2)
        seccion.bottom_margin = Cm(1.5)
        seccion.left_margin = Cm(2)
        seccion.right_margin = Cm(2)

    estilo_normal = doc.styles['Normal']
    estilo_normal.font.name = 'Calibri'
    estilo_normal.font.size = Pt(10)
    estilo_normal.font.color.rgb = TEXTO_OSCURO


def _agregar_encabezado(doc: Document, config: dict) -> None:
    nombre_clinica = config.get("nombre_clinica", "MedScribe AI")
    ruc = config.get("ruc", "")
    direccion = config.get("direccion", "")
    telefono = config.get("telefono", "")
    correo = config.get("correo", "")

    logo_path = config.get("logo_path", "")
    if logo_path and os.path.exists(logo_path):
        tabla = doc.add_table(rows=1, cols=2)
        tabla.alignment = WD_TABLE_ALIGNMENT.LEFT
        celda_logo = tabla.cell(0, 0)
        celda_logo.width = Cm(3)
        celda_logo.paragraphs[0].add_run().add_picture(logo_path, width=Cm(2.5))

        celda_info = tabla.cell(0, 1)
        p_nombre = celda_info.paragraphs[0]
        run = p_nombre.add_run(nombre_clinica)
        run.font.size = Pt(14)
        run.font.color.rgb = AZUL_PRIMARIO
        run.font.bold = True
    else:
        p = doc.add_paragraph()
        run = p.add_run(nombre_clinica)
        run.font.size = Pt(14)
        run.font.color.rgb = AZUL_PRIMARIO
        run.font.bold = True

    datos = []
    if ruc:
        datos.append(f"RUC: {ruc}")
    if direccion:
        datos.append(direccion)
    partes_contacto = []
    if telefono:
        partes_contacto.append(f"Tel: {telefono}")
    if correo:
        partes_contacto.append(correo)
    if partes_contacto:
        datos.append(" | ".join(partes_contacto))

    if datos:
        p_datos = doc.add_paragraph()
        run = p_datos.add_run("  |  ".join(datos))
        run.font.size = Pt(8)
        run.font.color.rgb = TEXTO_SUAVE

    p_linea = doc.add_paragraph()
    p_linea.paragraph_format.space_after = Pt(8)
    run = p_linea.add_run("_" * 85)
    run.font.color.rgb = AZUL_CLARO
    run.font.size = Pt(6)


def _agregar_titulo(doc: Document, tipo_documento: str, config: dict) -> None:
    titulos = {
        "SOAP": "NOTA CLINICA SOAP",
        "HistoriaClinica": "HISTORIA CLINICA",
        "Receta": "RECETA MEDICA",
        "Personalizada": "DOCUMENTO CLINICO",
    }
    titulo = titulos.get(tipo_documento, "DOCUMENTO CLINICO")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(titulo)
    run.font.size = Pt(16)
    run.font.color.rgb = AZUL_PRIMARIO
    run.font.bold = True

    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    numero = config.get("numero_documento", f"HC-{datetime.now().strftime('%Y%m%d%H%M')}")
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p_sub.add_run(f"N.o {numero}  |  Fecha: {fecha}")
    run.font.size = Pt(9)
    run.font.color.rgb = TEXTO_SUAVE
    p_sub.paragraph_format.space_after = Pt(12)


def _agregar_contenido_sin_campos_vacios(doc: Document, nota_clinica: str) -> None:
    seccion_actual = None
    contenido_seccion = []

    def _flush_seccion():
        nonlocal seccion_actual, contenido_seccion
        if seccion_actual is None:
            return

        contenido_texto = "\n".join(contenido_seccion).strip()
        tiene_contenido_real = any(
            linea.strip() and
            "no se proporcion" not in linea.lower() and
            "no se tiene" not in linea.lower() and
            "no se registr" not in linea.lower() and
            "no se mencion" not in linea.lower() and
            "no disponible" not in linea.lower()
            for linea in contenido_seccion
        )

        if not tiene_contenido_real:
            seccion_actual = None
            contenido_seccion = []
            return

        p_titulo = doc.add_paragraph()
        run = p_titulo.add_run(seccion_actual)
        run.font.size = Pt(11)
        run.font.color.rgb = AZUL_PRIMARIO
        run.font.bold = True
        p_titulo.paragraph_format.space_before = Pt(10)
        p_titulo.paragraph_format.space_after = Pt(4)

        shading = p_titulo.paragraph_format.element
        pPr = shading.get_or_add_pPr()
        shd = pPr.makeelement(qn('w:shd'), {
            qn('w:val'): 'clear',
            qn('w:color'): 'auto',
            qn('w:fill'): FONDO_SECCION,
        })
        pPr.append(shd)

        for linea in contenido_seccion:
            if not linea.strip():
                continue
            if linea.startswith("- "):
                doc.add_paragraph(linea[2:], style="List Bullet")
            else:
                p = doc.add_paragraph(linea)
                p.paragraph_format.space_after = Pt(3)

        seccion_actual = None
        contenido_seccion = []

    for linea in nota_clinica.split("\n"):
        texto = linea.strip()

        es_titulo = False
        titulo_limpio = ""

        if texto.startswith("## "):
            titulo_limpio = texto[3:].strip().strip("*")
            es_titulo = True
        elif texto.startswith("# "):
            titulo_limpio = texto[2:].strip().strip("*")
            es_titulo = True
        elif texto.startswith("**") and texto.endswith("**"):
            titulo_limpio = texto.strip("*").strip()
            es_titulo = True

        if es_titulo:
            _flush_seccion()
            seccion_actual = titulo_limpio
            contenido_seccion = []
        elif seccion_actual is not None:
            contenido_seccion.append(texto)
        elif texto:
            p = doc.add_paragraph(texto)
            p.paragraph_format.space_after = Pt(3)

    _flush_seccion()


def _agregar_firmas(doc: Document, config: dict) -> None:
    doc.add_paragraph()
    doc.add_paragraph()

    nombre_medico = config.get("nombre_medico", "")
    colegiatura = config.get("colegiatura", "")
    especialidad = config.get("especialidad_medico", "")
    nombre_clinica = config.get("nombre_clinica", "")

    if not nombre_medico and not nombre_clinica:
        return

    tabla = doc.add_table(rows=4, cols=2)
    tabla.alignment = WD_TABLE_ALIGNMENT.CENTER

    if nombre_medico:
        p = tabla.cell(0, 0).paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("_" * 30)
        run.font.color.rgb = TEXTO_CLARO
        run.font.size = Pt(8)

        p = tabla.cell(1, 0).paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(nombre_medico)
        run.font.bold = True
        run.font.size = Pt(9)

        if colegiatura:
            p = tabla.cell(2, 0).paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(f"CMP: {colegiatura}")
            run.font.size = Pt(8)
            run.font.color.rgb = TEXTO_SUAVE

        if especialidad:
            p = tabla.cell(3, 0).paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(especialidad)
            run.font.size = Pt(8)
            run.font.color.rgb = TEXTO_SUAVE

    if nombre_clinica:
        p = tabla.cell(0, 1).paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("_" * 30)
        run.font.color.rgb = TEXTO_CLARO
        run.font.size = Pt(8)

        p = tabla.cell(1, 1).paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(nombre_clinica)
        run.font.bold = True
        run.font.size = Pt(9)

        p = tabla.cell(2, 1).paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("Sello de la Clinica")
        run.font.size = Pt(8)
        run.font.color.rgb = TEXTO_SUAVE


def _agregar_pie(doc: Document) -> None:
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("_" * 85)
    run.font.color.rgb = TEXTO_CLARO
    run.font.size = Pt(6)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(
        "Documento generado por MedScribe AI  |  Requiere revision y aprobacion del medico tratante  |  "
        f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    )
    run.font.size = Pt(7)
    run.font.color.rgb = TEXTO_CLARO

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run("NTS N.o 139-MINSA/2018/DGAIN - Retencion minima 20 anios")
    run2.font.size = Pt(7)
    run2.font.color.rgb = TEXTO_CLARO


def generar_word_desde_nota_clinica(nota_clinica: str, tipo_documento: str, config: dict = None) -> bytes:
    if config is None:
        config = {}

    doc = Document()
    _configurar_documento(doc)
    _agregar_encabezado(doc, config)
    _agregar_titulo(doc, tipo_documento, config)
    _agregar_contenido_sin_campos_vacios(doc, nota_clinica)
    _agregar_firmas(doc, config)
    _agregar_pie(doc)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()
