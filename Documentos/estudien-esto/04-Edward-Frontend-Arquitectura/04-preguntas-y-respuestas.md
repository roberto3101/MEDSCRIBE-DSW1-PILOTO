# 04. Preguntas que te pueden hacer y como responder

---

## Preguntas sobre la arquitectura general (alta probabilidad)

### "¿Que arquitectura usaron?"
**Respuesta**: Usamos una arquitectura de microservicios en capas. Tenemos 4 capas funcionales: presentacion en React, negocio en C# .NET, inteligencia artificial en Python, y datos en SQL Server con apoyo de Qdrant y Redis. Cada capa esta empaquetada como un microservicio independiente en su propio contenedor Docker, y se comunican por HTTP REST.

### "¿Por que microservicios y no un monolito?"
**Respuesta**: Por cuatro razones. Primero, **cada lenguaje en su mejor caso de uso**: C# para el negocio, Python para la IA, React para la UI. Segundo, **trabajo paralelo del equipo** sin pisarse. Tercero, **escalabilidad selectiva**: si la IA se satura, escalamos solo ese servicio. Cuarto, **resiliencia**: si un microservicio cae, los demas siguen funcionando para operaciones que no lo necesitan.

### "¿Cuantos contenedores Docker tienen?"
**Respuesta**: Seis. Tres son nuestros codigos: el frontend React (cliente-web), el gateway C# (gateway), y el servicio Python (servicio-ia). Tres son servicios de infraestructura: SQL Server, Qdrant para la base vectorial, y Redis para cola y cache. Todos se levantan con un solo comando: `docker compose up --build`.

### "¿Como se comunican los microservicios?"
**Respuesta**: Por HTTP REST. El frontend solo habla con el gateway. El gateway se comunica con la base de datos via TCP usando ADO.NET, y con el servicio Python via HTTP. El servicio Python usa TCP para Qdrant y Redis, y HTTPS para llamar a las APIs externas (Groq, Deepgram, HuggingFace).

### "¿Por que Docker?"
**Respuesta**: Para evitar el clasico "en mi computadora si funciona". Docker empaqueta cada servicio con su sistema operativo, dependencias y configuracion, asi corre identico en cualquier maquina. Tambien nos permite levantar 6 servicios coordinados con un solo comando, lo que hace la demo super sencilla.

---

## Preguntas sobre el frontend

### "¿Por que React y no Angular o Vue?"
**Respuesta**: React es la libreria mas usada en la industria, lo que significa mejor curva de empleabilidad. Tiene la comunidad mas grande, asi hay solucion para cualquier problema. Su curva de aprendizaje es mas accesible que Angular. Y es estable: 11 anos en el mercado, mantenida por Meta.

### "¿Por que TypeScript y no JavaScript?"
**Respuesta**: TypeScript agrega tipado estatico a JavaScript. El compilador atrapa errores antes de ejecutar, como typos en nombres de variables o tipos incompatibles. Esto reduce bugs en produccion y hace que el codigo sea autodocumentado. El editor te da autocompletado de mucho mejor calidad.

### "¿Que es una SPA?"
**Respuesta**: Single Page Application, aplicacion de una sola pagina. En lugar de cargar HTML nuevo cada vez que el usuario navega, cargamos una sola pagina HTML al inicio y JavaScript se encarga de cambiar el contenido sin recargar. Es mucho mas fluido, sin parpadeos, y mantiene el estado entre vistas.

### "¿Por que Vite y no Create React App?"
**Respuesta**: Vite arranca en menos de un segundo, mientras Create React App tarda decenas de segundos. Vite tiene Hot Module Replacement instantaneo: cambias un archivo y el navegador se actualiza al momento. Y Create React App esta deprecado desde 2023, ya no recibe actualizaciones.

### "¿Por que Tailwind y no CSS tradicional o styled-components?"
**Respuesta**: Tailwind nos da consistencia visual sin esfuerzo. Todos los colores son los mismos, todos los espaciados son multiplos de 4 pixels, todos los radios de borde combinan. Y eliminamos archivos CSS sueltos: las clases viven directamente en los componentes JSX. Esto reduce bugs de estilos y acelera el desarrollo.

### "¿Como manejan el estado global?"
**Respuesta**: Usamos Context API de React, especificamente el ContextoAutenticacion. Expone el usuario logueado, los permisos RBAC, y funciones de login y logout. Cualquier componente puede leerlo sin necesidad de pasar props manualmente. No usamos Redux porque para nuestro caso es overengineering.

### "¿Como guardan la sesion del usuario?"
**Respuesta**: El JWT que devuelve el backend al hacer login lo guardamos en localStorage con la clave medscribe_sesion. Persiste incluso si el usuario cierra el navegador. En cada peticion, el clienteApi lo lee y lo envia automaticamente en el header Authorization. Si el JWT expira o el backend devuelve 401, redirigimos a login.

