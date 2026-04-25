# Arquitectura del Frontend

## Tipo de arquitectura: SPA (Single Page Application) por componentes

El frontend es una **SPA** construida con React. Una sola pagina HTML (`index.html`) se carga una vez y luego React maneja todo el cambio de "paginas" sin recargar el navegador.

## Por que SPA con React

| Razon | Explicacion |
|---|---|
| **Velocidad** | Despues de la carga inicial, navegar entre pantallas es instantaneo. Solo se baja JSON, no HTML completo. |
| **Experiencia fluida** | No hay parpadeo entre paginas. La barra lateral, el header y el modo oscuro persisten. |
| **Reutilizacion** | Un componente como `<Modal />` se usa en 8 paginas distintas sin duplicar codigo. |
| **Comunidad y madurez** | React tiene 11 anos. Toneladas de librerias, herramientas y respuestas. |
| **Tipado con TypeScript** | TypeScript pilla errores antes de ejecutar. Reduce bugs en produccion. |

## Capas del frontend

```
┌─────────────────────────────────────────────────────┐
│  CAPA DE PAGINAS  (paginas/)                        │  <- Una por ruta
│  Combina componentes y maneja estado de la pagina   │
└─────────────────────┬───────────────────────────────┘
                      │ usa
                      v
┌─────────────────────────────────────────────────────┐
│  CAPA DE COMPONENTES (componentes/)                 │  <- Reutilizables
│  Modal, Cargando, Editor, layouts                   │
└─────────────────────┬───────────────────────────────┘
                      │ usa
                      v
┌─────────────────────────────────────────────────────┐
│  CAPA DE SERVICIOS (servicios/)                     │  <- Hablan con la API
│  fetch + JWT + manejo de errores                    │
└─────────────────────┬───────────────────────────────┘
                      │ usa
                      v
┌─────────────────────────────────────────────────────┐
│  CAPA DE UTILIDADES (utilidades/, tipos/)           │  <- Codigo puro
│  Validaciones, formateo, interfaces TypeScript      │
└─────────────────────────────────────────────────────┘

   ESTADO GLOBAL (contextos/) atraviesa todas las capas
```

## Decisiones tecnicas y por que

### 1. Vite en lugar de Create React App
Vite arranca en milisegundos y tiene Hot Module Replacement instantaneo. CRA esta deprecado desde 2023.

### 2. TypeScript en lugar de JavaScript puro
Tipado estatico. El compilador atrapa errores como `usuario.nombe` (typo) antes de ejecutar.

### 3. Tailwind CSS en lugar de CSS personalizado
Clases utilitarias (`bg-blue-500`, `p-4`) directamente en el JSX. Cero archivos CSS sueltos. Disenios consistentes.

### 4. Context API en lugar de Redux
La autenticacion es global pero simple. No necesitamos la complejidad de Redux. Un Context basta.

### 5. Three.js para 3D
La animacion de la esfera medica en el login no aporta funcionalidad pero **transmite que somos un producto moderno**. Pequeno detalle de marketing visual.

### 6. JWT en localStorage
Mas simple que cookies + CSRF. La aplicacion es B2B (clinicas), riesgo XSS controlado, no manejamos pagos.

## Flujo de proteccion de rutas

```
Usuario quiere ir a /pacientes
            │
            v
    <RutaProtegida>
            │
            ├── Hay JWT en localStorage? ──No──> /iniciar-sesion
            │   Si
            │   v
            ├── JWT vencido? ──Si──> /iniciar-sesion
            │   No
            │   v
            ├── Usuario tiene permiso "pacientes.ver"? ──No──> 403
            │   Si
            │   v
            v
        <PaginaPacientes />
```

Definido en `cliente-web/src/rutas/RutaProtegida.tsx`.

## Comunicacion con el backend

**Todas las llamadas pasan por `cliente-web/src/servicios/clienteApi.ts`**, que es un wrapper sobre `fetch` que:
- Agrega automaticamente el header `Authorization: Bearer <JWT>`
- Si recibe 401, redirige a login
- Si recibe 403, muestra "sin permiso"
- Si recibe 5xx, muestra "error de servidor, reintenta"
- Convierte errores de red en mensajes legibles

Asi cada servicio (`pacienteServicio.ts`, `consultaServicio.ts`) solo hace:
```typescript
import { clienteApi } from './clienteApi';
export const listarPacientes = () => clienteApi.get('/api/pacientes');
```

Sin repetir manejo de errores ni de tokens.
