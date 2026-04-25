"""Genera el HTML optimizado para presentacion: SVG inline (offline) + presentadores."""
from pathlib import Path
import re

RAIZ = Path(__file__).resolve().parents[1]
SVG_DIR = RAIZ / "Tecnico" / "Diagramas" / "svg"
SALIDA = RAIZ / "Web" / "informe-medscribe.html"
SALIDA.parent.mkdir(parents=True, exist_ok=True)


def limpiar_svg(ruta):
    """Lee un SVG y lo deja listo para inyectar inline."""
    txt = ruta.read_text(encoding="utf-8")
    # Quita XML prolog
    txt = re.sub(r"<\?xml[^?]*\?>", "", txt)
    # Quita DOCTYPE si existe
    txt = re.sub(r"<!DOCTYPE[^>]*>", "", txt)
    # Asegurar que el SVG sea responsive: quitar width/height fijos del root <svg>
    txt = re.sub(
        r'(<svg\s[^>]*?)\s(?:width|height)="[^"]*"',
        r'\1',
        txt,
    )
    # Asegurar viewBox y preserveAspectRatio
    if "viewBox" in txt and 'preserveAspectRatio' not in txt:
        txt = txt.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', 1)
    # Sin max-height inline para que CSS controle por modo (normal vs presentacion)
    txt = txt.replace('<svg ', '<svg class="svg-diagrama" style="width:100%;height:auto" ', 1)
    return txt.strip()


D = {
    "arquitectura":  limpiar_svg(SVG_DIR / "01-arquitectura.svg"),
    "casos_uso":     limpiar_svg(SVG_DIR / "02-casos-uso.svg"),
    "clases":        limpiar_svg(SVG_DIR / "03-clases.svg"),
    "er":            limpiar_svg(SVG_DIR / "04-er-base-datos.svg"),
    "sec_login":     limpiar_svg(SVG_DIR / "05-secuencia-login.svg"),
    "sec_trans":     limpiar_svg(SVG_DIR / "06-secuencia-transcripcion.svg"),
    "actividades":   limpiar_svg(SVG_DIR / "07-actividades-pipeline.svg"),
    "componentes":   limpiar_svg(SVG_DIR / "08-componentes.svg"),
    "despliegue":    limpiar_svg(SVG_DIR / "09-despliegue.svg"),
    "estados":       limpiar_svg(SVG_DIR / "10-estados-consulta.svg"),
}


# ============================================================
# DEFINICION DEL FLUJO DE PRESENTACION
# ============================================================
# Cada seccion se asigna a un presentador.
# Codigos: ed=Edward (intro+arq), ja=Jason (C#), lu=Luis (BD), ro=Roberto (IA)

PRESENTADORES = {
    "ed": {
        "nombre": "Edward Escobedo",
        "codigo": "i201917851",
        "tema": "Arquitectura general + Frontend",
        "color": "#0ea5e9",
        "color_fondo": "#e0f2fe",
        "inicial": "E",
    },
    "ja": {
        "nombre": "Jason Davila",
        "codigo": "i202415540",
        "tema": "Backend C# .NET",
        "color": "#7c3aed",
        "color_fondo": "#ede9fe",
        "inicial": "J",
    },
    "lu": {
        "nombre": "Luis Curi",
        "codigo": "i202417794",
        "tema": "Base de Datos SQL Server",
        "color": "#dc2626",
        "color_fondo": "#fee2e2",
        "inicial": "L",
    },
    "ro": {
        "nombre": "Roberto La Rosa",
        "codigo": "i202333980",
        "tema": "Servicio IA Python",
        "color": "#f59e0b",
        "color_fondo": "#fef3c7",
        "inicial": "R",
    },
    "all": {
        "nombre": "Equipo completo",
        "codigo": "",
        "tema": "Cierre",
        "color": "#475569",
        "color_fondo": "#e2e8f0",
        "inicial": "*",
    },
}


def badge(p):
    """HTML del badge del presentador."""
    pr = PRESENTADORES[p]
    return f"""
    <div class="presentador" style="--p-color:{pr['color']};--p-bg:{pr['color_fondo']}">
      <div class="presentador-avatar">{pr['inicial']}</div>
      <div class="presentador-info">
        <div class="presentador-rol">Lo presenta:</div>
        <div class="presentador-nombre">{pr['nombre']}</div>
        <div class="presentador-tema">{pr['tema']}</div>
      </div>
    </div>
    """


# ============================================================
# CONTENIDO DE CADA SECCION
# ============================================================

