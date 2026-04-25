# 01. Fundamentos que debes dominar

> Conceptos basicos en lenguaje simple. Si te preguntan "que es X", debes poder responder con tus propias palabras.

---

## 1. ¿Que es React?

React es una **libreria de JavaScript para construir interfaces de usuario** (frontend). Fue creada por Facebook (Meta).

**La idea central**: divides la interfaz en **componentes** reutilizables, cada uno con su HTML, CSS y JavaScript juntos. Cuando un dato cambia, React actualiza solo los componentes afectados, no toda la pagina.

**Ejemplo de componente**:
```tsx
function BotonGuardar({ texto, alClick }) {
  return <button onClick={alClick}>{texto}</button>;
}
```

**Por que React y no Angular o Vue**:
- Mas usado en la industria (mejor curva de empleabilidad).
- Comunidad gigante: hay solucion para todo.
- Curva de aprendizaje mas accesible.
- Estable: 11 anos en el mercado.

---

## 2. ¿Que es JSX/TSX?

JSX = **JavaScript XML**. Es una sintaxis que **mezcla HTML con JavaScript** dentro del mismo archivo. TSX es lo mismo pero con TypeScript.

```tsx
const nombre = "Juan";
return <h1>Hola, {nombre}</h1>;  // Esto es JSX/TSX
```

Internamente, React lo convierte en llamadas a funciones, pero escribirlo asi es mucho mas natural.

---

## 3. ¿Que es TypeScript?

TypeScript es **JavaScript con tipos estaticos**. Lo creo Microsoft.

**El problema con JavaScript**: es muy permisivo. Esto compila sin error:
```javascript
const usuario = { nombre: "Juan" };
console.log(usuario.nombe); // typo: "nombe" en lugar de "nombre"
// imprime undefined, error en runtime
```

**Con TypeScript**:
```typescript
interface Usuario { nombre: string }
const usuario: Usuario = { nombre: "Juan" };
console.log(usuario.nombe); // ERROR DE COMPILACION antes de ejecutar
```

**Ventajas**:
- Atrapas errores antes de ejecutar.
- Autocompletado mucho mejor en el editor.
- El codigo es autodocumentado.

---

## 4. ¿Que es una SPA?

**SPA** = Single Page Application = **Aplicacion de una sola pagina**.

**El problema clasico**: en webs antiguas, cada vez que haces click en un link, el navegador descarga una pagina HTML nueva, parpadea y pierdes el estado.

**La solucion SPA**: cargas UNA SOLA PAGINA HTML al inicio. Despues, JavaScript se encarga de cambiar el contenido y la URL sin recargar el navegador. Mucho mas fluido.

**Como funciona en React**: React Router escucha los cambios de URL y monta el componente apropiado.

---

## 5. ¿Que es Vite?

Vite es una **herramienta de build** (compilacion) para proyectos JavaScript modernos. Reemplaza a Webpack y Create React App.

**Ventajas de Vite**:
- Arranca en menos de 1 segundo.
- Hot Module Replacement instantaneo (cambias un archivo y el navegador se actualiza al instante).
- Genera bundles de produccion muy optimizados.
- Configuracion minima.

---

## 6. ¿Que es Tailwind CSS?

Tailwind es un **framework CSS basado en clases utilitarias**.

**El estilo tradicional**:
```css
.boton { background: blue; padding: 16px; border-radius: 8px; }
```
```html
<button class="boton">Guardar</button>
```

**Con Tailwind**:
```html
<button class="bg-blue-500 p-4 rounded-lg">Guardar</button>
```

**Ventaja**: cero archivos CSS. Las clases ya existen y son consistentes (todos los azules son el mismo `blue-500`, todos los paddings son multiplos de 4px).

**Desventaja**: el HTML se llena de clases. Pero la productividad gana.

---

## 7. ¿Que es JWT?

**JWT** = JSON Web Token. Token de autenticacion firmado digitalmente.

