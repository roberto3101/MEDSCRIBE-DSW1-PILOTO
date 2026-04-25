# Fundamentos que debes dominar

Antes de tocar el codigo, debes tener clara la teoria. Si te preguntan, debes saber responder estas cosas con tus propias palabras.

---

## 1. ¿Que es FastAPI?

**FastAPI es un framework web para Python**, equivalente a ASP.NET Core en C#. Sirve para crear APIs REST.

### Por que lo elegimos
- Es **rapido** (compite con Node.js y Go)
- Soporta **async/await** nativo (puede manejar muchas peticiones en paralelo)
- **Documentacion automatica**: genera Swagger sin escribir nada
- Usa **Pydantic** para validar inputs automaticamente

### Como se ve en codigo
```python
from fastapi import FastAPI
app = FastAPI()

@app.post("/api/ia/transcribir")
async def transcribir(audio: UploadFile):
    return {"texto": "hola mundo"}
```

Eso es todo. No hay XML, no hay configuracion compleja.

---

## 2. ¿Que es Whisper?

**Whisper es un modelo de inteligencia artificial creado por OpenAI** que convierte voz en texto. Es **open source y gratis**.

### Caracteristicas
- Soporta **mas de 90 idiomas** (incluido espanol perfectamente)
- Funciona con audio ruidoso
- Robusto frente a acentos
- Dos formas de usarlo:
  - **Local**: descargas el modelo y corre en tu maquina (lento sin GPU)
  - **API en la nube**: lo llamas como servicio (rapido)

### Por que usamos Groq Whisper
**Groq es una empresa que sirve Whisper como API gratis y ultra rapido** (menos de 1 segundo para audios cortos). Es lo mismo que Whisper de OpenAI pero corriendo en hardware especializado de Groq.

### Como se llama desde codigo
```python
respuesta = cliente_groq.audio.transcriptions.create(
    file=archivo_audio,
    model="whisper-large-v3"
)
texto = respuesta.text
```

---

## 3. ¿Que es la diarizacion?

**Diarizar = identificar quien habla en cada momento del audio.**

Whisper te da el texto, pero no te dice quien lo dijo. La diarizacion separa el audio en segmentos por orador.

### Resultado de Whisper SIN diarizacion
```
"Buenos dias doctor me duele la cabeza desde ayer..."
```

### Resultado CON diarizacion
```
[Medico]:    "Buenos dias, ¿que le trae por aqui?"
[Paciente]:  "Doctor, me duele la cabeza desde ayer."
[Medico]:    "¿En que parte de la cabeza?"
```

### Dos opciones que tenemos

| Opcion | Donde corre | Velocidad | Privacidad |
|---|---|---|---|
| **Pyannote** | Local en la maquina | Lenta (10s-30s) | Total (no sale el audio) |
| **Deepgram** | API en la nube | Rapida (1-3s) | El audio sale a Deepgram |

Tenemos las dos implementaciones. El usuario elige por configuracion.

---

## 4. ¿Que es un LLM (Large Language Model)?

**LLM = modelo de lenguaje grande.** Es una IA entrenada con MILLONES de textos para entender y generar lenguaje natural.

Ejemplos famosos: GPT-4 (OpenAI), Claude (Anthropic), **Llama 3.3** (Meta).

### Que puede hacer
- Resumir texto
- Reformular
- Estructurar informacion
- Responder preguntas
- Generar texto nuevo

### Que NO puede hacer (y por eso usamos RAG)
- No tiene conocimiento actualizado (su entrenamiento tiene fecha de corte)
- No conoce las plantillas especificas de tu clinica
- Puede inventar cosas si le faltan datos (alucinar)

### Por que usamos Llama 3.3
- Es **open source** (lo que significa que no estamos atados a OpenAI)
- Tiene **70 mil millones de parametros** (muy potente)
- **Groq lo sirve gratis** y rapidisimo
- Compite con GPT-4 en calidad

---

## 5. ¿Que es RAG (Retrieval Augmented Generation)?

**RAG = darle contexto extra al LLM para que no invente.**

### El problema
Si le pides al LLM "armame una nota SOAP" sin mas, te puede inventar el formato. No conoce TUS plantillas.

