# 02. Recorrido del codigo del frontend

> Cada archivo y carpeta del frontend explicada. Si el profe te pide "muestrame X", aqui esta la respuesta.

---

## Configuracion del proyecto

### `package.json`
Lista de dependencias y scripts npm.

**Dependencias clave que debes mencionar**:
- `react`, `react-dom`: la libreria principal.
- `react-router-dom`: para las rutas SPA.
- `typescript`: tipado estatico.
- `vite`: build tool.
- `tailwindcss`: estilos.
- `three`, `@react-three/fiber`: animaciones 3D.

**Scripts**:
- `npm run dev`: arranca el servidor de desarrollo en `localhost:3000`.
- `npm run build`: genera el bundle optimizado en `dist/`.

### `vite.config.ts`
Configuracion del bundler. Define el puerto, alias de imports, plugins (React, TypeScript).

### `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
Configuracion de TypeScript: que sintaxis aceptar, donde buscar tipos, que carpetas compilar.

### `nginx.conf`
Configuracion del nginx que sirve el build en produccion. Maneja:
- Servir archivos estaticos.
- Fallback a `index.html` para rutas SPA.
- Cache headers.

### `Dockerfile`
Receta para empaquetar el frontend. Tiene 2 etapas:
1. **Build**: usa Node.js para compilar el codigo (`npm run build`).
2. **Servir**: copia el `dist/` resultante a un nginx liviano.

### `index.html`
HTML raiz que carga `main.tsx`. Tiene un `<div id="root">` donde React monta toda la app.

---

## `src/main.tsx`
**Punto de entrada del frontend**. Lo que ejecuta el navegador primero.

**Que hace**:
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Monta el componente `<App />` en el div `#root` del HTML.

---

## `src/App.tsx` ⭐ ARCHIVO CLAVE
**Define todas las rutas de la aplicacion**.

**Estructura**:
```tsx
<BrowserRouter>
  <ProveedorAutenticacion>
    <Routes>
      {/* Rutas publicas */}
      <Route path="/iniciar-sesion" element={<PaginaInicioSesion />} />
      <Route path="/registrar-clinica" element={<PaginaRegistroClinica />} />
      
      {/* Rutas protegidas */}
      <Route path="/panel" element={<RutaProtegida><PaginaPanel /></RutaProtegida>} />
      <Route path="/pacientes" element={<RutaProtegida><PaginaPacientes /></RutaProtegida>} />
      {/* ...etc */}
    </Routes>
  </ProveedorAutenticacion>
</BrowserRouter>
```

**Lo que vale la pena destacar**:
- `<ProveedorAutenticacion>` envuelve todo: el contexto de auth disponible en cualquier ruta.
- `<RutaProtegida>` es un wrapper que valida el JWT antes de mostrar la pagina.

---

## `src/index.css`
Estilos globales. Aqui esta:
- Las directivas Tailwind (`@tailwind base; @tailwind components; @tailwind utilities;`).
- Estilos custom muy puntuales que no se pueden hacer con clases Tailwind.

---

## `src/componentes/` — Componentes reutilizables

### `componentes/comunes/`

#### `Modal.tsx`
Componente generico de modal con overlay oscuro, boton X, ESC para cerrar. Se usa en todas las paginas que necesitan dialogos.

#### `ModalFirmaDigital.tsx`
Modal especifico para firmar documentos (con captura de firma manual).

#### `Cargando.tsx`
Spinner de carga reutilizable. Lo usamos mientras esperan respuestas del backend.

#### `EditorNotaClinicaEstructurada.tsx`
Editor visual de notas clinicas. Permite al medico ver las secciones SOAP, editarlas y aprobarlas.

### `componentes/plantilla/`

#### `PlantillaPublico.tsx`
Layout para paginas SIN login (login, registro). Tiene fondo con animacion 3D y sin menu lateral.

#### `PlantillaAutenticado.tsx`
Layout para paginas CON login. Tiene:
- Menu lateral con navegacion.
- Header con nombre del usuario y boton logout.
- Footer.

### `componentes/tres-dimensiones/`

#### `EsferaMedica.tsx`
Componente Three.js que renderiza una esfera 3D animada que reacciona al cursor. Se usa en la pantalla de login para dar sensacion de modernidad.

#### `ParticulasSigueCursor.tsx`
Particulas pequenas que siguen el movimiento del cursor. Detalle visual extra.

---

## `src/contextos/`

### `ContextoAutenticacion.tsx` ⭐ ARCHIVO CLAVE
**El estado global de autenticacion**.

**Lo que expone**:
```tsx
{
  usuario,           // datos del usuario logueado o null
  permisos,          // matriz RBAC
  iniciarSesion,     // funcion async (correo, contrasena) => bool
  cerrarSesion,      // funcion () => void
  puede,             // funcion (modulo, accion) => bool
  estaAutenticado,   // bool computado
}
```

**Como funciona**:
1. Al cargar la app, lee `localStorage.medscribe_sesion`.
2. Si hay sesion valida, expone los datos del usuario.
3. Si no hay sesion o expiro, expone `usuario = null`.
4. `puede('pacientes', 'crear')` chequea contra el JSON de permisos.

---

## `src/rutas/RutaProtegida.tsx`
**Wrapper que envuelve las paginas privadas**.

