import os
import tempfile
import numpy as np
import soundfile as sf
import torch
from pyannote.audio import Pipeline

TOKEN_HUGGINGFACE = os.getenv("AI_EXTRA_5_API_KEY", "")
_pipeline_cache = None


MODELO_PYANNOTE = "pyannote/speaker-diarization-3.1"


def _obtener_pipeline_pyannote():
    global _pipeline_cache
    if _pipeline_cache is None:
        if not TOKEN_HUGGINGFACE:
            raise RuntimeError(
                "Falta AI_EXTRA_5_API_KEY (token de HuggingFace). "
                "Obtenlo en https://huggingface.co/settings/tokens y acepta los "
                "terminos en https://huggingface.co/" + MODELO_PYANNOTE
            )
        # pyannote.audio 3.3.2 usa use_auth_token (no token) internamente.
        _pipeline_cache = Pipeline.from_pretrained(
            MODELO_PYANNOTE,
            use_auth_token=TOKEN_HUGGINGFACE,
        )
    return _pipeline_cache


def _convertir_bytes_a_waveform(contenido_audio: bytes, extension: str) -> dict:
    ruta_entrada = tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False).name
    with open(ruta_entrada, "wb") as f:
        f.write(contenido_audio)

    formatos_necesitan_conversion = {"webm", "ogg", "m4a", "mp3", "opus"}
    ruta_wav = ruta_entrada

    try:
        if extension.lower() in formatos_necesitan_conversion:
            ruta_wav = ruta_entrada.replace(f".{extension}", "_convertido.wav")
            import subprocess
            subprocess.run(
                ["ffmpeg", "-y", "-i", ruta_entrada, "-ar", "16000", "-ac", "1", "-f", "wav", ruta_wav],
                capture_output=True, check=True, timeout=30,
            )

        datos, tasa_muestreo = sf.read(ruta_wav, dtype="float32")

        if datos.ndim == 2:
            datos = np.mean(datos, axis=1)

        if tasa_muestreo != 16000:
            from scipy.signal import resample
            cantidad_muestras = int(len(datos) * 16000 / tasa_muestreo)
            datos = resample(datos, cantidad_muestras).astype(np.float32)
            tasa_muestreo = 16000

        tensor = torch.from_numpy(datos).unsqueeze(0)
        return {"waveform": tensor, "sample_rate": tasa_muestreo}
    finally:
        if os.path.exists(ruta_entrada):
            os.unlink(ruta_entrada)
        if ruta_wav != ruta_entrada and os.path.exists(ruta_wav):
            os.unlink(ruta_wav)


def diarizar_con_pyannote(contenido_audio: bytes, extension: str) -> list[dict]:
    audio_en_memoria = _convertir_bytes_a_waveform(contenido_audio, extension)
    pipeline = _obtener_pipeline_pyannote()
    resultado = pipeline(audio_en_memoria)
    diarizacion = resultado.speaker_diarization if hasattr(resultado, 'speaker_diarization') else resultado

    segmentos = []
    for turno, _, hablante in diarizacion.itertracks(yield_label=True):
        segmentos.append({
            "hablante": hablante,
            "inicio_segundos": round(turno.start, 2),
            "fin_segundos": round(turno.end, 2),
            "duracion_segundos": round(turno.end - turno.start, 2),
        })

    return segmentos


def _identificar_hablantes_principales(segmentos: list[dict], max_hablantes: int = 2) -> set[str]:
    tiempo_por_hablante: dict[str, float] = {}
    for s in segmentos:
        tiempo_por_hablante[s["hablante"]] = tiempo_por_hablante.get(s["hablante"], 0) + s["duracion_segundos"]

    ordenados = sorted(tiempo_por_hablante.keys(), key=lambda h: tiempo_por_hablante[h], reverse=True)
    return set(ordenados[:max_hablantes])


def _extraer_audio_de_segmentos(contenido_audio: bytes, extension: str, segmentos: list[dict], hablantes_permitidos: set[str]) -> bytes:
    audio_en_memoria = _convertir_bytes_a_waveform(contenido_audio, extension)
    waveform = audio_en_memoria["waveform"]
    sr = audio_en_memoria["sample_rate"]

    partes = []
    for s in segmentos:
        if s["hablante"] in hablantes_permitidos:
            inicio = int(s["inicio_segundos"] * sr)
            fin = int(s["fin_segundos"] * sr)
            partes.append(waveform[:, inicio:fin])

    if not partes:
        audio_final = waveform
    else:
        audio_final = torch.cat(partes, dim=1)

    ruta_salida = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    sf.write(ruta_salida, audio_final.squeeze(0).numpy(), sr)

    with open(ruta_salida, "rb") as f:
        datos = f.read()
    os.unlink(ruta_salida)
    return datos


