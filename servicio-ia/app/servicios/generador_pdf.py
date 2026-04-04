from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image, KeepTogether
)
import io
import os
import base64
import tempfile
from datetime import datetime
from app.servicios.formatos_documento import obtener_formato_por_codigo

PAGE_W, PAGE_H = A4
_archivos_temporales: list[str] = []


def _c(hex_str):
    return HexColor(hex_str)


def _base64_a_ruta_temporal(data_url: str) -> str:
    if not data_url or not data_url.startswith("data:image"):
        return ""
    try:
        _, datos = data_url.split(",", 1)
        ruta = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
        with open(ruta, "wb") as f:
            f.write(base64.b64decode(datos))
        _archivos_temporales.append(ruta)
        return ruta
    except Exception:
        return ""


def _estilos(fmt):
    c = fmt["colores"]
    ft = fmt.get("fuente_titulo", "Helvetica-Bold")
    fc = fmt.get("fuente_cuerpo", "Helvetica")
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("ClinicaNombre", fontName=ft, fontSize=13, textColor=_c(c["primario"]), leading=15))
    s.add(ParagraphStyle("ClinicaDatos", fontName=fc, fontSize=7.5, textColor=_c(c["texto_suave"]), leading=10))
    s.add(ParagraphStyle("DocTitulo", fontName=ft, fontSize=14, textColor=white, alignment=TA_CENTER))
    s.add(ParagraphStyle("DocSubtitulo", fontName=fc, fontSize=8, textColor=_c(c["texto_suave"]), alignment=TA_CENTER))
    s.add(ParagraphStyle("SecTitulo", fontName=ft, fontSize=9.5, textColor=white, leading=12))
    s.add(ParagraphStyle("Campo", fontName=fc, fontSize=9, textColor=_c(c["texto"]), leading=12))
    s.add(ParagraphStyle("CampoNeg", fontName=ft, fontSize=9, textColor=_c(c["texto"]), leading=12))
    s.add(ParagraphStyle("Lista", fontName=fc, fontSize=9, textColor=_c(c["texto"]), leading=12, leftIndent=6))
    s.add(ParagraphStyle("Pie", fontName=fc, fontSize=6.5, textColor=_c(c["texto_suave"]), alignment=TA_CENTER))
    s.add(ParagraphStyle("FirmaNombre", fontName=ft, fontSize=8.5, textColor=_c(c["texto"]), alignment=TA_CENTER))
    s.add(ParagraphStyle("FirmaDetalle", fontName=fc, fontSize=7.5, textColor=_c(c["texto_suave"]), alignment=TA_CENTER))
    return s


def _encabezado(s, cfg, fmt):
    c = fmt["colores"]
    el = []
    nombre = cfg.get("nombre_clinica", "MedScribe AI")

    lineas_info = []
    if cfg.get("ruc"):
        lineas_info.append(f"RUC: {cfg['ruc']}")
    if cfg.get("direccion"):
        lineas_info.append(cfg["direccion"])
    partes = []
    if cfg.get("telefono"):
        partes.append(f"Tel: {cfg['telefono']}")
    if cfg.get("correo"):
        partes.append(cfg["correo"])
    if partes:
        lineas_info.append(" | ".join(partes))

    logo_path = cfg.get("logo_path", "")
    celda_logo = ""
    if logo_path and os.path.exists(logo_path):
        try:
            celda_logo = Image(logo_path, width=2 * cm, height=2 * cm)
        except Exception:
            celda_logo = ""

    celda_nombre = [Paragraph(nombre, s["ClinicaNombre"])]
    if lineas_info:
        celda_nombre.append(Paragraph("<br/>".join(lineas_info), s["ClinicaDatos"]))

    fecha = datetime.now().strftime("%d/%m/%Y")
    hora = datetime.now().strftime("%H:%M")
    import uuid
    num = cfg.get("numero_documento", f"HC-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:6].upper()}")

    celda_meta = [
        Paragraph(f"<b>Fecha:</b> {fecha}", s["Campo"]),
        Paragraph(f"<b>Hora:</b> {hora}", s["Campo"]),
        Paragraph(f"<b>N.o:</b> {num}", s["Campo"]),
    ]

    datos_tabla = [[celda_logo, celda_nombre, celda_meta]]
    anchos = [2.5 * cm, 10 * cm, 4.5 * cm]
    if not celda_logo:
        datos_tabla = [[celda_nombre, celda_meta]]
        anchos = [12.5 * cm, 4.5 * cm]

    t = Table(datos_tabla, colWidths=anchos, rowHeights=[2.2 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 1.5, _c(c["primario"])),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, _c(c["primario"])),
        ("GRID", (0, 0), (-1, -1), 0.5, _c(c["borde"])),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    el.append(t)
    return el


