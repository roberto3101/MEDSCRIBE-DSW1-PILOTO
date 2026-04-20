import asyncio
import logging
import os
import random

import httpx
import openai

from app.servicios.circuito_llm import CircuitoAbiertoError, circuito_llm_global

logger = logging.getLogger(__name__)

TIEMPO_ESPERA_LLM_SEGUNDOS = 120
REINTENTOS_MAXIMOS = 3
BACKOFF_BASE_SEGUNDOS = 1.5

cliente = openai.OpenAI(
    api_key=os.getenv("AI_API_KEY", ""),
    base_url=os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1"),
    timeout=httpx.Timeout(TIEMPO_ESPERA_LLM_SEGUNDOS),
)

MODELO = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")


def verificar_salud_llm() -> dict:
    if not cliente.api_key:
        return {
            "disponible": False,
            "modelo_configurado": MODELO,
            "detalle": "AI_API_KEY no configurada",
        }
    try:
        modelos_disponibles = cliente.models.list()
        ids_modelos = [m.id for m in getattr(modelos_disponibles, "data", [])]
        modelo_existe = MODELO in ids_modelos
        return {
            "disponible": True,
            "modelo_configurado": MODELO,
            "modelo_existe_en_proveedor": modelo_existe,
            "total_modelos_listados": len(ids_modelos),
            "detalle": "ok" if modelo_existe else f"Modelo '{MODELO}' no aparece en la lista del proveedor",
        }
    except openai.AuthenticationError as error:
        return {"disponible": False, "modelo_configurado": MODELO, "detalle": f"credenciales invalidas: {error}"}
    except openai.APIConnectionError as error:
        return {"disponible": False, "modelo_configurado": MODELO, "detalle": f"no se pudo conectar al proveedor: {error}"}
    except openai.APIError as error:
        return {"disponible": False, "modelo_configurado": MODELO, "detalle": f"error de API: {error}"}
    except Exception as error:
        return {"disponible": False, "modelo_configurado": MODELO, "detalle": f"error inesperado: {error}"}

MAX_TOKENS_POR_TIPO_DOCUMENTO = {
    "Receta": 1024,
    "SOAP": 2560,
    "HistoriaClinica": 4096,
    "Personalizada": 3072,
}

AJUSTE_MAX_TOKENS_POR_INTENCION = {
    "receta_simple": 0.5,
    "control_rutinario": 0.8,
    "seguimiento": 0.85,
    "consulta_general": 1.0,
    "consulta_diagnostica": 1.0,
    "primera_consulta": 1.1,
    "urgencia": 1.1,
}

TEMPERATURA_POR_TIPO_DOCUMENTO = {
    "Receta": 0.0,
    "SOAP": 0.15,
    "HistoriaClinica": 0.2,
    "Personalizada": 0.2,
}


def _calcular_max_tokens(tipo_documento: str, clasificacion: dict) -> int:
    base = MAX_TOKENS_POR_TIPO_DOCUMENTO.get(tipo_documento, 2560)
    ajuste = AJUSTE_MAX_TOKENS_POR_INTENCION.get(clasificacion.get("intencion_principal", "consulta_general"), 1.0)
    if clasificacion.get("longitud_categoria") == "corta":
        ajuste *= 0.8
    elif clasificacion.get("longitud_categoria") == "extensa":
        ajuste *= 1.15
    return max(512, int(base * ajuste))


def _calcular_temperatura(tipo_documento: str, clasificacion: dict) -> float:
    base = TEMPERATURA_POR_TIPO_DOCUMENTO.get(tipo_documento, 0.2)
    if clasificacion.get("calidad_estimada", 1.0) < 0.4:
        return min(0.25, base + 0.05)
    return base


def _construir_mensaje_sistema_para_nota_clinica(contexto: str, clasificacion: dict, tipo_documento: str) -> str:
    entidades = clasificacion.get("entidades", {}) or {}
    instrucciones_adicionales: list[str] = []

    if clasificacion.get("intencion_principal") == "receta_simple":
        instrucciones_adicionales.append(
            "- Enfocate en la prescripcion. Omite secciones clinicas extensas si no hay informacion relevante."
        )
    if clasificacion.get("intencion_principal") == "urgencia":
        instrucciones_adicionales.append(
            "- Destaca la prioridad clinica y el triage al inicio del documento."
        )
    if clasificacion.get("calidad_estimada", 1.0) < 0.5:
        instrucciones_adicionales.append(
            "- La calidad de la transcripcion es baja: marca explicitamente las ambiguedades y evita inventar datos clinicos."
        )
    if entidades.get("medicamento"):
        instrucciones_adicionales.append(
            "- Verifica nombres, dosis y frecuencias de medicamentos; si falta informacion, registralo en NOTAS DE VERIFICACION."
        )

    instrucciones_extra_texto = "\n".join(instrucciones_adicionales) if instrucciones_adicionales else "- (ninguna adicional)"

    return f"""Eres un asistente medico especializado en documentacion clinica en Peru.
Tu tarea es estructurar la siguiente transcripcion medica en un documento clinico profesional.

PRINCIPIOS NO NEGOCIABLES:
- Nunca inventes datos clinicos que no aparezcan en la transcripcion.
- Si un dato no esta disponible, escribe "No referido" en lugar de omitir el campo.
- No emitas diagnosticos definitivos si la transcripcion no los contiene; usa "Impresion diagnostica" cuando aplique.
- Mantente en espanol medico formal, sin coloquialismos ni muletillas.
- Respeta estrictamente la estructura del tipo de documento solicitado.

CONTEXTO CLINICO RELEVANTE:
{contexto}

CLASIFICACION DE LA CONSULTA:
- Especialidad: {clasificacion.get('especialidad', 'general')}
- Confianza de especialidad: {clasificacion.get('confianza_especialidad', 0.0):.2f}
- Intencion principal: {clasificacion.get('intencion_principal', 'consulta_general')}
- Longitud: {clasificacion.get('longitud_categoria', 'media')}
- Calidad estimada de transcripcion: {clasificacion.get('calidad_estimada', 1.0):.2f}
- Tipo de documento a generar: {tipo_documento}
- Entidades detectadas: {entidades}

INSTRUCCIONES DE SALIDA:
- Usa encabezados Markdown de nivel 2 (## Titulo) para cada seccion.
- Usa viñetas "- " para listas (sintomas, indicaciones, medicamentos).
- Elimina muletillas y lenguaje coloquial.
- Incluye codigos CIE-10 solo si la transcripcion o el contexto los sustenta.
- Si detectas ambiguedades o datos faltantes, agrega una seccion final "## NOTAS DE VERIFICACION".

INSTRUCCIONES ESPECIFICAS PARA ESTA CONSULTA:
{instrucciones_extra_texto}
"""


