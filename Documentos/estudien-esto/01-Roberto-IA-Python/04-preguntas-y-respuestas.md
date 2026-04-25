# Preguntas y respuestas

Posibles preguntas del profesor con respuestas listas para usar. Memoriza las respuestas, no las leas.

---

## Preguntas tecnicas basicas

### ¿Por que Python para esta parte y no C#?
> "Porque todo el ecosistema de IA esta en Python. Pyannote, Whisper, los SDKs de OpenAI, las librerias de embeddings, todo. Si lo hicieramos en C# tendriamos que reinventar mucho. Ademas, FastAPI nos da async nativo y validacion automatica con Pydantic."

### ¿Por que FastAPI y no Flask o Django?
> "Flask es sincrono y antiguo, Django es muy pesado y orientado a vistas server-rendered. FastAPI es moderno, asincrono nativo, valida con Pydantic y genera Swagger automaticamente. Para una API pura es la mejor opcion en Python hoy."

### ¿Es lo mismo Whisper local que Whisper de Groq?
> "Tecnicamente es el mismo modelo. La diferencia es donde corre. En local tarda mas porque depende del CPU/GPU del usuario. Groq lo sirve gratis y rapidisimo en hardware especializado. Para nuestro caso, Groq es la opcion ganadora porque no necesitamos privacidad maxima."

### ¿Que pasa si Groq se cae?
> "Tenemos un circuit breaker en `circuito_llm.py`. Si Groq devuelve error muchas veces seguidas, el circuito se abre y por 30 segundos no llamamos mas. Devolvemos al usuario un mensaje claro: 'Servicio de IA temporalmente no disponible, reintenta'. Esto evita saturar a Groq y le da tiempo a recuperarse."

### ¿Por que Llama 3.3 y no GPT-4?
> "Tres razones: (1) Es open source, no estamos atados a OpenAI. (2) Groq lo sirve gratis. (3) En benchmarks compite con GPT-4 en tareas estructuradas. Para nuestro caso es perfecto."

### ¿Como sabes que el LLM no inventa cosas?
> "Por dos mecanismos. Primero, RAG: le damos contexto medico real desde Qdrant para que se base en datos. Segundo, validamos el JSON de salida. Si Llama devuelve algo mal estructurado, reintentamos con backoff exponencial. Y por ultimo, el medico siempre revisa y aprueba la nota antes de generar el documento final."

---

## Preguntas sobre el pipeline

### ¿Cuanto tarda procesar un audio de 5 minutos?
> "Aproximadamente 25-30 segundos. Whisper tarda unos 2-3 segundos, diarizacion otros 3-5, el LLM unos 8-10, y la generacion de PDF y Word entre 1-2 cada uno. El cuello de botella es el LLM."

### ¿Por que diarizar si Whisper ya transcribe?
> "Whisper te da el texto, pero no sabe quien lo dijo. En una consulta hay dos personas hablando. Sin diarizacion, una nota clinica no podria distinguir lo que dijo el paciente versus lo que dijo el medico, y eso es critico para una historia clinica correcta."

### ¿Cual es la diferencia entre Pyannote y Deepgram?
> "Pyannote es open source y corre en local. Es lento pero el audio nunca sale de la maquina. Deepgram es API en la nube, mucho mas rapida, pero el audio sale a sus servidores. En MedScribe tenemos las dos implementaciones y el usuario elige por configuracion segun privacidad o velocidad."

### ¿Por que necesitan RAG si el LLM ya sabe medicina?
> "Porque el LLM no conoce TUS plantillas, TU formato, las guias clinicas que usa TU clinica. RAG nos permite inyectar ese contexto sin necesidad de re-entrenar el modelo, que seria carisimo y lento. Es mucho mas barato indexar nuestros documentos en Qdrant y buscarlos en cada peticion."

### ¿Que es exactamente un embedding?
> "Es la representacion numerica de un texto. Tomas un parrafo y lo conviertes en un vector de, por ejemplo, 1536 numeros. Textos con significado parecido tienen vectores cercanos en ese espacio. Asi puedes buscar por similitud semantica, no por palabras exactas."

---

## Preguntas sobre el codigo

### Mostrame donde se llama a Groq
> Apuntar al archivo: `servicio-ia/app/servicios/servicio_claude.py` para el LLM y `servicio_whisper.py` para la transcripcion.

