# 05. Guion de la presentacion (mapeado al HTML)

> Tu parte: **4:30 minutos** repartidos en 3 secciones del HTML. Cierras la parte tecnica e incluye **DEMO EN VIVO** del pipeline.

---

## CONTEXTO IMPORTANTE

- Estas presentando con **el HTML abierto**.
- Cuando Luis termina la seccion 11 (Estados), avanza con `→` y entras tu en la seccion 12.
- El indicador inferior derecho cambiara a tu avatar amarillo/ambar.
- Tu turno empieza en el minuto **15:00** y termina en el **19:30**.
- **Despues de ti, alguien (puede ser Edward) avanza a la seccion 15 (Equipo) para el cierre conjunto.**

---

## SECCION 12 — CREAR CONSULTA DESDE AUDIO (2:30)

**En pantalla**: Seccion 12 "Crear consulta desde audio" con el diagrama de secuencia

**Lo que dices** (PRIMERA PARTE — explicacion, ~1:00):
> "Buenas tardes profesor. Mi nombre es Jose Roberto La Rosa Ledezma, codigo i202333980. Yo soy el coordinador del equipo y me encargue del **servicio de inteligencia artificial en Python**, que es el cerebro del sistema.
> 
> Aqui esta el diagrama de secuencia del flujo principal. Cuando el medico graba un audio, mi servicio recibe el archivo, lo manda a **Whisper para transcribirlo**, despues a un **diarizador** que identifica quien dijo cada cosa, despues al **LLM Llama 3.3** para que genere la nota estructurada en formato SOAP, y finalmente devuelve archivos PDF y Word listos para descargar."

**Lo que haces** (SEGUNDA PARTE — DEMO EN VIVO, ~1:30):
1. **Cambia al navegador con `localhost:3000`** (Edward ya lo dejo abierto).
2. Si no estas logueado, login rapido (tienes credenciales memorizadas).
3. Click en **"Nueva Consulta"**.
4. Selecciona un paciente.
5. Selecciona la plantilla SOAP.
6. **Sube un audio de prueba listo en el escritorio** O **graba 30 segundos en vivo** (mejor opcion: grabas algo como "Buenos dias doctora, llevo tres dias con dolor de cabeza pulsatil del lado derecho, tambien tengo nauseas").
7. Click en **"Procesar"**.

**Mientras procesa (mas o menos 15 segundos), narras**:
> "Ahora el audio esta viajando al gateway, que lo retransmite a mi servicio Python. En este momento Whisper esta transcribiendo en menos de un segundo. Despues el diarizador identifica los oradores. Y ahora **Llama 3.3 esta generando la nota estructurada**, usando RAG con Qdrant para tener contexto medico relevante."

8. Cuando aparezca la nota: muestra cada seccion SOAP rellenada.
9. **Vuelve al HTML** y avanza con `→`.

> "Como vieron, en menos de 30 segundos transformamos un audio en una nota clinica completa."

→ **Avanza con `→`**

---

## SECCION 13 — PIPELINE DE INTELIGENCIA ARTIFICIAL (1:00)

**En pantalla**: Seccion 13 "Pipeline de IA" con el diagrama de actividades

**Lo que dices**:
> "Este es el pipeline interno completo del servicio. Tiene seis pasos automaticos que acabamos de ver en accion:
> 
> Primero, validacion del audio. Segundo, **Whisper** transcribe a texto. Tercero, **Pyannote o Deepgram** identifica oradores. Cuarto, un **clasificador de intenciones** detecta el tipo de consulta. Quinto, **RAG con Qdrant** busca plantillas y guias clinicas relevantes. Y sexto, **Llama 3.3 con 70 mil millones de parametros** genera la nota estructurada en JSON.
> 
> Tambien implemente patrones de resiliencia: **circuit breaker** para no saturar el LLM cuando falla, **cola asincrona** con Redis para audios largos, e **idempotencia** para no procesar dos veces la misma peticion."

→ **Avanza con `→`**

---

## SECCION 14 — STACK TECNOLOGICO COMPLETO (1:00)

**En pantalla**: Seccion 14 "Stack tecnologico completo" con la tabla

