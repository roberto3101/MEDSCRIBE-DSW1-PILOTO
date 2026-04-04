# MedScribe AI - Estructura del Proyecto
# Sistema de Documentacion Medica Automatizada con Inteligencia Artificial
# Ultima actualizacion: Abril 2026

## Arquitectura General

```
[cliente-web React :3000] → [Gateway .NET Core :5000] → [Servicio IA Python :8000] → [Whisper / Claude API]
                                      ↓
                               [SQL Server :1433]
```

## Arbol del Proyecto

```
MedScribe-AI/
│
├── docker-compose.yml
├── .env
├── iniciar.sh
│
│
│ =============================================
│  DOCUMENTACION
│ =============================================
│
├── Documentos/
│   ├── Arquitectura/                           # Diagramas, decisiones tecnicas, estructura
│   │   └── estructura-proyecto.md              # ESTE ARCHIVO
│   ├── Negocio/                                # Propuesta, modelo de negocio, analisis de mercado
│   ├── Tecnico/                                # APIs, contratos, especificaciones de endpoints
│   ├── Investigacion/                          # Analisis SEPTE, benchmarks, comparativas
│   ├── Manuales/                               # Guias de usuario, instalacion, despliegue
│   └── Actas/                                  # Reuniones, decisiones de equipo, avances
│
│
│ =============================================
│  React TSX + Vite + Tailwind (Puerto 3000)
│  Responsabilidad: Interfaz de usuario,
│  grabacion de audio, visualizacion
│ =============================================
│
├── cliente-web/
│   ├── Dockerfile                              # TSX
│   ├── package.json                            # TSX  - Dependencias
│   ├── tsconfig.json                           # TSX  - Configuracion TypeScript
│   ├── vite.config.ts                          # TSX  - Configuracion Vite
│   ├── tailwind.config.ts                      # TSX  - Configuracion Tailwind
│   ├── postcss.config.js                       # TSX  - PostCSS para Tailwind
│   ├── index.html                              # TSX  - Punto de entrada HTML
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   └── assets/
│   │       ├── logo.svg                        #       Logo MedScribe AI
│   │       └── iconos/                         #       Iconos estaticos
│   │
│   └── src/
│       ├── main.tsx                            # TSX  - Punto de entrada React
│       ├── App.tsx                             # TSX  - Componente raiz + rutas
│       ├── index.css                           # TSX  - Estilos globales Tailwind
│       │
│       ├── paginas/                            # TSX  - Cada pagina con sus componentes
│       │   ├── inicio-sesion/
│       │   │   ├── PaginaInicioSesion.tsx      #       Pagina login
│       │   │   ├── FormularioLogin.tsx         #       Formulario email + password
│       │   │   └── EnlaceRecuperacion.tsx      #       Link recuperar contrasena
│       │   │
│       │   ├── registro/
│       │   │   ├── PaginaRegistro.tsx          #       Pagina registro
│       │   │   ├── FormularioRegistro.tsx      #       Datos del nuevo usuario
│       │   │   └── SelectorEspecialidad.tsx    #       Dropdown especialidad medica
│       │   │
│       │   ├── panel/
│       │   │   ├── PaginaPanel.tsx             #       Dashboard principal
│       │   │   ├── ResumenConsultas.tsx        #       Consultas del dia/semana
│       │   │   ├── TarjetaEstadisticas.tsx     #       Metricas del medico
│       │   │   ├── ActividadReciente.tsx       #       Ultimos documentos generados
│       │   │   └── AccesosRapidos.tsx          #       Botones nueva consulta, etc.
│       │   │
│       │   ├── nueva-consulta/
│       │   │   ├── PaginaNuevaConsulta.tsx     #       Pagina grabacion + procesamiento
│       │   │   ├── SelectorPaciente.tsx        #       Buscar/seleccionar paciente
│       │   │   ├── GrabadorAudio.tsx           #       Boton grabar + visualizador onda
│       │   │   ├── IndicadorEstado.tsx         #       Estado: grabando/transcribiendo/procesando
│       │   │   ├── BarraProgreso.tsx           #       Progreso del procesamiento IA
│       │   │   ├── VistaTranscripcion.tsx      #       Muestra texto transcrito en vivo
│       │   │   ├── SelectorTipoDocumento.tsx   #       SOAP / Historia Clinica / Receta
│       │   │   └── PanelVerificacion.tsx       #       Preguntas de confirmacion de la IA
│       │   │
│       │   ├── detalle-consulta/
│       │   │   ├── PaginaDetalleConsulta.tsx   #       Ver consulta procesada
│       │   │   ├── CabeceraConsulta.tsx        #       Info: fecha, paciente, estado
│       │   │   ├── VistaNotaClinica.tsx        #       Nota estructurada (SOAP, HC)
│       │   │   ├── ReproductorAudio.tsx        #       Escuchar grabacion original
│       │   │   ├── AccionesDocumento.tsx       #       Aprobar / rechazar / editar
│       │   │   └── HistorialVersiones.tsx      #       Versiones del documento
│       │   │
│       │   ├── pacientes/
│       │   │   ├── PaginaPacientes.tsx         #       Listado de pacientes
│       │   │   ├── TablaPacientes.tsx          #       Tabla con busqueda y paginacion
│       │   │   ├── FiltroPacientes.tsx         #       Filtros: nombre, DNI, fecha
│       │   │   └── BotonNuevoPaciente.tsx      #       Abre modal crear paciente
│       │   │
│       │   ├── detalle-paciente/
│       │   │   ├── PaginaDetallePaciente.tsx   #       Ficha completa del paciente
│       │   │   ├── FormularioPaciente.tsx      #       Crear/editar datos paciente
│       │   │   ├── TarjetaPaciente.tsx         #       Card resumen: nombre, edad, DNI
│       │   │   ├── HistorialConsultas.tsx      #       Lista consultas previas
│       │   │   └── ListaDocumentos.tsx         #       Documentos del paciente
│       │   │
│       │   ├── documentos/
│       │   │   ├── PaginaDocumentos.tsx        #       Historial general de documentos
│       │   │   ├── TablaDocumentos.tsx         #       Tabla con filtros y paginacion
│       │   │   ├── FiltroDocumentos.tsx        #       Filtros: tipo, fecha, estado
│       │   │   └── VistaPrevia.tsx             #       Preview del documento sin descargar
│       │   │
│       │   ├── suscripcion/
│       │   │   ├── PaginaSuscripcion.tsx       #       Planes y facturacion
│       │   │   ├── TarjetaPlan.tsx             #       Card de cada plan con precio
│       │   │   ├── PlanActual.tsx              #       Plan activo + uso de consultas
│       │   │   └── HistorialPagos.tsx          #       Facturas anteriores
│       │   │
│       │   └── perfil/
│       │       ├── PaginaPerfil.tsx            #       Datos del medico
│       │       ├── FormularioPerfil.tsx        #       Editar datos personales
│       │       ├── CambiarContrasena.tsx       #       Formulario cambio password
│       │       └── ConfiguracionCuenta.tsx     #       Preferencias, notificaciones
│       │
│       ├── componentes/                        # TSX  - Componentes compartidos
│       │   ├── comunes/
│       │   │   ├── BarraNavegacion.tsx         #       Navbar superior
│       │   │   ├── MenuLateral.tsx             #       Sidebar con enlaces
│       │   │   ├── Cargando.tsx                #       Spinner / skeleton
│       │   │   ├── Alerta.tsx                  #       Notificaciones toast
│       │   │   ├── Modal.tsx                   #       Dialogos modales
│       │   │   ├── Tabla.tsx                   #       Tabla generica con paginacion
│       │   │   ├── BotonAccion.tsx             #       Botones estilizados
│       │   │   ├── CampoFormulario.tsx         #       Input reutilizable con label
│       │   │   └── PaginadorResultados.tsx     #       Paginacion generica
│       │   └── plantilla/
│       │       ├── PlantillaAutenticado.tsx    #       Layout con sidebar (logueado)
│       │       └── PlantillaPublico.tsx        #       Layout sin sidebar (login)
│       │
│       ├── servicios/                          # TSX  - Llamadas al backend
│       │   ├── clienteApi.ts                   #       Axios config base + interceptores
│       │   ├── autenticacionServicio.ts        #       Login, registro, refresh token
│       │   ├── consultaServicio.ts             #       CRUD consultas + enviar audio
│       │   ├── pacienteServicio.ts             #       CRUD pacientes
│       │   ├── documentoServicio.ts            #       Listar, descargar documentos
│       │   └── suscripcionServicio.ts          #       Planes, pagos
│       │
│       ├── hooks/                              # TSX  - Hooks personalizados
│       │   ├── usarGrabadorAudio.ts            #       Logica de grabacion Web Audio API
│       │   ├── usarAutenticacion.ts            #       Estado de sesion + JWT
│       │   └── usarConsulta.ts                 #       Estado del flujo de consulta
│       │
│       ├── contextos/                          # TSX  - React Context (estado global)
│       │   ├── ContextoAutenticacion.tsx       #       Sesion del usuario
│       │   └── ContextoTema.tsx                #       Tema claro/oscuro
│       │
│       ├── tipos/                              # TSX  - Interfaces TypeScript
│       │   ├── usuario.ts                      #       Tipos Usuario, Medico
│       │   ├── paciente.ts                     #       Tipos Paciente
│       │   ├── consulta.ts                     #       Tipos Consulta, Transcripcion
│       │   ├── documento.ts                    #       Tipos Documento, NotaClinica
│       │   └── api.ts                          #       Tipos Peticion, Respuesta genericos
│       │
│       ├── utilidades/                         # TSX  - Funciones auxiliares
│       │   ├── formatearFecha.ts               #       Formateo de fechas Peru
│       │   ├── formatearAudio.ts               #       Conversion de audio
│       │   └── constantes.ts                   #       URLs, estados, config
│       │
│       └── rutas/                              # TSX  - Rutas centralizadas por modulo
│           ├── indice.tsx                       #       Registro principal de todas las rutas
│           ├── RutaProtegida.tsx               #       Guard: redirige si no autenticado
│           ├── rutasAutenticacion.tsx          #       /iniciar-sesion, /registro, /recuperar
│           ├── rutasPanel.tsx                  #       /panel
│           ├── rutasConsultas.tsx              #       /consultas, /consultas/nueva, /consultas/:id
│           ├── rutasPacientes.tsx              #       /pacientes, /pacientes/:id
│           ├── rutasDocumentos.tsx             #       /documentos, /documentos/:id/descargar
│           ├── rutasSuscripcion.tsx            #       /suscripcion, /suscripcion/planes
│           └── rutasPerfil.tsx                 #       /perfil, /perfil/contrasena
│
│
│ =============================================
│  C# .NET Core - GATEWAY (Puerto 5000)
│  Responsabilidad: Autenticacion, rutas,
│  usuarios, datos, logica de negocio
│ =============================================
│
├── gateway-dotnet/
│   ├── Dockerfile                              # C#
│   ├── MedScribe.Gateway.sln                   # C#
│   └── src/
│       ├── MedScribe.API/
│       │   ├── Program.cs                      # C#  - Punto de entrada
│       │   ├── appsettings.json                # C#  - Configuracion
│       │   │
│       │   ├── Controladores/                  # C#  - Reciben peticiones HTTP
│       │   │   ├── AutenticacionControlador.cs #       Inicio/cierre sesion, registro
│       │   │   ├── ConsultaControlador.cs      #       CRUD consultas, iniciar grabacion
│       │   │   ├── PacienteControlador.cs      #       CRUD pacientes
│       │   │   ├── DocumentoControlador.cs     #       Listar, descargar, aprobar documentos
│       │   │   └── SuscripcionControlador.cs   #       Planes, pagos, facturacion
│       │   │
│       │   ├── Servicios/                      # C#  - Logica de negocio
│       │   │   ├── AutenticacionServicio.cs    #       JWT, tokens, roles
│       │   │   ├── ConsultaServicio.cs         #       Orquesta el flujo de consulta
│       │   │   ├── PacienteServicio.cs         #       Logica de pacientes
│       │   │   ├── DocumentoServicio.cs        #       Logica de documentos
│       │   │   ├── SuscripcionServicio.cs      #       Logica de suscripciones
│       │   │   └── ClienteServicioIA.cs        #       HTTP → servicio-ia:8000
│       │   │
│       │   ├── Validadores/                    # C#  - Validaciones centralizadas
│       │   │   ├── InicioSesionValidador.cs    #       Email, password
│       │   │   ├── ConsultaValidador.cs        #       Audio, paciente existe
│       │   │   ├── PacienteValidador.cs        #       DNI, nombres, fecha
│       │   │   ├── DocumentoValidador.cs       #       Tipo documento valido
│       │   │   └── SuscripcionValidador.cs     #       Plan existe, datos pago
│       │   │
│       │   ├── Rutas/                           # C#  - Endpoints centralizados por modulo
│       │   │   ├── RutasAutenticacion.cs       #       POST /api/auth/login, /api/auth/registro
│       │   │   ├── RutasConsultas.cs           #       GET/POST /api/consultas, /api/consultas/{id}
│       │   │   ├── RutasPacientes.cs           #       GET/POST/PUT /api/pacientes, /api/pacientes/{id}
│       │   │   ├── RutasDocumentos.cs          #       GET /api/documentos, /api/documentos/{id}/descargar
│       │   │   └── RutasSuscripciones.cs       #       GET/POST /api/suscripciones, /api/suscripciones/planes
│       │   │
│       │   └── Intermediarios/                 # C#  - Pipeline de peticiones
│       │       ├── JwtIntermediario.cs          #       Autenticacion por token
│       │       ├── ValidacionIntermediario.cs   #       Ejecuta validadores
│       │       └── LimitadorPeticionesIntermediario.cs  # Rate limiting
│       │
│       ├── MedScribe.Dominio/
│       │   ├── Entidades/                      # C#  - Reglas de negocio puras
│       │   │   ├── Usuario.cs                  #       Datos y comportamiento usuario
│       │   │   ├── Medico.cs                   #       Especialidad, colegiatura
│       │   │   ├── Paciente.cs                 #       Datos clinicos del paciente
│       │   │   ├── Consulta.cs                 #       Estado, fecha, duracion
│       │   │   ├── Documento.cs                #       Tipo, estado (borrador/aprobado)
│       │   │   └── PlanSuscripcion.cs          #       Limites, precio, features
│       │   │
│       │   ├── Modelos/                        # C#  - Mapeo a tablas SQL Server
│       │   │   ├── UsuarioModelo.cs            #       [Tabla: Usuarios]
│       │   │   ├── MedicoModelo.cs             #       [Tabla: Medicos]
│       │   │   ├── PacienteModelo.cs           #       [Tabla: Pacientes]
│       │   │   ├── ConsultaModelo.cs           #       [Tabla: Consultas]
│       │   │   ├── DocumentoModelo.cs          #       [Tabla: Documentos]
│       │   │   └── PlanSuscripcionModelo.cs    #       [Tabla: PlanesSuscripcion]
│       │   │
│       │   └── Contratos/                      # C#  - Interfaces / Abstracciones
│       │       ├── IAutenticacionServicio.cs
│       │       ├── IConsultaServicio.cs
│       │       ├── IPacienteServicio.cs
│       │       ├── IDocumentoServicio.cs
│       │       ├── ISuscripcionServicio.cs
│       │       ├── IConsultaRepositorio.cs
│       │       └── IDocumentoRepositorio.cs
│       │
│       ├── MedScribe.Infraestructura/
│       │   ├── Datos/
│       │   │   ├── ContextoAplicacion.cs       # C#  - DbContext Entity Framework
│       │   │   └── Migraciones/                # C#  - Migraciones EF Core
│       │   └── Repositorios/
│       │       ├── ConsultaRepositorio.cs      # C#  - Consultas a BD
│       │       └── DocumentoRepositorio.cs     # C#  - Documentos en BD
│       │
│       └── MedScribe.Transferencia/
│           ├── Peticiones/                     # C#  - Lo que envia el frontend
│           │   ├── InicioSesionPeticion.cs
│           │   ├── ConsultaPeticion.cs
│           │   └── PacientePeticion.cs
│           └── Respuestas/                     # C#  - Lo que devuelve la API
│               ├── TranscripcionRespuesta.cs
│               ├── NotaClinicaRespuesta.cs
│               └── DocumentoRespuesta.cs
│
│
│ =============================================
│  Python FastAPI - SERVICIO IA (Puerto 8000)
│  Responsabilidad: Transcripcion, orquestador
│  de intenciones, RAG, generacion documentos
│ =============================================
│
├── servicio-ia/
│   ├── Dockerfile                              # Python
│   ├── requirements.txt                        # Python
│   ├── principal.py                            # Python - Punto de entrada FastAPI
│   ├── app/
│   │   ├── __init__.py                         # Python
│   │   │
│   │   ├── rutas/                              # Python - Endpoints centralizados
│   │   │   ├── __init__.py                     #         Registro central de todas las rutas
│   │   │   ├── rutas_transcripcion.py          #         POST /api/ia/transcribir
│   │   │   ├── rutas_procesamiento.py          #         POST /api/ia/procesar
│   │   │   └── rutas_generacion.py             #         POST /api/ia/generar-word, /api/ia/generar-pdf
│   │   │
│   │   ├── servicios/                          # Python - Logica de IA
│   │   │   ├── servicio_whisper.py             #         Audio → Texto (Whisper API)
│   │   │   ├── clasificador_intenciones.py     #         ORQUESTADOR: detecta especialidad,
│   │   │   │                                   #         tipo documento, entidades clinicas
│   │   │   ├── servicio_rag.py                 #         Busca contexto relevante
│   │   │   ├── servicio_claude.py              #         Texto → Nota clinica (Claude API)
│   │   │   ├── generador_word.py               #         Nota → Archivo .docx
│   │   │   └── generador_pdf.py                #         Nota → Archivo .pdf
│   │   │
│   │   ├── validadores/                        # Python - Validaciones de entrada
│   │   │   ├── validador_audio.py              #         Formato, tamano, duracion
│   │   │   └── validador_consulta.py           #         Texto minimo, idioma
│   │   │
│   │   ├── indicaciones/                       # Markdown - Prompts para Claude
│   │   │   ├── base_sistema.md                 #           Instrucciones generales
│   │   │   ├── nota_soap.md                    #           Plantilla nota SOAP
│   │   │   ├── historia_clinica.md             #           Plantilla historia clinica
│   │   │   ├── receta.md                       #           Plantilla receta medica
│   │   │   └── verificacion.md                 #           Preguntas de confirmacion
│   │   │
│   │   ├── contexto/                           # Markdown - Base de conocimiento RAG
│   │   │   ├── especialidades/
│   │   │   │   ├── pediatria.md                #           Contexto pediatrico
│   │   │   │   ├── cardiologia.md              #           Contexto cardiologico
│   │   │   │   ├── ginecologia.md              #           Contexto ginecologico
│   │   │   │   └── general.md                  #           Medicina general
│   │   │   └── terminologia/
│   │   │       ├── cie10_comunes.md            #           Codigos CIE-10 frecuentes
│   │   │       └── farmacos_peru.md            #           Vademecum peruano
│   │   │
│   │   ├── plantillas/                         # Word - Plantillas de documentos
│   │   │   ├── nota_soap.docx                  #         Formato nota SOAP
│   │   │   ├── historia_clinica.docx           #         Formato historia clinica
│   │   │   └── receta.docx                     #         Formato receta medica
│   │   │
│   │   └── esquemas/                           # Python - Modelos Pydantic
│   │       ├── transcripcion.py                #         Esquema transcripcion
│   │       ├── consulta.py                     #         Esquema consulta
│   │       └── documento.py                    #         Esquema documento
│   │
│   └── pruebas/                                # Python - Tests
│       ├── prueba_transcripcion.py
│       ├── prueba_clasificador.py
│       └── prueba_rag.py
│
│
│ =============================================
│  SQL Server (Puerto 1433)
│  Responsabilidad: Persistencia de datos
│ =============================================
│
└── base-datos/
    ├── inicializacion.sql                      # SQL - Creacion de BD y permisos
    ├── datos_semilla.sql                       # SQL - Datos iniciales (planes, admin, especialidades)
    └── migraciones/                            # SQL - Historial de cambios a la BD
        ├── V1__esquema_inicial.sql             #       Tablas: Usuarios, Medicos, Pacientes,
        │                                       #       Consultas, Documentos, PlanesSuscripcion
        ├── (V2__nombre_cambio.sql)             #       Futuras modificaciones
        └── (V3__nombre_cambio.sql)             #       Futuras modificaciones
```