SECCIONES = [
    # ========== EDWARD (intro + arquitectura) ==========
    {
        "id": "resumen",
        "titulo": "1. Resumen del proyecto",
        "presentador": "ed",
        "contenido": """
        <p>MedScribe AI es una aplicacion web que <strong>automatiza la creacion de notas clinicas</strong> en clinicas y consultorios medicos. El medico graba la consulta con su voz, el sistema escucha el audio, lo convierte en texto, identifica quien hablo y genera una nota clinica estructurada lista para imprimir como PDF o Word.</p>
        <p>La solucion combina cuatro tecnologias principales: una interfaz web en <strong>React</strong>, un backend en <strong>C# .NET 9</strong>, un servicio de inteligencia artificial en <strong>Python con FastAPI</strong>, y una base de datos <strong>SQL Server</strong>. Todo se ejecuta en contenedores Docker y se levanta con un solo comando.</p>
        """,
    },
    {
        "id": "problema",
        "titulo": "2. El problema que resolvemos",
        "presentador": "ed",
        "contenido": """
        <p>En el Peru, los medicos pasan <strong>entre el 35 % y el 50 %</strong> de su jornada escribiendo notas en lugar de mirar al paciente. Esto reduce la calidad de la atencion, aumenta el burnout y eleva los errores en las historias clinicas.</p>
        <div class="cita">
          <span class="cita-marca">"</span>
          El 63 % de los pacientes considera que su medico le dedica menos de 10 minutos por consulta y la mayor parte de ese tiempo lo pasa frente a la computadora.
          <span class="cita-fuente">- INEI, 2023</span>
        </div>
        <p>MedScribe ataca el problema desde la raiz: <em>si la maquina escribe por el medico, el medico recupera su tiempo para escuchar y mirar al paciente</em>.</p>
        """,
    },
    {
        "id": "objetivos",
        "titulo": "3. Objetivos SMART",
        "presentador": "ed",
        "contenido": """
        <p>Los objetivos siguen el criterio SMART (especificos, medibles, alcanzables, relevantes y con plazo).</p>
        <div class="objetivos">
          <div class="objetivo destacado">
            <h4>Objetivo General</h4>
            <p>Reducir en al menos un <strong>60 %</strong> el tiempo que un medico dedica a escribir notas, mediante transcripcion automatica y generacion estructurada, en el ciclo 2026-I.</p>
          </div>
          <div class="objetivo">
            <h4>Objetivo 1: Pipeline IA</h4>
            <p>Transcribir audios medicos en menos de <strong>30 segundos</strong> para grabaciones de hasta 5 minutos.</p>
          </div>
          <div class="objetivo">
            <h4>Objetivo 2: Documentos</h4>
            <p>Generar PDF y Word con disenio profesional y secciones SOAP automaticamente.</p>
          </div>
          <div class="objetivo">
            <h4>Objetivo 3: Seguridad</h4>
            <p>Implementar control de acceso por roles con permisos granulares por modulo y accion.</p>
          </div>
        </div>
        """,
    },
    {
        "id": "arquitectura",
        "titulo": "4. Arquitectura general en 4 capas",
        "presentador": "ed",
        "contenido": f"""
        <p>La aplicacion sigue una arquitectura en cuatro capas, separadas y comunicadas por APIs HTTP. Cada capa puede crecer o cambiar de forma independiente.</p>
        <div class="diagrama">{D['arquitectura']}<p class="titulo-fig">Figura 1. Arquitectura general de MedScribe</p></div>
        <ul class="bullets-arq">
          <li><strong>Capa de presentacion (React):</strong> lo que ve el medico en su navegador.</li>
          <li><strong>Capa de negocio (.NET 9):</strong> recibe peticiones, valida, llama a la BD y al servicio IA.</li>
          <li><strong>Capa de IA (Python):</strong> aqui ocurre la magia: transcripcion, LLM y generacion de documentos.</li>
          <li><strong>Capa de datos:</strong> SQL Server (relacional), Qdrant (vectorial), Redis (cola), archivos.</li>
        </ul>
        """,
    },
    {
        "id": "componentes",
        "titulo": "5. Componentes del sistema",
        "presentador": "ed",
        "contenido": f"""
        <p>Vista interna de cada capa: muestra los modulos de codigo y como se comunican.</p>
        <div class="diagrama">{D['componentes']}<p class="titulo-fig">Figura 2. Diagrama de Componentes</p></div>
        """,
    },
    {
        "id": "despliegue",
        "titulo": "6. Despliegue con Docker",
        "presentador": "ed",
        "contenido": f"""
        <p>Todo el sistema se levanta con <strong>un solo comando</strong>. Cero configuracion manual.</p>
        <pre class="codigo"><code>git clone https://github.com/roberto3101/MEDSCRIBE-DSW1-PILOTO.git
cd MEDSCRIBE-DSW1-PILOTO
docker compose up --build</code></pre>
        <div class="diagrama">{D['despliegue']}<p class="titulo-fig">Figura 3. Diagrama de Despliegue</p></div>
        """,
    },

    # ========== JASON (C# Backend) ==========
    {
        "id": "casos-uso",
        "titulo": "7. Casos de uso del sistema",
        "presentador": "ja",
        "contenido": f"""
        <p>El sistema reconoce dos actores: <strong>Medico</strong> (atiende pacientes) y <strong>Administrador</strong> (ademas configura la clinica). El Administrador <em>hereda</em> todos los permisos del Medico y agrega los suyos propios.</p>
        <div class="diagrama">{D['casos_uso']}<p class="titulo-fig">Figura 4. Diagrama de Casos de Uso (Medico y Admin)</p></div>
        """,
    },
    {
        "id": "secuencia-login",
        "titulo": "8. Autenticacion: secuencia de Login",
        "presentador": "ja",
        "contenido": f"""
        <p>Como protege el backend C# las sesiones del usuario: validacion en stored procedure + token JWT firmado.</p>
        <div class="diagrama">{D['sec_login']}<p class="titulo-fig">Figura 5. Secuencia de inicio de sesion</p></div>
        <ul class="bullets-arq">
          <li><strong>BCrypt</strong> para hash de contrasenas (no se guardan en texto plano).</li>
          <li><strong>JWT</strong> firmado con HMAC y permisos serializados como JSON.</li>
          <li><strong>RBAC granular</strong>: cada endpoint valida modulo + accion (ver/crear/editar/eliminar).</li>
        </ul>
        """,
    },

    # ========== LUIS (Base de Datos) ==========
    {
        "id": "clases",
        "titulo": "9. Modelo de Clases del dominio",
        "presentador": "lu",
        "contenido": f"""
        <p>Las clases principales del dominio. Una <em>Clinica</em> agrupa <em>Usuarios</em> y <em>Pacientes</em>; un <em>Usuario</em> puede ser <em>Medico</em>; un <em>Medico</em> atiende <em>Consultas</em> que generan <em>Documentos</em>.</p>
        <div class="diagrama">{D['clases']}<p class="titulo-fig">Figura 6. Diagrama de Clases del dominio</p></div>
        """,
    },
    {
        "id": "bd",
        "titulo": "10. Modelo Entidad-Relacion (BD)",
        "presentador": "lu",
        "contenido": f"""
        <p>Vista fisica de la base de datos en SQL Server: <strong>13 tablas</strong> principales y mas de <strong>45 stored procedures</strong>.</p>
        <div class="diagrama">{D['er']}<p class="titulo-fig">Figura 7. Modelo Entidad-Relacion</p></div>
        """,
    },
    {
        "id": "estados",
        "titulo": "11. Estados de la Consulta",
        "presentador": "lu",
        "contenido": f"""
        <p>Toda <em>Consulta</em> pasa por estados controlados durante su vida util. Cada transicion esta validada por la base de datos.</p>
        <div class="diagrama">{D['estados']}<p class="titulo-fig">Figura 8. Estados y transiciones de la consulta</p></div>
        """,
    },

    # ========== ROBERTO (IA Python) ==========
    {
        "id": "secuencia-trans",
        "titulo": "12. Crear consulta desde audio",
        "presentador": "ro",
        "contenido": f"""
        <p>El flujo completo de una consulta clinica: desde la grabacion hasta el PDF generado.</p>
        <div class="diagrama">{D['sec_trans']}<p class="titulo-fig">Figura 9. Secuencia de creacion de consulta con IA</p></div>
        """,
    },
    {
        "id": "pipeline",
        "titulo": "13. Pipeline de Inteligencia Artificial",
        "presentador": "ro",
        "contenido": f"""
        <p>El cerebro del sistema: cada paso convierte el audio crudo en una nota clinica estructurada en formato SOAP.</p>
        <div class="diagrama">{D['actividades']}<p class="titulo-fig">Figura 10. Pipeline completo de IA</p></div>
        <ul class="bullets-arq">
          <li><strong>Whisper (Groq)</strong> transcribe el audio en menos de 1 segundo.</li>
          <li><strong>Pyannote / Deepgram</strong> identifica quien hablo en cada parrafo.</li>
          <li><strong>Llama 3.3 70B</strong> arma la nota clinica estructurada.</li>
          <li><strong>RAG con Qdrant</strong> aporta contexto medico relevante.</li>
        </ul>
        """,
    },
    {
        "id": "tecnologias",
        "titulo": "14. Stack tecnologico completo",
        "presentador": "ro",
        "contenido": """
        <table class="tabla-tech">
          <thead><tr><th>Componente</th><th>Tecnologia</th><th>Para que se usa</th></tr></thead>
          <tbody>
            <tr><td>Frontend</td><td>React 19 + TypeScript + Vite + Tailwind CSS</td><td>Interfaz del usuario</td></tr>
            <tr><td>Backend</td><td>C# .NET 9 + ASP.NET Core Web API</td><td>Gateway REST y logica de negocio</td></tr>
            <tr><td>Servicio IA</td><td>Python 3.12 + FastAPI</td><td>Pipeline de transcripcion y generacion</td></tr>
            <tr><td>Base relacional</td><td>SQL Server Express</td><td>Datos transaccionales</td></tr>
            <tr><td>Base vectorial</td><td>Qdrant</td><td>Busqueda de contexto medico (RAG)</td></tr>
            <tr><td>Cola y cache</td><td>Redis</td><td>Trabajos asincronos</td></tr>
            <tr><td>Acceso a datos</td><td>ADO.NET + Stored Procedures</td><td>Acceso seguro a SQL Server</td></tr>
            <tr><td>Autenticacion</td><td>JWT + BCrypt</td><td>Sesiones seguras</td></tr>
            <tr><td>Transcripcion</td><td>Whisper (Groq API)</td><td>Convertir voz en texto</td></tr>
            <tr><td>Diarizacion</td><td>Pyannote 3.1 / Deepgram Nova-3</td><td>Identificar oradores</td></tr>
            <tr><td>LLM</td><td>Llama 3.3 70B (Groq API)</td><td>Generar nota clinica estructurada</td></tr>
            <tr><td>Documentos</td><td>ReportLab + python-docx</td><td>Generar PDF y Word</td></tr>
            <tr><td>Empaquetado</td><td>Docker + Docker Compose</td><td>Levantar todo con un comando</td></tr>
          </tbody>
        </table>
        """,
    },

    # ========== CIERRE TODOS ==========
    {
        "id": "equipo",
        "titulo": "15. Equipo de desarrollo",
        "presentador": "all",
        "contenido": """
        <p>Cuatro personas, cuatro especialidades, una sola vision.</p>
        <div class="equipo">
          <div class="integrante" style="--p-color:#f59e0b">
            <div class="integrante-avatar">R</div>
            <h4>Jose Roberto La Rosa Ledezma</h4>
            <p class="codigo">i202333980</p>
            <span class="rol">Coordinador / Servicio IA Python</span>
          </div>
          <div class="integrante" style="--p-color:#7c3aed">
            <div class="integrante-avatar">J</div>
            <h4>Jason Davila Delgado</h4>
            <p class="codigo">i202415540</p>
            <span class="rol">Backend C# .NET</span>
          </div>
          <div class="integrante" style="--p-color:#dc2626">
            <div class="integrante-avatar">L</div>
            <h4>Luis Joel Curi</h4>
            <p class="codigo">i202417794</p>
            <span class="rol">Base de datos SQL Server</span>
          </div>
          <div class="integrante" style="--p-color:#0ea5e9">
            <div class="integrante-avatar">E</div>
            <h4>Edward Alexander Escobedo Murga</h4>
            <p class="codigo">i201917851</p>
            <span class="rol">Frontend React + Arquitectura</span>
          </div>
        </div>
        """,
    },
]