**Lo que dices**:
> "Esta es la vista global del stack que usamos. En el **frontend**, React 19 con TypeScript, Vite y Tailwind. En el **backend de negocio**, C# .NET 9 con ADO.NET y JWT. En mi **servicio de IA**, Python 3.12 con FastAPI, Whisper, Pyannote, Llama 3.3 y Qdrant. En la **capa de datos**, SQL Server con stored procedures, mas Redis para cola y Qdrant para busqueda vectorial. Y todo empaquetado con Docker.
> 
> Cada tecnologia esta en lo que mejor hace. Esa es la razon por la que elegimos microservicios y no un monolito.
> 
> Hasta aqui la parte tecnica. **Para cerrar**, vamos al equipo."

→ **Avanza con `→`** (pasa a la seccion 15 que es el cierre conjunto)

---

## SECCION 15 — EQUIPO (cierre conjunto, 0:30)

**En pantalla**: Seccion 15 "Equipo de desarrollo"

**Cualquiera de los 4 puede decir** (sugerido: Edward, ya que abrio):
> "Estos somos los cuatro integrantes que construimos MedScribe. Roberto en el servicio de IA, Jason en el backend C#, Luis en la base de datos, y yo en el frontend y la arquitectura.
> 
> Profesor, con eso terminamos nuestra exposicion. Estamos atentos a sus preguntas. Muchas gracias."

---

## TIEMPO TOTAL DE ROBERTO: 4:30
## TIEMPO TOTAL DE LA PRESENTACION: 20:00 EXACTOS

---

## ANTES DE EMPEZAR — Lista de verificacion

- [ ] Luis esta presentando — espera tu turno
- [ ] **Audio de prueba listo en el escritorio** (`audio_prueba.wav` o similar) por si la grabacion en vivo falla
- [ ] **Sistema completo arriba** y verificado en `localhost:3000`
- [ ] Estas logueado o tienes credenciales memorizadas
- [ ] Ya creaste un paciente de prueba antes (asi no pierdes 30s creandolo en vivo)
- [ ] El microfono del laptop funciona
- [ ] El audio del laptop sale por parlantes (para que se escuche tu grabacion)

---

## SI LA DEMO FALLA (PLAN B)

**Si Whisper o Llama no responden** (muy probable porque dependen de internet):
> "Como pueden ver, en este momento el servicio externo de Groq esta tardando mas de lo normal, lo cual es exactamente para lo que implemente el **circuit breaker**. En produccion, despues de varios fallos, el sistema cierra el circuito durante 60 segundos y devuelve mensajes claros al usuario en lugar de hacerlo esperar."

Despues, **muestra capturas de pantalla** de la nota generada que tendras como respaldo.

**Si todo el sistema esta caido**:
> "Por temas tecnicos del aula no podemos hacer la demo en vivo. Tenemos un video de respaldo de 90 segundos que muestra el flujo completo."

Reproduce el video.

---

## SI TE INTERRUMPEN CON UNA PREGUNTA

**Si la pregunta es facil**: respondes en 2 frases y sigues.

**Si no sabes la respuesta**:
> "Buena pregunta. La logica especifica esta en el archivo [X] dentro de `servicio-ia/app/servicios/`. La idea general es [concepto]. Si quiere podemos abrir el codigo despues."

---

## TIPS PARA LA DEMO EN VIVO

- **Antes de la presentacion, ensaya la demo al menos 5 veces.**
- **Graba un audio limpio.** No murmures. Habla claro y proyecta la voz.
- **Mientras procesa, NO te quedes en silencio.** Narra lo que esta pasando para que el profe sepa donde mirar.
- **Si algo se ve raro en la nota generada**, dilo: "como ven, la IA hizo un excelente trabajo capturando los sintomas, aunque pudo confundir un termino, lo cual es normal y por eso siempre se muestra al medico para revisar antes de aprobar."

---

## LO QUE DEBE QUEDAR CLARO DESPUES DE TUS 4:30

1. **El cerebro del sistema esta en mi servicio Python**.
2. **Pipeline de 6 pasos**: Validacion → Whisper → Diarizacion → Clasificacion → RAG → LLM.
3. **Llama 3.3 con 70B parametros** genera notas SOAP.
4. **Resiliencia**: circuit breaker, cola asincrona, idempotencia.
5. **La demo funcionó**: en menos de 30 segundos, audio → nota clinica.

---

## RECUERDA

**Tu cierras la parte tecnica.** Lo que tu logres demostrar visualmente con el pipeline en vivo es lo que el profe se llevara a casa. Hazlo con calma, con confianza y con una sonrisa cuando aparezca la nota generada.