## Flujo del Orquestador de Intenciones

```
[Audio del medico]
    ↓
[servicio_whisper.py] → Transcripcion en texto
    ↓
[clasificador_intenciones.py] ← ORQUESTADOR
    ├── Detecta especialidad    → pediatria, cardiologia, etc.
    ├── Detecta tipo documento  → SOAP, historia clinica, receta
    ├── Detecta entidades       → sintomas, diagnostico, farmacos
    └── Decide que contexto RAG necesita
    ↓
[servicio_rag.py] → Busca SOLO el contexto relevante
    ├── indicaciones/nota_soap.md (si tipo = SOAP)
    ├── contexto/especialidades/pediatria.md (si especialidad = pediatria)
    └── contexto/terminologia/cie10_comunes.md
    ↓
[servicio_claude.py] → Recibe transcripcion + contexto filtrado
    ↓
[generador_pdf.py / generador_word.py] → Documento final
```

## Flujo Completo del Sistema

```
Peticion HTTP (frontend)
  → AutenticacionControlador (valida JWT)
    → ConsultaControlador (recibe audio)
      → ConsultaValidador (valida formato)
        → ConsultaServicio (logica de negocio)
          → ClienteServicioIA (HTTP a Python :8000)
            → servicio_whisper → transcripcion
            → clasificador_intenciones → clasificacion
            → servicio_rag → contexto relevante
            → servicio_claude → nota estructurada
            → generador_pdf → documento final
          → ConsultaRepositorio (guarda en SQL Server)
        → DocumentoRespuesta (devuelve al frontend)
```

