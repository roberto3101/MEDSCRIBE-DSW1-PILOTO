import os
import httpx

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
DEEPGRAM_URL = "https://api.deepgram.com/v1/listen"


async def transcribir_y_diarizar_con_deepgram(contenido_audio: bytes, extension: str) -> dict:
    if not DEEPGRAM_API_KEY:
        raise ValueError("DEEPGRAM_API_KEY no configurada en .env")

    mime_types = {
        "webm": "audio/webm",
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "m4a": "audio/mp4",
        "ogg": "audio/ogg",
    }
    tipo_mime = mime_types.get(extension, "audio/webm")

    parametros = {
        "model": "nova-3",
        "language": "es",
        "smart_format": "true",
        "diarize": "true",
        "punctuate": "true",
    }

    async with httpx.AsyncClient(timeout=120) as cliente:
        respuesta = await cliente.post(
            DEEPGRAM_URL,
            params=parametros,
            headers={
                "Authorization": f"Token {DEEPGRAM_API_KEY}",
                "Content-Type": tipo_mime,
            },
            content=contenido_audio,
        )

    if respuesta.status_code != 200:
        raise Exception(f"Deepgram respondio con {respuesta.status_code}: {respuesta.text}")

    resultado = respuesta.json()
    alternativa = resultado["results"]["channels"][0]["alternatives"][0]

    palabras = alternativa.get("words", [])
    transcripcion_completa = alternativa.get("transcript", "")

    hablantes_detectados = set()
    segmentos_por_hablante: list[dict] = []
    hablante_actual = None
    texto_actual: list[str] = []
    inicio_actual = 0.0

    for palabra in palabras:
        hablante = palabra.get("speaker", 0)
        hablantes_detectados.add(hablante)

        if hablante != hablante_actual and hablante_actual is not None:
            segmentos_por_hablante.append({
                "hablante": f"SPEAKER_{hablante_actual}",
                "inicio_segundos": round(inicio_actual, 2),
                "fin_segundos": round(palabra["start"], 2),
                "texto": " ".join(texto_actual),
                "es_principal": True,
            })
            texto_actual = []
            inicio_actual = palabra["start"]

        hablante_actual = hablante
        texto_actual.append(palabra.get("punctuated_word", palabra.get("word", "")))

    if texto_actual and hablante_actual is not None:
        segmentos_por_hablante.append({
            "hablante": f"SPEAKER_{hablante_actual}",
            "inicio_segundos": round(inicio_actual, 2),
            "fin_segundos": round(palabras[-1]["end"], 2),
            "texto": " ".join(texto_actual),
            "es_principal": True,
        })

    return {
        "transcripcion": transcripcion_completa,
        "diarizacion": {
            "motor": "deepgram",
            "hablantes_detectados": len(hablantes_detectados),
            "segmentos_descartados": 0,
            "segmentos": segmentos_por_hablante,
        }
    }
