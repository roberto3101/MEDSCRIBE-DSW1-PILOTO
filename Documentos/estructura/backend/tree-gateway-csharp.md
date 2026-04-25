# Arbol del Backend Gateway (C# .NET 9)

> Backend principal en C# con ASP.NET Core 9. Es la "puerta de entrada" del sistema.

```
gateway-dotnet/
└── src/
    └── MedScribe.API/
        ├── Program.cs                      # PUNTO DE ENTRADA
        │   Configura: servicios DI, JWT, CORS, Swagger, pipeline HTTP.
        │
        ├── MedScribe.API.csproj            # Proyecto y dependencias NuGet
        ├── appsettings.json                # Configuracion (cadenas conexion, JWT)
        ├── appsettings.Development.json    # Override para dev
        ├── Dockerfile                      # Empaquetado para Docker
        │
        ├── Controladores/                  # CONTROLLERS (la API REST publica)
        │   ├── AutenticacionControlador.cs       - Login, registro, cambiar pwd
        │   ├── ClinicaControlador.cs             - Datos de la clinica
        │   ├── ConsultaControlador.cs            - CRUD consultas + IA
        │   ├── PacienteControlador.cs            - CRUD pacientes
        │   ├── DocumentoControlador.cs           - Listar/aprobar PDFs y Words
        │   ├── UsuarioDeClinicaControlador.cs    - Usuarios de la clinica
        │   └── RolControlador.cs                 - Roles y permisos
        │
        ├── Servicios/                      # LOGICA DE NEGOCIO Y INTEGRACIONES
        │   ├── ClienteServicioIA.cs              - HTTP client al servicio Python
        │   └── ProveedorContextoClinica.cs       - Multi-tenant context
        │
        ├── Datos/
        │   └── DAO/                        # ACCESO A DATOS (ADO.NET puro)
        │       ├── UsuarioDAO.cs                 - Login, perfil, permisos
        │       ├── PacienteDAO.cs                - CRUD pacientes
        │       ├── ConsultaDAO.cs                - CRUD consultas
        │       ├── DocumentoDAO.cs               - PDFs y Words
        │       ├── ClinicaDAO.cs                 - Clinicas
        │       ├── RolDAO.cs                     - Roles
        │       ├── SuscripcionDAO.cs             - Planes y estado
        │       ├── UsuarioDeClinicaDAO.cs        - Usuarios por clinica
        │       └── (todos llaman stored procedures)
        │
        ├── Contratos/                      # INTERFACES de los DAOs
        │   ├── IUsuarioDAO.cs                    - Inyeccion de dependencias
        │   ├── IPacienteDAO.cs
        │   ├── IConsultaDAO.cs
        │   ├── IDocumentoDAO.cs
        │   ├── IClinicaDAO.cs
        │   ├── IRolDAO.cs
        │   ├── ISuscripcionDAO.cs
        │   └── IUsuarioDeClinicaDAO.cs
        │
        ├── Modelos/                        # OBJETOS DE DATOS
        │   ├── Entidades/                  # Clases que mapean tablas
        │   │   ├── Usuario.cs
        │   │   ├── Medico.cs
        │   │   ├── Paciente.cs
        │   │   ├── Consulta.cs
        │   │   ├── Documento.cs
        │   │   ├── PlanSuscripcion.cs
        │   │   └── RolDeClinica.cs
        │   └── Peticiones/                 # DTOs de entrada (request bodies)
        │       ├── InicioSesionPeticion.cs
        │       ├── RegistroPeticion.cs
        │       ├── PeticionRegistrarClinica.cs
        │       └── PeticionCambiarContrasena.cs
        │
        ├── Validadores/                    # SANEAMIENTO DE INPUTS
        │   └── SanitizadorDeTexto.cs             - Limpia caracteres peligrosos
        │
        ├── Intermediarios/                 # MIDDLEWARES
        │   └── ManejadorGlobalDeExcepciones.cs   - Atrapa errores no controlados
        │
        ├── Properties/
        │   └── launchSettings.json
        │
        └── Pruebas/                        # TESTS (vacio o stubs)
```

## Patrones de organizacion

### Patron MVC adaptado a Web API
- **M (Modelo)**: `Modelos/Entidades/` y `Modelos/Peticiones/`
- **V (Vista)**: respuestas JSON (no hay vistas server-rendered, es API pura)
- **C (Controlador)**: `Controladores/`

### Patron DAO (Data Access Object)
Cada tabla importante tiene su DAO. La interface en `Contratos/` y la implementacion en `Datos/DAO/`. Esto permite:
- Inyectar mocks para tests
- Cambiar la implementacion sin tocar los controladores
- Encapsular toda la logica SQL en un solo lugar

### Inyeccion de dependencias (DI)
Configurada en `Program.cs`. Cada controlador recibe sus DAOs por constructor:

```csharp
public PacienteControlador(IPacienteDAO pacienteDao) {
    _pacienteDao = pacienteDao;
}
```

ASP.NET Core resuelve automaticamente que implementacion usar.

## Convencion de nombres

- **PascalCase** en todo (es la convencion de C#)
- **Sufijos descriptivos**: `Controlador`, `DAO`, `Servicio`, `Peticion`, `Entidad`
- **Espanol**: nombres en espanol porque el equipo trabaja en espanol (lenguaje ubicuo)

## Como llegan las peticiones

```
Frontend manda HTTP POST /api/autenticacion/iniciar-sesion
            │
            v
    ASP.NET Core enruta a:
    AutenticacionControlador.IniciarSesion(peticion)
            │
            v
    Controlador valida ModelState
            │
            v
    Controlador llama: _usuarioDao.ValidarCredenciales(...)
            │
            v
    UsuarioDAO ejecuta SP: usp_Usuarios_ValidarCredenciales
            │
            v
    SQL Server devuelve usuario + permisos JSON
            │
            v
    Controlador genera JWT y lo retorna como JSON
```