## Puertos del Sistema

| Servicio           | Puerto | Acceso          |
|--------------------|--------|-----------------|
| Cliente Web React  | 3000   | Publico         |
| Gateway .NET Core  | 5000   | Publico         |
| Servicio IA Python | 8000   | Solo interno    |
| SQL Server         | 1433   | Solo interno    |

## Convenciones

- Lenguaje ubicuo en espanol para todo el dominio
- Nombres de archivos en espanol (Controladores, Servicios, etc.)
- Migraciones SQL con prefijo V{numero}__ para control de versiones
- Indicaciones (prompts) y contexto RAG en archivos .md editables
- Plantillas de documentos clinicos en .docx

## Tecnologias

| Componente         | Tecnologia                    |
|--------------------|-------------------------------|
| Gateway            | C# .NET Core 8                |
| Servicio IA        | Python 3.12 + FastAPI         |
| Base de datos      | SQL Server 2022               |
| Transcripcion      | Whisper API (OpenAI)          |
| Estructuracion     | Claude API (Anthropic)        |
| RAG                | Archivos .md + clasificador   |
| Documentos         | python-docx + reportlab       |
| Frontend           | React TSX + Vite + Tailwind   |
| Contenedores       | Docker + Docker Compose       |

## Mapa de Rutas del Sistema