### "¿Es seguro guardar el JWT en localStorage?"
**Respuesta**: Es una compensacion. localStorage es vulnerable a XSS, las cookies son vulnerables a CSRF. Para nuestra aplicacion B2B (clinicas), el riesgo XSS es manejable: sanitizamos inputs, usamos React que escapa por defecto, y mantenemos JWTs con expiracion corta. Si fuera una aplicacion bancaria publica, usariamos cookies httpOnly + CSRF tokens.

### "¿Como protegen las rutas?"
**Respuesta**: Tenemos un componente RutaProtegida que envuelve todas las paginas privadas. Antes de renderizar, valida dos cosas: que haya un JWT valido en el contexto, y que el usuario tenga el permiso requerido. Si falta el JWT, redirige a login. Si falta el permiso, redirige a una pagina de "sin acceso".

### "¿Tienen control de acceso por roles?"
**Respuesta**: Si, RBAC granular. Los permisos del usuario llegan en el JWT como una matriz JSON: para cada modulo (pacientes, consultas, etc.) hay 4 acciones (ver, crear, editar, eliminar). El contexto expone una funcion puede(modulo, accion) que cualquier componente usa para mostrar u ocultar botones. Por ejemplo, si no tienes pacientes.crear, no aparece el boton de "Nuevo Paciente".

### "¿Como hacen la grabacion de audio?"
**Respuesta**: Usamos la API MediaRecorder del navegador. El usuario da permiso al microfono, grabamos en formato webm, y mandamos el archivo via multipart/form-data al backend. El backend lo retransmite al servicio Python que lo procesa con Whisper.

### "¿Por que las animaciones 3D?"
**Respuesta**: Por percepcion de calidad. Las animaciones suaves con Three.js transmiten al usuario que esta usando un producto moderno y profesional. Es un detalle pequeno pero diferenciador. La esfera 3D en el login y las particulas que siguen el cursor le dan vida a la interfaz sin afectar el rendimiento.

### "¿Como hacen el responsive?"
**Respuesta**: Con Tailwind, que tiene clases prefijadas para cada breakpoint: sm (640px), md (768px), lg (1024px), xl (1280px). Por defecto disenamos mobile-first, y agregamos las clases con prefijo para pantallas mas grandes. Por ejemplo: `text-sm md:text-base lg:text-lg` significa "pequeno en movil, normal en tablet, grande en escritorio".

---

## Preguntas sobre seguridad

### "¿Como evitan XSS en el frontend?"
**Respuesta**: React escapa automaticamente cualquier valor que se renderiza con llaves `{}`. Para que un script malicioso se ejecute, alguien tendria que usar `dangerouslySetInnerHTML`, que evitamos. Adicionalmente, sanitizamos los inputs en el backend.

### "¿Y CSRF?"
**Respuesta**: No usamos cookies para autenticacion (usamos localStorage + Authorization header), por lo que no estamos expuestos al ataque CSRF clasico. Si en el futuro pasamos a cookies, agregariamos tokens CSRF.

---

## Preguntas dificiles ("trampa")

### "¿Que pasa si el backend C# se cae?"
**Respuesta**: El frontend muestra un mensaje claro de "Servicio no disponible, reintenta". El clienteApi atrapa errores de red y los traduce a mensajes legibles. Las paginas que estan ya cargadas con datos en memoria siguen siendo navegables, pero al intentar cualquier accion que vaya al backend, el usuario recibe el error.

### "¿Por que React 19 y no la version anterior?"
**Respuesta**: React 19 es la version actual. Trae mejoras de rendimiento, mejor manejo de Server Components (aunque no los usamos), y deprecaciones que limpian APIs viejas. Usar versiones viejas implicaria perder estas mejoras y eventualmente quedarse sin soporte.

### "¿Como hacen tests del frontend?"
**Respuesta**: Para este proyecto academico no implementamos tests automatizados, hacemos pruebas manuales sistematicas. Para produccion real, recomendariamos Vitest para tests unitarios, React Testing Library para tests de componentes, y Playwright para tests end-to-end.

### "¿Y el SEO?"
**Respuesta**: MedScribe es una aplicacion privada que requiere login, no necesitamos SEO. Por eso una SPA es perfecta. Si necesitaramos SEO, usariamos Next.js con server-side rendering.

### "¿Que tan grande es el bundle del frontend?"
**Respuesta**: Aproximadamente 400 KB despues del build, con code splitting por ruta. Vite optimiza muy bien: minifica, hace tree shaking, comprime con gzip. La carga inicial es menos de 2 segundos en una conexion normal.

---

## Si te quedas en blanco

**Frase magica**:
> "Buena pregunta. Esa logica especifica esta en [archivo X]. La idea general es [concepto]. Si quiere podemos abrirlo."

---

## Lo que NO debes decir

❌ "JavaScript" en lugar de "TypeScript".

❌ "Bootstrap" — usamos Tailwind, no Bootstrap.

❌ "Redux" — usamos Context API.

❌ "Webpack" — usamos Vite.

❌ "Apache" — usamos nginx.

❌ "Single Page" en lugar de "Single Page Application" (la sigla SPA es importante).
