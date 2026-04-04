import openai
import os
import httpx

TIEMPO_ESPERA_LLM_SEGUNDOS = 120

cliente = openai.OpenAI(
    api_key=os.getenv("AI_API_KEY", ""),
    base_url=os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1"),
    timeout=httpx.Timeout(TIEMPO_ESPERA_LLM_SEGUNDOS)
)

MODELO = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")


def _construir_mensaje_sistema_para_nota_clinica(contexto: str, clasificacion: dict, tipo_documento: str) -> str:
    return f"""Eres un asistente medico especializado en documentacion clinica en Peru.
Tu tarea es estructurar la siguiente transcripcion medica en un documento clinico profesional.

CONTEXTO RELEVANTE:
{contexto}

CLASIFICACION DETECTADA:
- Especialidad: {clasificacion['especialidad']}
- Tipo de documento: {tipo_documento}
- Entidades detectadas: {clasificacion['entidades']}

INSTRUCCIONES:
- Genera el documento en formato {tipo_documento}
- Usa terminologia medica profesional en espanol
- Elimina muletillas y lenguaje coloquial
- Si hay ambiguedades, indicalas al final como "NOTAS DE VERIFICACION"
- Incluye codigos CIE-10 cuando sea posible
"""


async def generar_nota_clinica_con_claude(
    transcripcion: str,
    contexto: str,
    tipo_documento: str,
    clasificacion: dict
) -> str:
    mensaje_sistema = _construir_mensaje_sistema_para_nota_clinica(
        contexto, clasificacion, tipo_documento
    )

    try:
        respuesta = cliente.chat.completions.create(
            model=MODELO,
            max_tokens=4096,
            messages=[
                {"role": "system", "content": mensaje_sistema},
                {"role": "user", "content": f"Transcripcion de la consulta medica:\n\n{transcripcion}"}
            ]
        )
    except openai.APITimeoutError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=504,
            detail="LLM API no respondio dentro del tiempo limite"
        )
    except openai.APIError as error:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=502,
            detail=f"Error en LLM API: {str(error)}"
        )

    return respuesta.choices[0].message.content