**Como lo usamos en el frontend**:
1. El usuario hace login: el backend devuelve un JWT.
2. Lo guardamos en `localStorage` con la clave `medscribe_sesion`.
3. En cada peticion siguiente, lo enviamos en el header `Authorization: Bearer <token>`.
4. Si recibimos 401 (no autorizado), redirigimos a login.

**Codigo en el cliente**: `cliente-web/src/servicios/clienteApi.ts` agrega el JWT automaticamente a todas las peticiones.

---

## 8. ¿Que es localStorage?

**`localStorage`** es una API del navegador para **guardar datos pequenos en el dispositivo del usuario**. Persisten incluso despues de cerrar el navegador (a diferencia de `sessionStorage` que se borra).

**Como lo usamos**:
```typescript
localStorage.setItem('medscribe_sesion', JSON.stringify({ token, usuario }));
const sesion = JSON.parse(localStorage.getItem('medscribe_sesion'));
```

**Limite**: ~5-10 MB por dominio. Mas que suficiente para JWT y datos del usuario.

---

## 9. ¿Que es React Router?

Es la **libreria oficial para manejar rutas** en una SPA con React.

**Como funciona**:
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Inicio />} />
    <Route path="/pacientes" element={<Pacientes />} />
    <Route path="/pacientes/:id" element={<DetallePaciente />} />
  </Routes>