### La solucion RAG
1. Tu tienes documentos con guias clinicas, formatos SOAP, indicaciones medicas, etc.
2. Los **chunkas** (partes en pedazos pequenos) y los conviertes en **embeddings** (vectores numericos).
3. Los guardas en una **base vectorial** (Qdrant).
4. Cuando llega una peticion, **buscas los chunks mas relevantes** y los inyectas en el prompt.
5. El LLM ahora tiene EL contexto exacto.

### Esquema mental
```
Sin RAG: [LLM] -> respuesta inventada
Con RAG: [Pregunta + contexto buscado] -> [LLM] -> respuesta basada en datos reales
```

### En MedScribe
- Documentos: plantillas SOAP, guias de especialidades, formato peruano de receta.
- Base vectorial: **Qdrant** (puerto 6333).
- Archivo clave: `servicio-ia/app/servicios/servicio_rag.py`

---

## 6. ¿Que es Qdrant?

**Qdrant es una base de datos para vectores.** No guarda texto plano, guarda **representaciones numericas** (embeddings) de textos.

Sirve para hacer **busqueda semantica**: encuentra textos parecidos en SIGNIFICADO, no solo en palabras exactas.

### Ejemplo
Buscas: "el paciente tiene dolor de cabeza"
- Texto guardado A: "cefalea" -> Qdrant lo encuentra (semanticamente similar)
- Texto guardado B: "dolor de pies" -> Qdrant NO lo trae

Una BD relacional con LIKE no encontraria "cefalea" porque no tiene las palabras "dolor de cabeza".

---

## 7. ¿Que es Pydantic?

**Pydantic valida datos en Python automaticamente.** Es como las anotaciones `[Required]`, `[StringLength]` de C#.

```python
from pydantic import BaseModel

class PeticionTranscribir(BaseModel):
    audio_url: str
    idioma: str = "es"
    
# Si recibes JSON malformado, FastAPI rechaza con 422 automaticamente
```

---

## 8. ¿Que es un circuit breaker?

**Patron de resiliencia.** Si un servicio externo (Groq, Deepgram) empieza a fallar mucho, en lugar de seguir intentando (y empeorar la cosa), el circuito se "abre" y devuelve error rapido por X segundos.

Ahorra recursos y le da tiempo al servicio externo a recuperarse.

Archivo: `servicio-ia/app/servicios/circuito_llm.py`

---

## 9. ¿Que es idempotencia?

**Idempotente = se puede ejecutar muchas veces y el resultado es el mismo.**

Ejemplo: si el frontend reintenta una peticion porque hubo timeout, NO debemos procesar el audio dos veces. Cada peticion lleva un ID unico, y si ya lo procesamos, devolvemos el resultado cacheado.

Archivo: `servicio-ia/app/servicios/idempotencia.py`

---

## 10. ¿Que es ReportLab y python-docx?

- **ReportLab**: libreria Python para generar PDFs programaticamente. Controlamos colores, tablas, fuentes, logo.
- **python-docx**: lo mismo pero para Word (.docx). El medico puede abrirlo y seguir editando.

Archivos:
- `servicio-ia/app/servicios/generador_pdf.py`
- `servicio-ia/app/servicios/generador_word.py`

---

## Glosario rapido para responder en vivo

| Termino | En 5 segundos |
|---|---|
| FastAPI | Framework web Python rapido y moderno |
| Whisper | IA de OpenAI que convierte voz en texto |
| Diarizacion | Identificar quien habla en el audio |
| Pyannote | Libreria para diarizar localmente |
| Deepgram | API de diarizacion en la nube |
| LLM | Modelo de lenguaje grande (Llama, GPT) |
| Llama 3.3 | LLM open source de Meta |
| Groq | Empresa que sirve LLMs gratis y rapido |
| RAG | Tecnica de dar contexto al LLM antes de generar |
| Qdrant | Base de datos vectorial para busqueda semantica |
| Embeddings | Representacion numerica de un texto |
| Pydantic | Libreria Python para validar datos |
| Circuit breaker | Patron que corta llamadas si un servicio falla |
| Idempotencia | Que se pueda ejecutar varias veces sin efectos extra |
| ReportLab | Libreria Python para generar PDFs |
| python-docx | Libreria Python para generar Word |
