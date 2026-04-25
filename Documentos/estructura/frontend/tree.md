# Arbol del Frontend (cliente-web)

> Frontend en React 19 + TypeScript + Vite + Tailwind CSS.

```
cliente-web/
├── Dockerfile                      # Empaquetado para produccion (nginx + build)
├── nginx.conf                      # Configuracion del nginx que sirve el build
├── package.json                    # Dependencias y scripts npm
├── package-lock.json               # Versiones exactas
├── vite.config.ts                  # Configuracion del bundler Vite
├── tsconfig.json                   # Configuracion principal de TypeScript
├── tsconfig.app.json               # Config TS para la app
├── tsconfig.node.json              # Config TS para herramientas (vite.config)
├── eslint.config.js                # Reglas de lint
├── index.html                      # HTML raiz que carga main.tsx
├── public/                         # Recursos estaticos servidos sin procesar
└── src/                            # CODIGO FUENTE
    │
    ├── main.tsx                    # PUNTO DE ENTRADA: monta App en #root
    ├── App.tsx                     # Componente raiz con todas las rutas
    ├── index.css                   # Estilos globales + directivas Tailwind
    │
    ├── componentes/                # COMPONENTES REUTILIZABLES (no son paginas)
    │   ├── comunes/                #   piezas usadas en varias paginas
    │   │   ├── Cargando.tsx                  - Spinner de carga
    │   │   ├── Modal.tsx                     - Ventana modal generica
    │   │   ├── ModalFirmaDigital.tsx         - Modal para firmar documentos
    │   │   └── EditorNotaClinicaEstructurada.tsx  - Editor de notas SOAP
    │   ├── plantilla/              #   layouts (esqueleto comun de varias paginas)
    │   │   ├── PlantillaPublico.tsx          - Layout sin login (registro, login)
    │   │   └── PlantillaAutenticado.tsx      - Layout con menu lateral (logueado)
    │   └── tres-dimensiones/       #   animaciones 3D con Three.js
    │       ├── EsferaMedica.tsx              - Esfera animada en login
    │       └── ParticulasSigueCursor.tsx     - Particulas que siguen al cursor
    │
    ├── contextos/                  # CONTEXT API DE REACT (estado global)
    │   └── ContextoAutenticacion.tsx
    │       Maneja: usuario logueado, JWT, permisos RBAC, login, logout
    │
    ├── hooks/                      # CUSTOM HOOKS (logica reutilizable)
    │
    ├── paginas/                    # PAGINAS COMPLETAS (una por ruta)
    │   ├── inicio-sesion/
    │   │   ├── PaginaInicioSesion.tsx       - Layout login con animacion 3D
    │   │   └── FormularioLogin.tsx          - Formulario con validacion
    │   ├── registro-clinica/
    │   │   └── PaginaRegistroClinica.tsx    - Onboarding nueva clinica
    │   ├── panel/
    │   │   └── PaginaPanel.tsx              - Dashboard con estadisticas
    │   ├── pacientes/
    │   │   └── PaginaPacientes.tsx          - CRUD de pacientes
    │   ├── nueva-consulta/
    │   │   └── PaginaNuevaConsulta.tsx      - Grabar audio + procesar
    │   ├── consultas/
    │   │   ├── PaginaConsultas.tsx          - Listado con filtros
    │   │   └── PaginaDetalleConsulta.tsx    - Ver y editar una consulta
    │   ├── documentos/
    │   │   └── PaginaDocumentos.tsx         - Listar PDFs y Words
    │   ├── configuracion-documentos/
    │   │   └── PaginaConfiguracionDocumentos.tsx - Plantillas
    │   ├── usuarios-clinica/
    │   │   └── PaginaUsuariosClinica.tsx    - Gestion de usuarios
    │   ├── roles/
    │   │   └── PaginaRoles.tsx              - Roles + matriz de permisos
    │   └── perfil/
    │       └── PaginaPerfil.tsx             - Datos personales y contrasena
    │
    ├── rutas/                      # PROTECCION DE RUTAS
    │   └── RutaProtegida.tsx               - Wrapper que valida JWT y permisos
    │
    ├── servicios/                  # CLIENTES HTTP (hablan con el backend)
    │   ├── clienteApi.ts                    - Fetch base con JWT + manejo errores
    │   ├── autenticacionServicio.ts         - Login, logout, registro
    │   ├── pacienteServicio.ts              - CRUD pacientes
    │   ├── consultaServicio.ts              - CRUD consultas
    │   └── documentoServicio.ts             - Listar/aprobar documentos
    │
    ├── tipos/                      # INTERFACES TYPESCRIPT
    │   ├── usuario.ts                       - Tipos de usuario
    │   ├── paciente.ts                      - Tipos de paciente
    │   ├── consulta.ts                      - Tipos de consulta
    │   └── documento.ts                     - Tipos de documento
    │
    └── utilidades/                 # FUNCIONES PURAS REUTILIZABLES
        ├── constantes.ts                    - URLs, claves localStorage
        ├── formatearFecha.ts                - Formateo es-PE
        ├── geolocalizacion.ts               - GPS para auditoria
        └── validaciones.ts                  - Reglas DNI, correo, contrasena
```

## Como leer este arbol

- **Nivel 1 (`src/`)**: separa por **tipo de cosa** (paginas vs componentes vs servicios).
- **Nivel 2 (dentro de paginas/)**: cada carpeta es una **funcionalidad** (pacientes, consultas, etc).
- **Nivel 3**: archivos `.tsx` de React y `.ts` de logica pura.

## Patron de nombres

- **PascalCase** para componentes React (`PaginaConsultas.tsx`)
- **camelCase** para utilidades y servicios (`formatearFecha.ts`, `pacienteServicio.ts`)
- **Nombres en espanol** (es decision del equipo - lenguaje ubicuo)

## Punto de entrada

`main.tsx` → monta `<App />` → `App.tsx` define todas las rutas con React Router → cada ruta carga una pagina de `paginas/`.