# ============================================================
# CONSTRUCCION DEL HTML
# ============================================================

# Generar nav agrupada por presentador
def generar_nav():
    grupos = {}
    for s in SECCIONES:
        grupos.setdefault(s["presentador"], []).append(s)
    bloques = []
    orden = ["ed", "ja", "lu", "ro", "all"]
    for clave in orden:
        if clave not in grupos:
            continue
        pr = PRESENTADORES[clave]
        items = grupos[clave]
        items_html = "".join(
            f'<li><a href="#{s["id"]}" data-id="{s["id"]}">{s["titulo"]}</a></li>'
            for s in items
        )
        bloques.append(f"""
        <div class="nav-grupo" style="--p-color:{pr['color']};--p-bg:{pr['color_fondo']}">
          <div class="nav-grupo-header">
            <div class="nav-avatar">{pr['inicial']}</div>
            <div>
              <div class="nav-presentador">{pr['nombre']}</div>
              <div class="nav-tema">{pr['tema']}</div>
            </div>
          </div>
          <ul>{items_html}</ul>
        </div>
        """)
    return "".join(bloques)


def generar_secciones():
    out = []
    for i, s in enumerate(SECCIONES):
        pr = PRESENTADORES[s["presentador"]]
        out.append(f"""
        <section id="{s['id']}" data-presentador="{s['presentador']}" data-indice="{i+1}" style="--p-color:{pr['color']};--p-bg:{pr['color_fondo']}">
          <div class="seccion-header">
            <h2>{s['titulo']}</h2>
            {badge(s['presentador'])}
          </div>
          <div class="seccion-contenido">
            {s['contenido']}
          </div>
        </section>
        """)
    return "".join(out)


