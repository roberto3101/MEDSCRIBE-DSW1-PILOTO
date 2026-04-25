# Guia de estudio - Roberto La Rosa (Servicio IA Python)

> Lee los archivos en este orden. Cada uno toma 10-15 minutos.

## Tu tema

**Servicio de Inteligencia Artificial en Python con FastAPI.** Eres responsable de explicar el "cerebro" del sistema: como un audio se transforma en una nota clinica estructurada en PDF y Word.

## Tu tiempo de exposicion

Aproximadamente **5 minutos** dentro de los 20 totales del equipo. Hablas despues de Luis (base de datos) y antes del cierre.

## Orden de lectura

1. `01-fundamentos.md` - **Conceptos** que debes dominar (FastAPI, Whisper, LLM, RAG, etc.)
2. `02-recorrido-codigo.md` - **Tour por el codigo**: que hace cada archivo, donde mirarlo
3. `03-pipeline-paso-a-paso.md` - **El flujo completo** de un audio hasta el PDF, con codigo
4. `04-preguntas-y-respuestas.md` - **Posibles preguntas** del profesor con respuestas listas
5. `05-guion-presentacion.md` - **Guion** minuto a minuto de tu intervencion

## Tu zona del codigo

Toda la carpeta `servicio-ia/`. Si te preguntan "donde esta esto en el codigo", apunta ahi.

## Tu mensaje principal

> "El servicio IA convierte un audio crudo en una nota clinica estructurada en menos de 30 segundos, usando Whisper para transcribir, Pyannote o Deepgram para identificar quien habla, Llama 3.3 para entender medicina y RAG con Qdrant para mantener el contexto clinico."

Si cierras los ojos y dices ESTO, ya tienes la idea principal. El resto es desarrollo.

## Lo que NO debes hacer

- No te metas en detalles de C# (eso es de Jason)
- No expliques las tablas de la BD (eso es de Luis)
- No te enfoques en CSS o React (eso es de Edward)
- No leas codigo en pantalla durante la exposicion. Senala el archivo y explica que hace.

## Lo que el profesor querra ver

1. Que sepas que pasa en cada paso del pipeline
2. Que conozcas la diferencia entre **transcripcion** (audio a texto) y **diarizacion** (separar oradores)
3. Que entiendas que es un **LLM** y que **NO es magia**
4. Que sepas explicar por que usamos **RAG** y no entrenamos un modelo
5. Que puedas mostrar un endpoint funcionando (Swagger en `/docs`)