### Mostrame el endpoint principal
> `servicio-ia/app/rutas/rutas_transcripcion.py` - el endpoint `POST /api/ia/transcribir` es el mas usado.

### ¿Donde esta el orquestador?
> `servicio-ia/app/servicios/pipeline_nota_clinica.py` - es el archivo central, coordina todos los pasos.

### ¿Como se generan los PDFs?
> "Con ReportLab en `generador_pdf.py`. Es una libreria Python que controla el PDF a bajo nivel: fuentes, colores, tablas, todo. Aplicamos una plantilla configurable por clinica en `configuracion_documentos.py`."

---

## Preguntas sobre integracion

### ¿Como se conecta el gateway C# con el servicio IA?
> "Por HTTP. El gateway C# tiene un cliente en `gateway-dotnet/.../Servicios/ClienteServicioIA.cs` que es un `HttpClient` configurado con la URL base del servicio IA. Hace POST a los endpoints como `/api/ia/transcribir`. Es comunicacion sincronica REST."

### ¿Por que separar IA del backend principal?
> "Tres razones: (1) tecnologica - todo lo de IA esta en Python, no podriamos usar Pyannote desde C#. (2) escalabilidad - el servicio IA es el mas pesado, podemos escalarlo independientemente. (3) trabajo en paralelo - yo trabajo en Python sin tocar C#, Jason en C# sin tocar Python."

### ¿Como manejan las peticiones largas?
> "Con cola asincrona. Si el audio es largo, el endpoint devuelve inmediatamente un ID de trabajo. El cliente puede consultar `/api/ia/trabajos/{id}` para ver el estado: pendiente, en_proceso, completado, error. Esto evita timeouts en el frontend."

---

## Preguntas tramposas / dificiles

### ¿Que pasa si el audio esta en ingles?
> "Whisper detecta el idioma automaticamente. Soporta mas de 90 idiomas. Si el audio es en ingles, transcribe en ingles. La nota clinica se generaria en ingles tambien si no le forzamos un idioma de salida al LLM. En nuestra configuracion forzamos espanol."

### ¿Que pasa si Llama alucina y se inventa un sintoma?
> "Tres capas de defensa: (1) RAG: le damos contexto real para anclar las respuestas. (2) Validacion del JSON. (3) Y la mas importante: el medico siempre revisa y aprueba la nota antes de generar el documento. La IA es asistente, no autonoma."

### ¿No es peligroso que un LLM escriba sobre salud?
> "Por eso el medico siempre tiene la ultima palabra. La IA propone, el medico dispone. Esta clarisimo en el flujo: nota generada -> revisada por el medico -> editada si hace falta -> aprobada -> recien ahi se genera el documento final."

### ¿Como protegen la privacidad del paciente?
> "Tenemos dos mecanismos: (1) opcion de usar Pyannote en local en vez de Deepgram para que el audio no salga. (2) Toda comunicacion va por HTTPS. (3) En produccion se podria sumar anonimizacion previa a enviar al LLM. Por ahora es un piloto academico, no produccion real."

### ¿Cuanto cuesta procesar una consulta?
> "Hoy, cero. Groq es gratis. Deepgram tiene tier gratis hasta 200 dolares de credito. Pyannote es open source. En produccion real, con APIs de pago como GPT-4 y AWS, costaria unos 0.05 a 0.10 dolares por consulta de 5 minutos."

---

## Frases comodin para salir del paso

Si te bloqueas, usa una de estas:

- "Eso esta documentado en el archivo `[archivo].py`. Si quieres lo abrimos."
- "Es una decision de disenio. Lo elegimos asi por [velocidad/simplicidad/coste]."
- "El equipo evaluo varias alternativas. Esta fue la que mejor balance ofrecio."
- "Tenemos pruebas que validan ese caso. Si quieres podemos correrlas."
- "Ese es un buen punto. En produccion lo manejariamos con [X]. Para el piloto basta con [Y]."

---

## Lo que NUNCA debes decir

| NO digas | Mejor di |
|---|---|
| "No se" | "No estoy 100% seguro, pero creo que..." |
| "Eso lo hizo otro del equipo" | "Esa parte la trabajo [X], deja que continue el" |
| "Es magia, simplemente funciona" | "Funciona porque [explica el modelo o tecnica]" |
| "Lo copie de internet" | "Nos basamos en la documentacion oficial de [X]" |
| "Llama 3.3 piensa" | "Llama 3.3 procesa el texto y genera una respuesta" |