def _extraer_contenido_respuesta(respuesta) -> str:
    if not respuesta or not getattr(respuesta, "choices", None):
        raise RuntimeError("La API de LLM devolvio una respuesta sin choices")
    primera = respuesta.choices[0]
    if not primera or not getattr(primera, "message", None):
        raise RuntimeError("La API de LLM devolvio un choice sin message")
    contenido = primera.message.content
    if not contenido or not contenido.strip():
        raise RuntimeError("La API de LLM devolvio un mensaje vacio")
    return contenido


async def _invocar_con_reintentos(**kwargs) -> str:
    circuito_llm_global.verificar_si_permite_solicitud_o_lanzar()

    ultimo_error: Exception | None = None
    for intento in range(1, REINTENTOS_MAXIMOS + 1):
        try:
            respuesta = await asyncio.to_thread(cliente.chat.completions.create, **kwargs)
            contenido = _extraer_contenido_respuesta(respuesta)
            if intento > 1:
                logger.info("LLM: respuesta obtenida en intento %d/%d", intento, REINTENTOS_MAXIMOS)
            circuito_llm_global.registrar_exito()
            return contenido
        except (openai.APITimeoutError, openai.RateLimitError, openai.APIConnectionError) as error:
            ultimo_error = error
            if intento == REINTENTOS_MAXIMOS:
                circuito_llm_global.registrar_fallo()
                break
            espera = BACKOFF_BASE_SEGUNDOS * (2 ** (intento - 1)) + random.uniform(0, 0.3)
            logger.warning(
                "LLM: fallo transitorio (%s). Reintentando en %.2fs (intento %d/%d)",
                type(error).__name__, espera, intento, REINTENTOS_MAXIMOS,
            )
            await asyncio.sleep(espera)
        except openai.APIError:
            circuito_llm_global.registrar_fallo()
            raise
    raise ultimo_error if ultimo_error else RuntimeError("LLM: agotados los reintentos sin respuesta")


async def generar_nota_clinica_con_claude(
    transcripcion: str,
    contexto: str,
    tipo_documento: str,
    clasificacion: dict,
    request_id: str = "",
) -> str:
    mensaje_sistema = _construir_mensaje_sistema_para_nota_clinica(
        contexto, clasificacion, tipo_documento
    )
    max_tokens = _calcular_max_tokens(tipo_documento, clasificacion)
    temperatura = _calcular_temperatura(tipo_documento, clasificacion)

    logger.info(
        "LLM: request_id=%s modelo=%s tipo=%s intencion=%s max_tokens=%d temp=%.2f ctx_chars=%d",
        request_id or "-", MODELO, tipo_documento,
        clasificacion.get("intencion_principal", "consulta_general"),
        max_tokens, temperatura, len(contexto),
    )

    parametros = dict(
        model=MODELO,
        max_tokens=max_tokens,
        temperature=temperatura,
        top_p=0.9,
        messages=[
            {"role": "system", "content": mensaje_sistema},
            {"role": "user", "content": f"Transcripcion de la consulta medica:\n\n{transcripcion}"},
        ],
    )

    try:
        return await _invocar_con_reintentos(**parametros)
    except CircuitoAbiertoError as error:
        from fastapi import HTTPException
        logger.error("LLM: circuito abierto request_id=%s detalle=%s", request_id or "-", str(error))
        raise HTTPException(status_code=503, detail=f"Servicio de IA temporalmente indisponible: {str(error)}")
    except openai.APITimeoutError:
        from fastapi import HTTPException
        logger.error("LLM: timeout final request_id=%s", request_id or "-")
        raise HTTPException(status_code=504, detail="LLM API no respondio dentro del tiempo limite")
    except openai.RateLimitError as error:
        from fastapi import HTTPException
        logger.error("LLM: rate limit final request_id=%s detalle=%s", request_id or "-", str(error))
        raise HTTPException(status_code=429, detail="Servicio de IA ocupado, reintente en unos segundos")
    except openai.APIError as error:
        from fastapi import HTTPException
        logger.error("LLM: APIError request_id=%s detalle=%s", request_id or "-", str(error))
        raise HTTPException(status_code=502, detail=f"Error en LLM API: {str(error)}")
    except RuntimeError as error:
        from fastapi import HTTPException
        logger.error("LLM: respuesta invalida request_id=%s detalle=%s", request_id or "-", str(error))
        raise HTTPException(status_code=502, detail=f"Respuesta invalida del LLM: {str(error)}")