def _titulo_documento(s, tipo, fmt):
    c = fmt["colores"]
    titulos = {"SOAP": "NOTA CLINICA SOAP", "HistoriaClinica": "HISTORIA CLINICA",
               "Receta": "RECETA MEDICA", "Personalizada": "DOCUMENTO CLINICO"}
    titulo = titulos.get(tipo, "DOCUMENTO CLINICO")

    t = Table([[Paragraph(titulo, s["DocTitulo"])]], colWidths=[17 * cm], rowHeights=[0.8 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), _c(c["primario"])),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return [Spacer(1, 3 * mm), t, Spacer(1, 2 * mm)]


def _barra_seccion(s, titulo, fmt):
    c = fmt["colores"]
    t = Table([[Paragraph(titulo, s["SecTitulo"])]], colWidths=[17 * cm], rowHeights=[0.55 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), _c(c["secundario"])),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return t


def _segmentar_texto_largo(texto: str, maximo: int = 200) -> str:
    if len(texto) <= maximo:
        return texto
    resultado = []
    for i in range(0, len(texto), maximo):
        resultado.append(texto[i:i + maximo])
    return ' '.join(resultado)


def _caja_contenido(s, lineas, fmt):
    c = fmt["colores"]
    contenido = []
    for linea in lineas:
        if not linea.strip():
            continue
        linea_segura = _segmentar_texto_largo(linea.strip())
        if linea.startswith("- "):
            contenido.append(Paragraph(f"&#8226; {_segmentar_texto_largo(linea[2:].strip())}", s["Lista"]))
        else:
            contenido.append(Paragraph(linea_segura, s["Campo"]))

    if not contenido:
        return None

    texto_total = sum(len(l.strip()) for l in lineas)
    if texto_total > 2000:
        return contenido  # retorna lista de Paragraphs directamente

    t = Table([[contenido]], colWidths=[17 * cm])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, _c(c["borde"])),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BACKGROUND", (0, 0), (-1, -1), _c(c["fondo_seccion"])),
    ]))
    return t


def _secciones(s, nota, fmt):
    c = fmt["colores"]
    el = []
    secciones = []
    actual = None
    frases_vacias = ["no se proporcion", "no se tiene", "no se registr", "no se mencion", "no disponible", "no se realiz"]

    for linea in nota.split("\n"):
        txt = linea.strip()
        es_titulo = False
        titulo = ""
        if txt.startswith("## "):
            titulo = txt[3:].strip().strip("*")
            es_titulo = True
        elif txt.startswith("# "):
            titulo = txt[2:].strip().strip("*")
            es_titulo = True
        elif txt.startswith("**") and txt.endswith("**"):
            titulo = txt.strip("*").strip()
            es_titulo = True

        if es_titulo:
            actual = {"titulo": titulo, "lineas": []}
            secciones.append(actual)
        elif actual:
            actual["lineas"].append(txt)
        elif txt:
            if not secciones:
                actual = {"titulo": "", "lineas": []}
                secciones.append(actual)
            secciones[-1]["lineas"].append(txt)

    for sec in secciones:
        tiene_real = any(
            l.strip() and not any(f in l.strip().lower() for f in frases_vacias)
            for l in sec["lineas"]
        )
        if not tiene_real:
            continue

        grupo = []
        if sec["titulo"]:
            grupo.append(_barra_seccion(s, sec["titulo"], fmt))
        caja = _caja_contenido(s, sec["lineas"], fmt)
        if caja:
            if isinstance(caja, list):
                grupo.extend(caja)
            else:
                grupo.append(caja)
        if grupo:
            grupo.append(Spacer(1, 2 * mm))
            el.extend(grupo)

    return el