**Logica**:
```tsx
function RutaProtegida({ children, permisoRequerido }) {
  const { estaAutenticado, puede } = useContexto();
  
  if (!estaAutenticado) return <Navigate to="/iniciar-sesion" />;
  if (permisoRequerido && !puede(...)) return <Navigate to="/sin-permiso" />;
  return children;
}
```

---

## `src/paginas/` — Las 12 paginas

### `paginas/inicio-sesion/`

#### `PaginaInicioSesion.tsx`
Pagina de login. Combina el `<FormularioLogin>` con la `EsferaMedica` 3D de fondo.

#### `FormularioLogin.tsx`
El formulario en si: campos de correo y contrasena, validacion en tiempo real, boton submit que llama a `iniciarSesion()`.

### `paginas/registro-clinica/`

#### `PaginaRegistroClinica.tsx`
Onboarding. Wizard de varios pasos:
1. Datos de la clinica (nombre, RUC, direccion).
2. Datos del admin (correo, contrasena, nombre).
3. Plan a contratar (BASICO, PRO, ENTERPRISE).
4. Confirmacion.

### `paginas/panel/`

#### `PaginaPanel.tsx`
Dashboard inicial. Muestra:
- Estadisticas: consultas hoy, pacientes activos, documentos pendientes.
- Accesos rapidos.
- Ultimas consultas.

### `paginas/pacientes/`

#### `PaginaPacientes.tsx`
CRUD de pacientes:
- Lista paginada con filtro por DNI o nombre.
- Boton "Nuevo Paciente" abre modal.
- Cada fila tiene editar y eliminar.

### `paginas/nueva-consulta/`

#### `PaginaNuevaConsulta.tsx` ⭐ LA PAGINA ESTRELLA
La pagina mas importante para tu demo.

**Flujo**:
1. Selecciona paciente.
2. Selecciona plantilla (SOAP, Receta, etc.).
3. Graba audio con boton de microfono O sube archivo.
4. Click en "Procesar".
5. Loading state mientras la IA procesa.
6. Aparece la nota generada en el `<EditorNotaClinicaEstructurada>`.
7. Edita si quiere.
8. Guarda y descarga PDF/Word.

### `paginas/consultas/`

#### `PaginaConsultas.tsx`
Listado de consultas con filtros.

#### `PaginaDetalleConsulta.tsx`
Vista de una consulta especifica con sus secciones, documentos y auditoria.

### `paginas/documentos/`

#### `PaginaDocumentos.tsx`
Lista todos los PDFs y Words generados con su estado (PENDIENTE, APROBADO, RECHAZADO).

### `paginas/configuracion-documentos/`

#### `PaginaConfiguracionDocumentos.tsx`
Configuracion de plantillas: subir logo, elegir colores, definir secciones.

### `paginas/usuarios-clinica/`

#### `PaginaUsuariosClinica.tsx`
Gestion de usuarios (solo admin): listar, crear, editar, desactivar.

### `paginas/roles/`

#### `PaginaRoles.tsx`
Gestion de roles personalizados con matriz visual de permisos. Cada modulo tiene 4 checkboxes (ver, crear, editar, eliminar).

### `paginas/perfil/`

#### `PaginaPerfil.tsx`
El usuario actualiza sus datos y cambia su contrasena.

---

## `src/servicios/` — Clientes HTTP

### `clienteApi.ts` ⭐ ARCHIVO CLAVE
**Wrapper sobre `fetch`** que centraliza:
- URL base del backend.
- Header `Authorization: Bearer <jwt>` automatico.
- Manejo de 401 (redirect a login).
- Manejo de 403 (mensaje sin permiso).
- Manejo de 5xx (mensaje de error).
- Conversion de errores de red.

**Asi cada servicio especifico es muy simple**:
```typescript
import { clienteApi } from './clienteApi';
export const listarPacientes = () => clienteApi.get('/api/pacientes');
```

### `autenticacionServicio.ts`
Funciones para login, logout y registro.

### `pacienteServicio.ts`
CRUD de pacientes.

### `consultaServicio.ts`
CRUD de consultas + creacion con audio.

### `documentoServicio.ts`
Listar/descargar/aprobar documentos.

---

## `src/tipos/` — Interfaces TypeScript

### `usuario.ts`, `paciente.ts`, `consulta.ts`, `documento.ts`
Interfaces que reflejan los DTOs del backend. Por ejemplo:

```typescript
export interface Paciente {
  idPaciente: number;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono?: string;
  correoElectronico?: string;
}
```

Esto da autocompletado y atrapa errores cuando el backend cambia algo.

---

## `src/utilidades/`

### `constantes.ts`
URLs base, claves de localStorage, configuraciones.

### `formatearFecha.ts`
Formatea fechas en es-PE (ejemplo: "25/04/2026" o "25 de abril de 2026").

### `geolocalizacion.ts`
Obtiene la geolocalizacion del usuario para registrar en auditoria.

### `validaciones.ts`
Funciones puras: `validarDNI(dni)`, `validarCorreo(correo)`, `validarContrasena(pwd)`.

---

## Carpeta `dist/`
Es el **build de produccion** generado por `npm run build`. NO la edites. Es lo que nginx sirve.

## Carpeta `node_modules/`
Las dependencias instaladas. NO la versionamos en Git (esta en `.gitignore`).

## Carpeta `public/`
Recursos estaticos servidos sin procesar (favicon, imagenes).