### Frontend (cliente-web) - Rutas de navegacion

| Archivo                    | Ruta                      | Pagina                  |
|----------------------------|---------------------------|-------------------------|
| rutasAutenticacion.tsx     | /iniciar-sesion           | Login                   |
| rutasAutenticacion.tsx     | /registro                 | Registro                |
| rutasAutenticacion.tsx     | /recuperar-contrasena     | Recuperar password      |
| rutasPanel.tsx             | /panel                    | Dashboard principal     |
| rutasConsultas.tsx         | /consultas/nueva          | Nueva grabacion         |
| rutasConsultas.tsx         | /consultas/:id            | Detalle de consulta     |
| rutasPacientes.tsx         | /pacientes                | Listado pacientes       |
| rutasPacientes.tsx         | /pacientes/:id            | Ficha del paciente      |
| rutasDocumentos.tsx        | /documentos               | Historial documentos    |
| rutasDocumentos.tsx        | /documentos/:id/descargar | Descarga directa        |
| rutasSuscripcion.tsx       | /suscripcion              | Plan actual             |
| rutasSuscripcion.tsx       | /suscripcion/planes       | Catalogo de planes      |
| rutasPerfil.tsx            | /perfil                   | Datos del medico        |
| rutasPerfil.tsx            | /perfil/contrasena        | Cambiar contrasena      |

