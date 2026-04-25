# 05. Guion de la presentacion (mapeado al HTML)

> Tu parte: **6 minutos** repartidos en 6 secciones del HTML, **1 minuto cada una**. Tu abres la presentacion y haces la introduccion completa.

---

## CONTEXTO IMPORTANTE

- Estas presentando con **el HTML abierto** (`Documentos/Web/informe-medscribe.html`).
- Antes de empezar: abres el HTML, activas **modo presentacion** (boton arriba derecha), te aseguras que estes en la primera seccion (Resumen).
- Los **avances de seccion** se hacen con la tecla `→` (flecha derecha).
- El indicador inferior derecho mostrara tu nombre automaticamente porque las primeras 6 secciones estan asignadas a ti.

---

## SECCION 1 — RESUMEN (1:00)

**En pantalla**: Seccion 1 "Resumen del proyecto"

**Lo que dices**:
> "Buenas tardes profesor Valdivia. Somos el equipo de **MedScribe AI**.
> 
> Mi nombre es Edward Alexander Escobedo Murga, codigo i201917851. Junto a mi exponen Jason Davila que se encargo del backend en C#, Luis Curi de la base de datos, y Roberto La Rosa del servicio de inteligencia artificial.
> 
> MedScribe es una **aplicacion web que automatiza la creacion de notas clinicas**. El medico graba la consulta con su voz, el sistema escucha el audio, lo convierte en texto, identifica quien hablo, y genera una nota clinica estructurada lista para imprimir como PDF o Word."

→ **Avanza con `→`**

---

## SECCION 2 — PROBLEMA (1:00)

**En pantalla**: Seccion 2 "El problema que resolvemos" con la cita resaltada

**Lo que dices**:
> "Quiero contextualizar el problema. En el Peru, los medicos pasan **entre el 35 y el 50 por ciento de su jornada escribiendo notas** en lugar de mirar al paciente.
> 
> Como pueden ver aqui en la cita del INEI, el **63 por ciento** de los pacientes considera que su medico le dedica menos de 10 minutos por consulta, y la mayor parte de ese tiempo lo pasa frente a la computadora.
> 
> Nuestra propuesta es simple: **si la maquina escribe por el medico, el medico recupera tiempo para escuchar al paciente**."

→ **Avanza con `→`**

---

## SECCION 3 — OBJETIVOS (1:00)

**En pantalla**: Seccion 3 "Objetivos SMART" con las 4 cajas

**Lo que dices**:
> "Definimos cuatro objetivos siguiendo el criterio SMART, especificos, medibles, alcanzables, relevantes y a tiempo.
> 
> El **objetivo general** es reducir en al menos un 60% el tiempo que un medico dedica a escribir notas, dentro del ciclo 2026-1.
> 
> Para lograrlo, nos planteamos tres objetivos especificos: que el pipeline de IA transcriba audios en menos de 30 segundos, que se generen documentos en PDF y Word automaticamente, y que el sistema tenga control de acceso por roles con permisos granulares."

→ **Avanza con `→`**

---

## SECCION 4 — ARQUITECTURA GENERAL (1:00)

**En pantalla**: Seccion 4 con el diagrama de arquitectura

**Lo que dices**:
> "Para construir esto disenamos una **arquitectura de microservicios en cuatro capas**, como ven en el diagrama.
> 
> La **capa de presentacion** es nuestro frontend en React. La **capa de negocio** es el gateway en C# .NET 9. La **capa de inteligencia artificial** es un microservicio en Python. Y la **capa de datos** usa SQL Server, mas Qdrant para busqueda vectorial y Redis para colas.
> 
> Elegimos microservicios por una razon clave: **cada lenguaje brilla en algo distinto**. C# para el negocio, Python para la IA, React para la UI. Esto nos permitio trabajar los cuatro en paralelo sin pisarnos."

→ **Avanza con `→`**

---

## SECCION 5 — COMPONENTES DEL SISTEMA (1:00)