HTML = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MedScribe AI - Presentacion del Proyecto</title>
<style>
  :root {
    --azul: #1e3a8a;
    --azul-claro: #2563eb;
    --gris-claro: #f8fafc;
    --gris: #475569;
    --gris-borde: #e2e8f0;
    --texto: #1e293b;
    --verde: #10b981;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; scroll-padding-top: 80px; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
    line-height: 1.7;
    color: var(--texto);
    background: var(--gris-claro);
  }

  /* ---------- HEADER ---------- */
  header.principal {
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    color: white;
    padding: 5rem 2rem 4rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  header.principal::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    animation: rotar 60s linear infinite;
  }
  @keyframes rotar { to { transform: rotate(360deg); } }
  header.principal h1 {
    font-size: 4rem;
    margin-bottom: 0.5rem;
    letter-spacing: -2px;
    position: relative;
    text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  header.principal .subtitulo {
    font-size: 1.4rem;
    opacity: 0.95;
    font-weight: 300;
    position: relative;
  }
  header.principal .meta {
    margin-top: 2rem;
    font-size: 1rem;
    opacity: 0.85;
    position: relative;
  }
  header.principal .meta span {
    display: inline-block;
    padding: 0.4rem 1rem;
    background: rgba(255,255,255,0.1);
    border-radius: 20px;
    margin: 0.25rem;
    backdrop-filter: blur(10px);
  }

  /* ---------- BARRA NAVEGACION ---------- */
  nav.barra {
    background: white;
    border-bottom: 2px solid var(--gris-borde);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .barra-contenido {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .barra-titulo {
    font-weight: 700;
    color: var(--azul);
    font-size: 1.1rem;
  }
  .barra-controles {
    display: flex;
    gap: 0.5rem;
  }
  .barra-controles button {
    background: var(--gris-claro);
    border: 1px solid var(--gris-borde);
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--texto);
    transition: all 0.2s;
  }
  .barra-controles button:hover {
    background: var(--azul);
    color: white;
    border-color: var(--azul);
  }
  .barra-controles button.activo {
    background: var(--azul);
    color: white;
    border-color: var(--azul);
  }

  /* ---------- INDICADOR DE SECCION ACTIVA ---------- */
  .indicador-presentador {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    background: white;
    padding: 0.75rem 1.25rem;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 99;
    border: 3px solid var(--p-color, #2563eb);
    transition: all 0.3s;
  }
  .indicador-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--p-color, #2563eb);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
  }
  .indicador-info {
    font-size: 0.85rem;
  }
  .indicador-info .ahora { color: var(--gris); font-size: 0.7rem; text-transform: uppercase; }
  .indicador-info .nombre { font-weight: 700; color: var(--texto); }

  /* ---------- LAYOUT PRINCIPAL ---------- */
  main.contenedor {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
  }

  aside.lateral {
    position: sticky;
    top: 80px;
    height: calc(100vh - 100px);
    overflow-y: auto;
    padding-right: 0.5rem;
  }
  aside.lateral::-webkit-scrollbar { width: 6px; }
  aside.lateral::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

  .nav-grupo {
    background: white;
    border-radius: 12px;
    margin-bottom: 0.75rem;
    overflow: hidden;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }
  .nav-grupo:hover { border-color: var(--p-color); }
  .nav-grupo-header {
    background: var(--p-bg);
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border-bottom: 1px solid var(--gris-borde);
  }
  .nav-avatar {
    width: 32px; height: 32px;
    background: var(--p-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
  .nav-presentador {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--texto);
    line-height: 1.2;
  }
  .nav-tema {
    font-size: 0.75rem;
    color: var(--gris);
    line-height: 1.2;
  }
  .nav-grupo ul {
    list-style: none;
    padding: 0.5rem 0;
  }
  .nav-grupo li a {
    display: block;
    padding: 0.45rem 1rem 0.45rem 2.5rem;
    color: var(--texto);
    text-decoration: none;
    font-size: 0.85rem;
    border-left: 3px solid transparent;
    transition: all 0.15s;
    line-height: 1.35;
  }
  .nav-grupo li a:hover {
    background: var(--p-bg);
    border-left-color: var(--p-color);
  }
  .nav-grupo li a.activo {
    background: var(--p-bg);
    border-left-color: var(--p-color);
    font-weight: 600;
    color: var(--p-color);
  }

  /* ---------- SECCIONES ---------- */
  .secciones { display: flex; flex-direction: column; gap: 1.5rem; }

  section {
    background: white;
    padding: 2rem 2.5rem;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    border-left: 6px solid var(--p-color, #2563eb);
    scroll-margin-top: 80px;
  }
  .seccion-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--p-bg, #e0f2fe);
    margin-bottom: 1.5rem;
  }
  .seccion-header h2 {
    color: var(--p-color, #1e3a8a);
    font-size: 1.7rem;
    line-height: 1.25;
    flex: 1;
    min-width: 200px;
  }

  /* Badge presentador */
  .presentador {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: var(--p-bg);
    padding: 0.5rem 0.9rem;
    border-radius: 50px;
    border: 2px solid var(--p-color);
    flex-shrink: 0;
  }
  .presentador-avatar {
    width: 36px; height: 36px;
    background: var(--p-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
  .presentador-rol {
    font-size: 0.65rem;
    color: var(--gris);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
  }
  .presentador-nombre {
    font-weight: 700;
    color: var(--texto);
    font-size: 0.85rem;
    line-height: 1.2;
  }
  .presentador-tema {
    font-size: 0.7rem;
    color: var(--gris);
    font-style: italic;
  }

  .seccion-contenido p { margin-bottom: 1rem; text-align: justify; }
  .seccion-contenido ul, .seccion-contenido ol {
    margin-left: 2rem; margin-bottom: 1rem;
  }
  .seccion-contenido li { margin-bottom: 0.4rem; }
  .seccion-contenido strong { color: var(--p-color); }

  .bullets-arq {
    background: var(--p-bg);
    border-radius: 10px;
    padding: 1.2rem 1rem 1.2rem 3rem !important;
    margin-left: 0 !important;
    margin-top: 1rem;
  }

  /* Diagramas */
  .diagrama {
    background: #fafbfd;
    border: 1px solid var(--gris-borde);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    text-align: center;
    overflow: auto;
    cursor: zoom-in;
    position: relative;
    transition: box-shadow 0.2s;
  }
  .diagrama:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .diagrama::after {
    content: 'Click para ampliar';
    position: absolute;
    top: 0.6rem;
    right: 0.8rem;
    background: rgba(30, 58, 138, 0.85);
    color: white;
    padding: 0.25rem 0.6rem;
    border-radius: 50px;
    font-size: 0.7rem;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .diagrama:hover::after { opacity: 1; }
  .diagrama svg, .diagrama .svg-diagrama {
    max-width: 100%;
    width: 100%;
    height: auto;
    max-height: 78vh;
    pointer-events: none;
  }
  .diagrama .titulo-fig {
    font-weight: 700;
    color: var(--p-color);
    margin-top: 1rem;
    text-align: center;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ---------- ZOOM MODAL ---------- */
  .zoom-modal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    overflow: hidden;
    user-select: none;
  }
  .zoom-modal.abierto { display: block; }
  .zoom-contenido {
    position: absolute;
    inset: 0;
    cursor: grab;
    overflow: hidden;
  }
  .zoom-contenido.arrastrando { cursor: grabbing; }
  .zoom-contenido svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: 0 0;
    max-width: none !important;
    max-height: none !important;
    width: auto !important;
    height: auto !important;
    pointer-events: none;
  }
  .zoom-controles {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: white;
    padding: 0.5rem;
    border-radius: 12px;
    display: flex;
    gap: 0.4rem;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .zoom-controles button {
    width: 40px;
    height: 40px;
    border: 1px solid #cbd5e1;
    background: white;
    cursor: pointer;
    font-weight: 700;
    font-size: 1.1rem;
    border-radius: 8px;
    color: var(--azul);
    transition: all 0.15s;
  }
  .zoom-controles button:hover {
    background: var(--azul);
    color: white;
    border-color: var(--azul);
  }
  .zoom-controles button.cerrar { color: #dc2626; }
  .zoom-controles button.cerrar:hover { background: #dc2626; border-color: #dc2626; }
  .zoom-info {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255,255,255,0.95);
    padding: 0.6rem 1.2rem;
    border-radius: 50px;
    font-size: 0.85rem;
    color: var(--texto);
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .zoom-info kbd {
    background: var(--gris-claro);
    border: 1px solid var(--gris-borde);
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    font-family: monospace;
    font-size: 0.8rem;
    margin: 0 0.15rem;
  }
  .zoom-escala {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    background: rgba(255,255,255,0.95);
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--azul);
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }

  /* Cita */
  .cita {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border-left: 5px solid #f59e0b;
    padding: 1.5rem 2rem;
    margin: 1.5rem 0;
    border-radius: 8px;
    font-style: italic;
    font-size: 1.1rem;
    position: relative;
  }
  .cita-marca {
    font-size: 4rem;
    color: #f59e0b;
    line-height: 0.5;
    margin-right: 0.5rem;
    font-weight: bold;
  }
  .cita-fuente {
    display: block;
    margin-top: 0.5rem;
    text-align: right;
    font-style: normal;
    font-size: 0.85rem;
    color: var(--gris);
    font-weight: 600;
  }

  /* Codigo */
  .codigo {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1.2rem 1.5rem;
    border-radius: 10px;
    font-family: 'Consolas', 'Monaco', monospace;
    overflow-x: auto;
    font-size: 0.95rem;
    margin: 1rem 0;
    line-height: 1.6;
  }

  /* Objetivos grid */
  .objetivos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }
  .objetivo {
    background: var(--p-bg);
    padding: 1.2rem;
    border-radius: 10px;
    border-left: 4px solid var(--p-color);
  }
  .objetivo.destacado {
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    border-left-color: #10b981;
    grid-column: 1 / -1;
  }
  .objetivo h4 {
    color: var(--p-color);
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }
  .objetivo.destacado h4 { color: #047857; }

  /* Tabla tecnologias */
  .tabla-tech {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.9rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .tabla-tech th {
    background: var(--p-color);
    color: white;
    padding: 0.85rem 1rem;
    text-align: left;
    font-weight: 600;
  }
  .tabla-tech td {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid var(--gris-borde);
  }
  .tabla-tech tr:hover td { background: var(--p-bg); }
  .tabla-tech tr:last-child td { border-bottom: none; }

  /* Equipo */
  .equipo {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.2rem;
    margin-top: 1.5rem;
  }
  .integrante {
    background: white;
    border: 2px solid var(--p-color);
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    transition: transform 0.2s;
  }
  .integrante:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }
  .integrante-avatar {
    width: 64px; height: 64px;
    background: var(--p-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 auto 0.75rem;
  }
  .integrante h4 {
    color: var(--texto);
    margin-bottom: 0.25rem;
    font-size: 1rem;
  }
  .integrante .codigo {
    font-family: 'Consolas', monospace;
    color: var(--gris);
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
    background: transparent;
    padding: 0;
  }
  .integrante .rol {
    background: var(--p-color);
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    display: inline-block;
    font-weight: 600;
  }

  /* Footer */
  footer.principal {
    background: var(--azul);
    color: white;
    text-align: center;
    padding: 2.5rem 2rem;
    margin-top: 3rem;
  }
  footer.principal p { margin-bottom: 0.5rem; opacity: 0.9; }

  /* ---------- MODO PRESENTACION ---------- */
  body.modo-presentacion main.contenedor {
    grid-template-columns: 1fr;
    max-width: 100%;
    padding: 0.75rem 1rem 1rem;
  }
  body.modo-presentacion aside.lateral { display: none; }
  body.modo-presentacion section {
    min-height: calc(100vh - 100px);
    padding: 1.5rem 2rem;
    margin-bottom: 1rem;
  }
  body.modo-presentacion .seccion-header {
    padding-bottom: 0.6rem;
    margin-bottom: 0.8rem;
  }
  body.modo-presentacion .seccion-header h2 { font-size: 2.2rem; }
  body.modo-presentacion .seccion-contenido { font-size: 1.15rem; }
  body.modo-presentacion .seccion-contenido p { margin-bottom: 0.6rem; }
  body.modo-presentacion .indicador-presentador { display: none; }
  /* Diagramas grandes en modo presentacion */
  body.modo-presentacion .diagrama {
    padding: 0.5rem;
    margin: 0.5rem 0;
    background: white;
    border: none;
  }
  body.modo-presentacion .diagrama svg,
  body.modo-presentacion .diagrama .svg-diagrama {
    max-height: calc(100vh - 220px);
    min-height: 60vh;
  }
  body.modo-presentacion .titulo-fig { margin-top: 0.4rem; }

  /* Botones flotantes prev/next en modo presentacion */
  .controles-presentacion {
    display: none;
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    box-shadow: 0 6px 30px rgba(0,0,0,0.2);
    gap: 0.75rem;
    align-items: center;
    z-index: 99;
  }
  body.modo-presentacion .controles-presentacion { display: flex; }
  .controles-presentacion button {
    background: var(--azul);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .controles-presentacion button:hover { background: var(--azul-claro); }
  .controles-presentacion .progreso {
    font-size: 0.85rem;
    color: var(--gris);
    font-weight: 600;
  }

  /* ---------- RESPONSIVE ---------- */
  @media (max-width: 980px) {
    main.contenedor { grid-template-columns: 1fr; padding: 1rem; }
    aside.lateral { position: relative; top: 0; height: auto; max-height: 400px; }
    header.principal h1 { font-size: 2.5rem; }
    section { padding: 1.5rem; }
    .seccion-header h2 { font-size: 1.4rem; }
    .indicador-presentador { display: none; }
  }

  /* ---------- IMPRESION ---------- */
  @media print {
    nav.barra, aside.lateral, .indicador-presentador, .controles-presentacion {
      display: none !important;
    }
    main.contenedor { grid-template-columns: 1fr; max-width: 100%; padding: 0; }
    section { box-shadow: none; page-break-inside: avoid; }
    body { background: white; }
  }
</style>
</head>
<body>

<header class="principal">
  <h1>MedScribe AI</h1>
  <p class="subtitulo">Sistema de Documentacion Medica Automatizada con Inteligencia Artificial</p>
  <p class="meta">
    <span>Curso: DSW1</span>
    <span>Cibertec 2026-I</span>
    <span>Docente: Ing. Antonio Valdivia</span>
  </p>
</header>

<nav class="barra">
  <div class="barra-contenido">
    <div class="barra-titulo">MedScribe AI - Presentacion</div>
    <div class="barra-controles">
      <button id="btn-modo">Modo presentacion</button>
      <button id="btn-imprimir">Imprimir / PDF</button>
    </div>
  </div>
</nav>

<main class="contenedor">

<aside class="lateral">
  __NAV__
</aside>

<div class="secciones">
  __SECCIONES__
</div>

</main>

<div class="controles-presentacion">
  <button id="btn-prev">&lt; Anterior</button>
  <span class="progreso" id="progreso">1 / 15</span>
  <button id="btn-next">Siguiente &gt;</button>
  <button id="btn-salir-modo">Salir</button>
</div>

<div class="indicador-presentador" id="indicador" style="--p-color:#0ea5e9">
  <div class="indicador-avatar" id="ind-avatar">E</div>
  <div class="indicador-info">
    <div class="ahora">Presenta ahora</div>
    <div class="nombre" id="ind-nombre">Edward Escobedo</div>
  </div>
</div>

<!-- Modal de zoom para diagramas -->
<div class="zoom-modal" id="zoom-modal">
  <div class="zoom-controles">
    <button id="zoom-mas" title="Acercar (+)">+</button>
    <button id="zoom-menos" title="Alejar (-)">-</button>
    <button id="zoom-reset" title="Restablecer (0)">0</button>
    <button id="zoom-cerrar" class="cerrar" title="Cerrar (Esc)">x</button>
  </div>
  <div class="zoom-contenido" id="zoom-contenido"></div>
  <div class="zoom-info">
    <kbd>Scroll</kbd> zoom &middot; <kbd>Arrastrar</kbd> mover &middot; <kbd>+</kbd>/<kbd>-</kbd> zoom &middot; <kbd>0</kbd> reset &middot; <kbd>Esc</kbd> cerrar
  </div>
  <div class="zoom-escala" id="zoom-escala">100%</div>
</div>

<footer class="principal">
  <p><strong>MedScribe AI</strong> | Proyecto del curso DSW1 | Cibertec 2026-I</p>
  <p>Equipo: Roberto La Rosa | Jason Davila | Luis Curi | Edward Escobedo</p>
</footer>

<script>
  // Datos de presentadores (sincronizado con Python)
  const PRESENTADORES = {
    ed: { nombre: 'Edward Escobedo', color: '#0ea5e9', inicial: 'E' },
    ja: { nombre: 'Jason Davila',     color: '#7c3aed', inicial: 'J' },
    lu: { nombre: 'Luis Curi',        color: '#dc2626', inicial: 'L' },
    ro: { nombre: 'Roberto La Rosa',  color: '#f59e0b', inicial: 'R' },
    all:{ nombre: 'Equipo completo',  color: '#475569', inicial: '*' },
  };

  const secciones = Array.from(document.querySelectorAll('section[data-presentador]'));
  const enlacesNav = Array.from(document.querySelectorAll('.nav-grupo a'));
  const indicador = document.getElementById('indicador');
  const indAvatar = document.getElementById('ind-avatar');
  const indNombre = document.getElementById('ind-nombre');
  const progreso  = document.getElementById('progreso');

  // Detectar seccion visible y actualizar indicador + nav
  const observador = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = e.target.id;
        const p  = e.target.dataset.presentador;
        const idx = parseInt(e.target.dataset.indice);
        // Indicador
        const pr = PRESENTADORES[p];
        indicador.style.setProperty('--p-color', pr.color);
        indAvatar.textContent = pr.inicial;
        indAvatar.style.background = pr.color;
        indNombre.textContent = pr.nombre;
        // Nav activo
        enlacesNav.forEach(a => a.classList.toggle('activo', a.dataset.id === id));
        // Progreso
        progreso.textContent = idx + ' / ' + secciones.length;
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  secciones.forEach(s => observador.observe(s));

  // Modo presentacion
  const btnModo = document.getElementById('btn-modo');
  const btnSalir = document.getElementById('btn-salir-modo');
  btnModo.addEventListener('click', () => {
    document.body.classList.add('modo-presentacion');
    btnModo.classList.add('activo');
    document.documentElement.requestFullscreen?.();
  });
  btnSalir.addEventListener('click', () => {
    document.body.classList.remove('modo-presentacion');
    btnModo.classList.remove('activo');
    if (document.fullscreenElement) document.exitFullscreen();
  });

  // Navegacion siguiente/anterior
  function irA(idx) {
    if (idx < 0 || idx >= secciones.length) return;
    secciones[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function indiceActual() {
    const enMedio = window.innerHeight / 2;
    let act = 0;
    secciones.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top < enMedio) act = i;
    });
    return act;
  }
  document.getElementById('btn-prev').addEventListener('click', () => irA(indiceActual() - 1));
  document.getElementById('btn-next').addEventListener('click', () => irA(indiceActual() + 1));

  // Atajos de teclado generales
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // Si el zoom modal esta abierto, los atajos los maneja el modal (ver mas abajo)
    if (zoomModal.classList.contains('abierto')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      irA(indiceActual() + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      irA(indiceActual() - 1);
    } else if (e.key === 'Escape') {
      document.body.classList.remove('modo-presentacion');
      btnModo.classList.remove('activo');
    } else if (e.key === 'p' || e.key === 'P') {
      btnModo.click();
    }
  });

  // Imprimir
  document.getElementById('btn-imprimir').addEventListener('click', () => window.print());

  // ============================================
  // ZOOM MODAL PARA DIAGRAMAS
  // ============================================
  const zoomModal     = document.getElementById('zoom-modal');
  const zoomContenido = document.getElementById('zoom-contenido');
  const zoomEscala    = document.getElementById('zoom-escala');

  let zScale = 1, zTx = 0, zTy = 0;
  let zSvgBaseW = 0, zSvgBaseH = 0;
  let zArrastrando = false, zStartX = 0, zStartY = 0;

  function aplicarZoom() {
    const svg = zoomContenido.querySelector('svg');
    if (!svg) return;
    svg.style.transform = `translate(${zTx}px, ${zTy}px) scale(${zScale})`;
    zoomEscala.textContent = Math.round(zScale * 100) + '%';
  }

  function ajustarInicial() {
    const svg = zoomContenido.querySelector('svg');
    if (!svg) return;
    // Toma el ancho/alto del viewBox
    const vb = svg.viewBox.baseVal;
    zSvgBaseW = vb.width || svg.getBoundingClientRect().width || 800;
    zSvgBaseH = vb.height || svg.getBoundingClientRect().height || 600;
    // Fija un width/height base en pixeles para que scale opere predeciblemente
    const escalaInicial = Math.min(
      (window.innerWidth * 0.9) / zSvgBaseW,
      (window.innerHeight * 0.85) / zSvgBaseH
    );
    svg.style.width = zSvgBaseW + 'px';
    svg.style.height = zSvgBaseH + 'px';
    zScale = escalaInicial;
    // Centrar
    zTx = (window.innerWidth - zSvgBaseW * zScale) / 2 - window.innerWidth / 2;
    zTy = (window.innerHeight - zSvgBaseH * zScale) / 2 - window.innerHeight / 2;
    aplicarZoom();
  }

  function abrirZoom(svgOriginal) {
    const clon = svgOriginal.cloneNode(true);
    // Quita el style inline que limita tamano
    clon.removeAttribute('style');
    clon.classList.remove('svg-diagrama');
    zoomContenido.innerHTML = '';
    zoomContenido.appendChild(clon);
    zoomModal.classList.add('abierto');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(ajustarInicial);
  }

  function cerrarZoom() {
    zoomModal.classList.remove('abierto');
    document.body.style.overflow = '';
    zoomContenido.innerHTML = '';
  }

  // Click en cada diagrama abre el zoom
  document.querySelectorAll('.diagrama').forEach(d => {
    d.addEventListener('click', () => {
      const svg = d.querySelector('svg');
      if (svg) abrirZoom(svg);
    });
  });

  // Botones del modal
  document.getElementById('zoom-mas').addEventListener('click', () => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const factor = 1.25;
    zTx = cx - factor * (cx - zTx);
    zTy = cy - factor * (cy - zTy);
    zScale *= factor;
    aplicarZoom();
  });
  document.getElementById('zoom-menos').addEventListener('click', () => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const factor = 0.8;
    zTx = cx - factor * (cx - zTx);
    zTy = cy - factor * (cy - zTy);
    zScale *= factor;
    if (zScale < 0.1) zScale = 0.1;
    aplicarZoom();
  });
  document.getElementById('zoom-reset').addEventListener('click', ajustarInicial);
  document.getElementById('zoom-cerrar').addEventListener('click', cerrarZoom);

  // Wheel zoom centrado en cursor
  zoomModal.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const nuevo = zScale * factor;
    if (nuevo < 0.1 || nuevo > 20) return;
    // Ajustar translacion para que el cursor quede sobre el mismo punto
    zTx = e.clientX - factor * (e.clientX - zTx);
    zTy = e.clientY - factor * (e.clientY - zTy);
    zScale = nuevo;
    aplicarZoom();
  }, { passive: false });

  // Drag para mover
  zoomContenido.addEventListener('mousedown', (e) => {
    zArrastrando = true;
    zStartX = e.clientX - zTx;
    zStartY = e.clientY - zTy;
    zoomContenido.classList.add('arrastrando');
  });
  window.addEventListener('mousemove', (e) => {
    if (!zArrastrando) return;
    zTx = e.clientX - zStartX;
    zTy = e.clientY - zStartY;
    aplicarZoom();
  });
  window.addEventListener('mouseup', () => {
    zArrastrando = false;
    zoomContenido.classList.remove('arrastrando');
  });

  // Click fuera del SVG cierra
  zoomModal.addEventListener('click', (e) => {
    if (e.target === zoomModal) cerrarZoom();
  });

  // Atajos de teclado dentro del zoom modal
  document.addEventListener('keydown', (e) => {
    if (!zoomModal.classList.contains('abierto')) return;
    if (e.key === 'Escape') { cerrarZoom(); e.stopPropagation(); }
    else if (e.key === '+' || e.key === '=') document.getElementById('zoom-mas').click();
    else if (e.key === '-' || e.key === '_') document.getElementById('zoom-menos').click();
    else if (e.key === '0') document.getElementById('zoom-reset').click();
  });

  // Soporte touch (pinch zoom basico)
  let touchDist = 0;
  zoomContenido.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDist = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      zArrastrando = true;
      zStartX = e.touches[0].clientX - zTx;
      zStartY = e.touches[0].clientY - zTy;
    }
  });
  zoomContenido.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const nuevaDist = Math.hypot(dx, dy);
      const factor = nuevaDist / touchDist;
      zScale *= factor;
      touchDist = nuevaDist;
      aplicarZoom();
    } else if (e.touches.length === 1 && zArrastrando) {
      zTx = e.touches[0].clientX - zStartX;
      zTy = e.touches[0].clientY - zStartY;
      aplicarZoom();
    }
  }, { passive: false });
  zoomContenido.addEventListener('touchend', () => {
    zArrastrando = false;
    touchDist = 0;
  });
</script>

</body>
</html>
"""

html_final = HTML.replace("__NAV__", generar_nav())
html_final = html_final.replace("__SECCIONES__", generar_secciones())

SALIDA.write_text(html_final, encoding="utf-8")
print(f"OK: {SALIDA}")
print(f"Tamano: {SALIDA.stat().st_size // 1024} KB")
print(f"Secciones: {len(SECCIONES)}")
print(f"Diagramas embebidos (SVG inline): 10")