</BrowserRouter>
```

Cuando el usuario navega, React Router monta el componente correspondiente sin recargar la pagina.

---

## 10. ¿Que es Context API?

Es la API nativa de React para **compartir estado entre componentes** sin pasar props manualmente por cada nivel.

**El problema**: si tu Header necesita saber el nombre del usuario logueado, y el Header esta 5 niveles debajo de App, tendrias que pasar la prop `usuario` por cada componente intermedio. Eso se llama "prop drilling" y es feo.

**La solucion**: defines un Context, lo provees en App, y cualquier componente lo lee directamente.

**En MedScribe**: tenemos `ContextoAutenticacion.tsx` que expone el usuario logueado, los permisos y las funciones de login/logout.

---

## 11. ¿Que es RBAC en frontend?

**RBAC** = Role-Based Access Control = control de acceso basado en roles.

**En el frontend**, lo aplicamos en dos niveles:
1. **Proteccion de rutas**: si no tienes permiso para una ruta, no se monta el componente.
2. **Renderizado condicional**: si no tienes permiso para crear pacientes, el boton "Nuevo Paciente" simplemente no aparece.

**Codigo tipico**:
```tsx
const { puede } = useContexto();
return (
  <div>
    {puede('pacientes', 'crear') && <button>Nuevo Paciente</button>}
  </div>
);
```

---

## 12. ¿Que es un componente reutilizable?

Es un componente disenado para usarse en multiples lugares con configuracion por props.

**Ejemplo**: el componente `<Modal>` se usa en 8 paginas distintas:
- Modal de confirmacion al eliminar.
- Modal de firma digital al aprobar documento.
- Modal de creacion rapida de paciente.
- Modal de error de procesamiento.
- ...etc.

Lo definimos UNA vez, lo usamos N veces. Cero duplicacion.

---

## 13. ¿Que es Three.js?

Three.js es una **libreria de graficos 3D para el navegador**. Lo usamos para la animacion de la esfera medica en la pantalla de login.

**Por que**: detalle de marketing visual. Cuando el profesor ve un sistema con animaciones 3D suaves, percibe que es un producto profesional, no un proyecto estudiantil.

**Donde esta**: `cliente-web/src/componentes/tres-dimensiones/EsferaMedica.tsx` y `ParticulasSigueCursor.tsx`.

---

## 14. ¿Que es Docker y Docker Compose?

**Docker** es una tecnologia que **empaqueta una aplicacion con todo lo que necesita** (sistema operativo, librerias, configuracion) en un contenedor que se ejecuta igual en cualquier maquina.

**Docker Compose** es una herramienta para **orquestar varios contenedores** que se relacionan entre si. Defines en un archivo YAML cuales contenedores levantar y como comunicarlos.

**En MedScribe**: nuestro `docker-compose.yml` levanta 6 contenedores con un solo comando:
- `cliente-web` (Frontend)
- `gateway` (Backend C#)
- `servicio-ia` (Python)
- `db` (SQL Server)
- `qdrant` (Base vectorial)
- `redis` (Cola)

Comando: `docker compose up --build`

---

## 15. ¿Que es nginx?

Nginx es un **servidor web** muy rapido. En produccion, lo usamos dentro del contenedor del frontend para servir el build optimizado.

**Por que no React directo**: React en desarrollo usa Vite con un servidor de desarrollo. Para produccion, Vite genera archivos HTML, CSS y JS estaticos, y los sirvemos con nginx, que es mucho mas rapido y maneja CORS, redirecciones, etc.

---

## 16. ¿Que es CORS?

**CORS** = Cross-Origin Resource Sharing. Mecanismo del navegador para **permitir o bloquear peticiones entre dominios distintos**.

**El problema**: el frontend corre en `localhost:3000` y el backend en `localhost:5000`. Sin CORS, el navegador bloquea las peticiones porque son de "origenes" distintos.

**La solucion**: el backend C# configura CORS en `Program.cs` permitiendo explicitamente al frontend.

---

## 17. ¿Que es una arquitectura de microservicios?

Es un estilo de arquitectura donde **el sistema se divide en servicios pequenos e independientes** que se comunican por la red (HTTP).

**MedScribe tiene 3 microservicios + 3 servicios de soporte**:
1. **Frontend** (React) - puerto 3000
2. **Gateway** (C# .NET) - puerto 5000
3. **Servicio IA** (Python) - puerto 8000
4. **SQL Server** - puerto 1434
5. **Qdrant** - puerto 6333
6. **Redis** - puerto 6379

**Ventajas**:
- Cada microservicio en el mejor lenguaje para su tarea.
- Equipo trabaja en paralelo sin pisarse.
- Si uno falla, los demas siguen funcionando.
- Se escala individualmente.

**Alternativa**: monolito (todo en un solo programa). Mas simple al inicio, pero limita lo demas.

---

## 18. ¿Que son las 4 capas?

Es una forma clasica de organizar una aplicacion:

1. **Capa de presentacion**: lo que el usuario ve. → Frontend React.
2. **Capa de negocio**: la logica de la aplicacion. → Gateway C#.
3. **Capa de inteligencia**: en MedScribe agregamos esto, separando la IA. → Servicio Python.
4. **Capa de datos**: persistencia. → SQL Server + Qdrant + Redis + sistema de archivos.

Cada capa NO conoce los detalles de la siguiente. Solo se comunican por interfaces (HTTP en nuestro caso).

---

## 19. Resumen en una tabla

| Concepto | Tecnologia | Para que | Donde |
|---|---|---|---|
| Lenguaje | TypeScript | Codigo del frontend | `src/**/*.tsx` |
| Libreria UI | React 19 | Componentes | `src/componentes/`, `src/paginas/` |
| Build tool | Vite | Compilar y servir | `vite.config.ts` |
| Estilos | Tailwind CSS | Diseno consistente | clases en cada componente |
| Rutas | React Router | Navegacion SPA | `src/App.tsx` |
| Estado global | Context API | Auth, permisos | `src/contextos/` |
| Auth | JWT + localStorage | Sesiones | `src/contextos/`, `src/servicios/` |
| HTTP client | fetch | Llamadas al backend | `src/servicios/clienteApi.ts` |
| 3D | Three.js | Animaciones visuales | `src/componentes/tres-dimensiones/` |
| Empaquetado | Docker | Despliegue | `Dockerfile`, `docker-compose.yml` |
| Servidor produccion | nginx | Servir build estatico | `nginx.conf` |