def _extraer_bytes_de_segmento(waveform: torch.Tensor, sr: int, inicio: float, fin: float) -> bytes:
    muestra_inicio = int(inicio * sr)
    muestra_fin = int(fin * sr)
    segmento = waveform[:, muestra_inicio:muestra_fin]

    if segmento.shape[1] < sr * 0.3:
        return b""

    ruta = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    sf.write(ruta, segmento.squeeze(0).numpy(), sr)
    with open(ruta, "rb") as f:
        datos = f.read()
    os.unlink(ruta)
    return datos


async def transcribir_y_diarizar_con_pyannote(contenido_audio: bytes, extension: str) -> dict:
    from app.servicios.servicio_whisper import transcribir_audio_con_whisper

    segmentos = diarizar_con_pyannote(contenido_audio, extension)

    if not segmentos:
        transcripcion = await transcribir_audio_con_whisper(contenido_audio, f"audio.{extension}")
        return {"transcripcion": transcripcion, "diarizacion": None}

    audio_en_memoria = _convertir_bytes_a_waveform(contenido_audio, extension)
    waveform = audio_en_memoria["waveform"]
    sr = audio_en_memoria["sample_rate"]

    hablantes_principales = _identificar_hablantes_principales(segmentos)
    textos_principales = []

    for s in segmentos:
        s["es_principal"] = s["hablante"] in hablantes_principales

        bytes_segmento = _extraer_bytes_de_segmento(waveform, sr, s["inicio_segundos"], s["fin_segundos"])

        if bytes_segmento:
            try:
                texto = await transcribir_audio_con_whisper(bytes_segmento, "segmento.wav")
                s["texto"] = texto.strip()
            except Exception:
                s["texto"] = ""
        else:
            s["texto"] = ""

        if s["es_principal"] and s["texto"]:
            textos_principales.append(s["texto"])

    segmentos_con_texto = [s for s in segmentos if s.get("texto")]
    clasificacion_ia = await _clasificar_segmentos_con_ia(segmentos_con_texto)

    textos_principales = []
    segmentos_descartados_count = 0

    for s in segmentos:
        rol_asignado = clasificacion_ia.get(f"{s['inicio_segundos']}-{s['fin_segundos']}", "MEDICO")
        s["rol_clinico"] = rol_asignado
        s["es_principal"] = rol_asignado != "TERCERO"

        if s["es_principal"] and s.get("texto"):
            textos_principales.append(s["texto"])
        if not s["es_principal"]:
            segmentos_descartados_count += 1

    transcripcion_completa = " ".join(textos_principales).strip()

    if not transcripcion_completa:
        ruta_fallback = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        try:
            sf.write(ruta_fallback, waveform.squeeze(0).numpy(), sr)
            with open(ruta_fallback, "rb") as f:
                audio_wav_completo = f.read()
            transcripcion_completa = (await transcribir_audio_con_whisper(audio_wav_completo, "audio.wav")).strip()
        finally:
            if os.path.exists(ruta_fallback):
                os.unlink(ruta_fallback)

    cantidad_hablantes = len(set(s.get("rol_clinico", "") for s in segmentos if s.get("texto")))

    return {
        "transcripcion": transcripcion_completa,
        "diarizacion": {
            "motor": "pyannote",
            "hablantes_detectados": cantidad_hablantes,
            "segmentos_descartados": segmentos_descartados_count,
            "segmentos": segmentos,
        }
    }


async def _clasificar_segmentos_con_ia(segmentos: list[dict]) -> dict:
    if not segmentos:
        return {}

    import openai
    import httpx

    cliente = openai.OpenAI(
        api_key=os.getenv("AI_API_KEY", ""),
        base_url=os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1"),
        timeout=httpx.Timeout(60)
    )

    texto_segmentos = "\n".join(
        f"[{s['inicio_segundos']}s-{s['fin_segundos']}s] {s.get('hablante','?')}: {s.get('texto','')}"
        for s in segmentos if s.get("texto")
    )

    try:
        respuesta = cliente.chat.completions.create(
            model=os.getenv("AI_MODEL", "llama-3.3-70b-versatile"),
            max_tokens=2048,
            messages=[
                {
                    "role": "system",
                    "content": """Clasifica cada segmento de una consulta medica como MEDICO, PACIENTE o TERCERO.

MEDICO: terminologia clinica, diagnosticos, prescripciones, indicaciones, examenes
PACIENTE: describe sintomas, responde preguntas, expresa preocupaciones de salud
TERCERO: ninos, interrupciones no medicas, conversaciones ajenas

Responde SOLO JSON asi (sin markdown, sin texto extra):
{"0.03-0.25": "MEDICO", "1.6-2.63": "PACIENTE", "3.19-3.56": "TERCERO"}"""
                },
                {
                    "role": "user",
                    "content": texto_segmentos
                }
            ]
        )

        import json
        texto = respuesta.choices[0].message.content.strip()
        if "```" in texto:
            texto = texto.split("```json")[-1].split("```")[0] if "```json" in texto else texto.split("```")[1].split("```")[0]
        return json.loads(texto.strip())
    except Exception:
        return {f"{s['inicio_segundos']}-{s['fin_segundos']}": "MEDICO" for s in segmentos}