**En pantalla**: Seccion 5 con el diagrama de componentes

**Lo que dices**:
> "Esta es la vista interna de cada capa. Pueden ver como se conectan los modulos.
> 
> Mi parte concreta fue **construir el frontend completo en React 19 con TypeScript**. Implementé 12 paginas, dos publicas y diez protegidas detras de autenticacion. Use Tailwind para los estilos, React Router para las rutas, y Context API para manejar el estado global de la sesion del usuario.
> 
> Tambien implemente proteccion de rutas y control granular por roles: si un usuario no tiene un permiso especifico, el boton ni siquiera aparece en la interfaz."

→ **Avanza con `→`**

---

## SECCION 6 — DESPLIEGUE CON DOCKER (1:00)

**En pantalla**: Seccion 6 "Despliegue con Docker" + diagrama

**Lo que dices**:
> "El despliegue completo se hace con **Docker Compose**. Tenemos seis contenedores: el frontend, el gateway, el servicio de IA, SQL Server, Qdrant y Redis.
> 
> Para levantar todo el sistema desde cero, basta con **tres comandos** que ven en pantalla: clonar el repositorio, configurar la API key, y ejecutar `docker compose up`. Cualquier persona puede levantar MedScribe en su maquina sin instalar nada mas que Docker.
> 
> Hasta aqui mi parte de arquitectura general y frontend. **Mi compañero Jason les va a explicar a continuacion como funciona el backend en C# que esta detras de la interfaz que acabo de mostrar**."

→ **Avanza con `→`** (esto pasa a la seccion 7 que ya es de Jason — el indicador automaticamente cambiara al avatar de Jason)

---

## TIEMPO TOTAL: 6:00

---

## ANTES DE EMPEZAR — Lista de verificacion

- [ ] HTML abierto en `Documentos/Web/informe-medscribe.html`
- [ ] **Modo presentacion ACTIVADO** (boton arriba)
- [ ] Posicionado en seccion 1 (Resumen) — scroll arriba
- [ ] Sistema completo arriba (`docker compose up`)
- [ ] Browser separado abierto en `localhost:3000` listo para la demo (no la haras tu pero esta lista)
- [ ] Conexion a internet verificada (para Groq)
- [ ] Cable HDMI conectado, pantalla espejada
- [ ] Audio del laptop sale por parlantes
- [ ] Tienes agua a mano

---

## SI LA DEMO FALLA DESPUES (durante el turno de otro)

Tu eres el coordinador. Si algo se rompe en vivo:

**Frase de cobertura mientras se arregla**:
> "Como pueden ver, en sistemas distribuidos a veces algo no responde inmediatamente. Implementamos manejo de errores que muestra mensajes claros al usuario. Mientras se restablece, dejenme aprovechar para mostrar este otro aspecto del sistema..."

Pasa a una seccion del HTML que no requiera demo en vivo.

---

## TIPS

- **Habla mas lento de lo que crees.** El nervio te acelera.
- **Mira a los ojos del profe** durante las explicaciones, mira a la pantalla cuando muestras un diagrama.
- **No leas literal este guion**. Aprendete las ideas y dilas con tus palabras.
- **El indicador inferior derecho te dice cuando es tu turno**. No tienes que hacer transiciones explicitas como "ahora paso a Jason" — solo presionas `→` y el indicador cambia automaticamente, pero igual lo dices al final de tu seccion 6 para que sea natural.

---

## RECUERDA: tu eres la cara del equipo

El profesor te recordara mas porque abriste la presentacion. Lo que debe quedar clarisimo despues de tus 6 minutos:

1. **Cual es el problema** (consultas que pierden tiempo en escribir).
2. **Cual es la solucion en una frase** (audio → nota clinica automatica).
3. **Como esta organizado el sistema** (4 capas, microservicios, Docker).
4. **Que es el frontend que vamos a ver** (React, 12 paginas, RBAC).

Si transmites confianza en estos 4 puntos, los demas solo profundizan tecnicamente y todos salen bien parados.