def _firmas(s, cfg, fmt):
    c = fmt["colores"]
    el = [Spacer(1, 1.2 * cm)]

    firma_m = _base64_a_ruta_temporal(cfg.get("firma_medico", ""))
    firma_c = _base64_a_ruta_temporal(cfg.get("firma_clinica", ""))
    nombre_m = cfg.get("nombre_medico", "")
    col_m = cfg.get("colegiatura", "")
    esp_m = cfg.get("especialidad_medico", "")
    nombre_cl = cfg.get("nombre_clinica", "")

    izq = []
    der = []

    if firma_m:
        try:
            izq.append(Image(firma_m, width=4 * cm, height=1.5 * cm))
        except Exception:
            pass
    if nombre_m:
        if not firma_m:
            izq.append(Paragraph("_" * 28, s["FirmaNombre"]))
        izq.append(Paragraph(f"<b>{nombre_m}</b>", s["FirmaNombre"]))
        if col_m:
            izq.append(Paragraph(f"CMP: {col_m}", s["FirmaDetalle"]))
        if esp_m:
            izq.append(Paragraph(esp_m, s["FirmaDetalle"]))

    if firma_c:
        try:
            der.append(Image(firma_c, width=4 * cm, height=1.5 * cm))
        except Exception:
            pass
    if nombre_cl:
        if not firma_c:
            der.append(Paragraph("_" * 28, s["FirmaNombre"]))
        der.append(Paragraph(f"<b>{nombre_cl}</b>", s["FirmaNombre"]))
        der.append(Paragraph("Sello Institucional", s["FirmaDetalle"]))

    if izq or der:
        t = Table(
            [[izq or [Spacer(1, 1)], der or [Spacer(1, 1)]]],
            colWidths=[8.5 * cm, 8.5 * cm],
        )
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BOX", (0, 0), (0, 0), 0.5, _c(c["borde"])),
            ("BOX", (1, 0), (1, 0), 0.5, _c(c["borde"])),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        el.append(t)

    return el


def _pie(s, fmt):
    c = fmt["colores"]
    return [
        Spacer(1, 0.6 * cm),
        Table(
            [[Paragraph(
                f"Documento generado por MedScribe AI | Requiere revision y aprobacion del medico | "
                f"{datetime.now().strftime('%d/%m/%Y %H:%M')} | NTS N.o 139-MINSA/2018/DGAIN",
                s["Pie"]
            )]],
            colWidths=[17 * cm],
            rowHeights=[0.5 * cm],
            style=TableStyle([
                ("BOX", (0, 0), (-1, -1), 0.5, _c(c["borde"])),
                ("BACKGROUND", (0, 0), (-1, -1), _c(c["fondo_seccion"])),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]),
        ),
    ]


def generar_pdf_desde_nota_clinica(nota_clinica: str, tipo_documento: str, config: dict = None) -> bytes:
    global _archivos_temporales
    _archivos_temporales = []

    if config is None:
        config = {}

    codigo = config.get("formato_documento", "moderno_medico")
    fmt = obtener_formato_por_codigo(codigo)

    margen = 2 * cm if codigo != "compacto_funcional" else 1.5 * cm

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1 * cm,
                            leftMargin=margen, rightMargin=margen)

    s = _estilos(fmt)
    el = []
    el.extend(_encabezado(s, config, fmt))
    el.extend(_titulo_documento(s, tipo_documento, fmt))
    el.extend(_secciones(s, nota_clinica, fmt))
    el.extend(_firmas(s, config, fmt))
    el.extend(_pie(s, fmt))

    doc.build(el)

    for ruta in _archivos_temporales:
        if ruta and os.path.exists(ruta):
            try:
                os.unlink(ruta)
            except Exception:
                pass
    _archivos_temporales = []

    buf.seek(0)
    return buf.read()