### Gateway C# (.NET Core) - Endpoints API REST

| Archivo                    | Metodo | Endpoint                          | Accion                    |
|----------------------------|--------|-----------------------------------|---------------------------|
| RutasAutenticacion.cs      | POST   | /api/auth/iniciar-sesion          | Login                     |
| RutasAutenticacion.cs      | POST   | /api/auth/registro                | Registrar usuario         |
| RutasAutenticacion.cs      | POST   | /api/auth/renovar-token           | Refresh JWT               |
| RutasAutenticacion.cs      | POST   | /api/auth/cerrar-sesion           | Logout                    |
| RutasConsultas.cs          | GET    | /api/consultas                    | Listar consultas          |
| RutasConsultas.cs          | GET    | /api/consultas/{id}               | Detalle consulta          |
| RutasConsultas.cs          | POST   | /api/consultas                    | Crear consulta (audio)    |
| RutasConsultas.cs          | PUT    | /api/consultas/{id}/aprobar       | Aprobar documento         |
| RutasConsultas.cs          | PUT    | /api/consultas/{id}/rechazar      | Rechazar documento        |
| RutasPacientes.cs          | GET    | /api/pacientes                    | Listar pacientes          |
| RutasPacientes.cs          | GET    | /api/pacientes/{id}               | Detalle paciente          |
| RutasPacientes.cs          | POST   | /api/pacientes                    | Crear paciente            |
| RutasPacientes.cs          | PUT    | /api/pacientes/{id}               | Editar paciente           |
| RutasDocumentos.cs         | GET    | /api/documentos                   | Listar documentos         |
| RutasDocumentos.cs         | GET    | /api/documentos/{id}              | Detalle documento         |
| RutasDocumentos.cs         | GET    | /api/documentos/{id}/descargar    | Descargar PDF/Word        |
| RutasSuscripciones.cs      | GET    | /api/suscripciones/planes         | Listar planes             |
| RutasSuscripciones.cs      | GET    | /api/suscripciones/actual         | Plan activo del medico    |
| RutasSuscripciones.cs      | POST   | /api/suscripciones                | Contratar plan            |

### Servicio IA (Python FastAPI) - Endpoints internos

| Archivo                    | Metodo | Endpoint                  | Accion                        |
|----------------------------|--------|---------------------------|-------------------------------|
| rutas_transcripcion.py     | POST   | /api/ia/transcribir       | Audio → Texto (Whisper)       |
| rutas_procesamiento.py     | POST   | /api/ia/procesar          | Texto → Nota clinica (Claude) |
| rutas_generacion.py        | POST   | /api/ia/generar-pdf       | Nota → Archivo PDF            |
| rutas_generacion.py        | POST   | /api/ia/generar-word      | Nota → Archivo Word           |
