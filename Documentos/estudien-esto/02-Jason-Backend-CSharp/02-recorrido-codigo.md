# 02. Recorrido del codigo

> Cada archivo importante explicado. Si el profe te pide "muestrame donde X", aqui esta la respuesta.

---

## Punto de entrada

### `Program.cs`
**Es el bootstrap de toda la aplicacion**. Si te piden "muestrame por donde arranca todo", abre este archivo.

**Lo que hace, en orden**:
1. Crea el `WebApplicationBuilder`.
2. Configura los **servicios DI** (registra todos los DAOs).
3. Configura **JWT Bearer** con la clave secreta del `appsettings.json`.
4. Configura **CORS** para permitir al frontend (localhost:3000).
5. Configura **Swagger** para documentacion automatica.
6. Configura el **HttpClient** para `ClienteServicioIA` apuntando al servicio Python.
7. Construye la app y configura el pipeline HTTP:
   - `UseExceptionHandler` -> middleware global de errores.
   - `UseCors` -> aplica la politica CORS.
   - `UseAuthentication` -> valida el JWT.
   - `UseAuthorization` -> chequea permisos.
   - `MapControllers` -> mapea las rutas a los controladores.

---

## `Controladores/` — La API REST publica

### `AutenticacionControlador.cs` ⭐ ARCHIVO CLAVE
**Endpoints**:
- `POST /api/autenticacion/iniciar-sesion` -> login
- `POST /api/autenticacion/registro` -> registrar nueva clinica + admin
- `POST /api/autenticacion/cambiar-contrasena` -> cambiar password

**Lo que hace `IniciarSesion`**:
1. Recibe `InicioSesionPeticion` (correo + contrasena).
2. Valida `ModelState`.
3. Llama `_usuarioDao.ValidarCredenciales(correo, contrasena)`.
4. El DAO ejecuta `usp_Usuarios_ValidarCredenciales` que verifica BCrypt y devuelve el usuario + permisos JSON.
5. Si valida, genera un JWT con `id_usuario`, `id_clinica`, rol, permisos y fecha de expiracion (24 horas).
6. Devuelve el JWT y los datos del usuario al frontend.

### `ConsultaControlador.cs`
**Endpoints**:
- `GET /api/consultas` -> listar (paginado, filtrable)
- `GET /api/consultas/{id}` -> detalle
- `POST /api/consultas` -> crear nueva consulta (incluye llamada a IA)
- `PUT /api/consultas/{id}` -> actualizar nota
- `POST /api/consultas/{id}/aprobar` -> aprobar y bloquear

**El endpoint mas complejo** es `POST /api/consultas`:
1. Recibe el audio + datos del paciente.
2. Llama `_clienteServicioIA.Transcribir(audio)`.
3. Llama `_clienteServicioIA.Procesar(transcripcion)`.
4. Llama `_consultaDao.CrearConsultaConDocumento(...)` que ejecuta el SP transaccional.
5. Devuelve la consulta creada + rutas de archivos.

### `PacienteControlador.cs`
CRUD clasico:
- `GET /api/pacientes` -> listar
- `GET /api/pacientes/buscar?dni=X` -> buscar
- `GET /api/pacientes/{id}` -> detalle
- `POST /api/pacientes` -> crear
- `PUT /api/pacientes/{id}` -> actualizar
- `DELETE /api/pacientes/{id}` -> eliminar (soft delete)

### `DocumentoControlador.cs`
- `GET /api/documentos` -> listar PDFs y Words
- `GET /api/documentos/{id}/descargar` -> descargar archivo
- `POST /api/documentos/{id}/aprobar` -> marcar como aprobado

### `ClinicaControlador.cs`
Datos generales de la clinica activa.

### `UsuarioDeClinicaControlador.cs`
Gestion de usuarios de la clinica (solo admin):
- Crear usuarios (medico o recepcionista).
- Cambiar rol.
- Activar/desactivar.

### `RolControlador.cs`
Gestion de roles personalizados:
- Crear rol.
- Definir matriz de permisos JSON.
- Asignar a usuarios.

---

## `Servicios/` — Logica de negocio e integraciones

### `ClienteServicioIA.cs` ⭐ ARCHIVO CLAVE
**Es el cliente HTTP que habla con el servicio Python**.

**Metodos**:
- `Transcribir(audio)` -> POST al servicio IA en `/api/ia/transcribir`.
- `Procesar(transcripcion, contexto)` -> POST a `/api/ia/procesar`.
- `GenerarPdf(nota, paciente)` -> POST a `/api/ia/generar-pdf`.
- `GenerarWord(nota, paciente)` -> POST a `/api/ia/generar-word`.

**Manejo de errores**: si el servicio IA tarda mas de 90 segundos o devuelve 5xx, lanza una excepcion que el middleware global captura.

### `ProveedorContextoClinica.cs`
**Servicio inyectable que extrae la clinica activa del JWT**.

**Como funciona**:
1. Recibe el `HttpContext` (la peticion actual).
2. Lee el claim `clinic_id` del JWT.
3. Lo expone via propiedad `IdClinicaActual`.

Cada DAO usa este servicio para filtrar automaticamente por clinica.

---

## `Datos/DAO/` — Acceso a la base de datos

### `UsuarioDAO.cs`
**Metodos clave**:
- `ValidarCredenciales(correo, contrasena)` -> ejecuta `usp_Usuarios_ValidarCredenciales`.
- `BuscarPorCorreo(correo)` -> `usp_Usuarios_BuscarPorCorreo`.
- `RegistrarMedicoConUsuario(...)` -> SP transaccional que crea usuario + medico atomicamente.
- `CambiarContrasena(...)` -> hashea con BCrypt y ejecuta `usp_Usuarios_CambiarContrasena`.
- `ObtenerPermisosCompletos(idUsuario)` -> recupera permisos JSON.

### `ConsultaDAO.cs`
- `Listar(filtros, paginacion)` -> `usp_Consultas_Listar`.
- `Buscar(idConsulta)` -> `usp_Consultas_Buscar`.
- `CrearConsultaConDocumento(...)` -> SP transaccional que inserta consulta + valores + documento.
- `AprobarConsultaYDocumentos(...)` -> SP transaccional para aprobar.
- `RechazarConsultaYDocumentos(...)` -> SP transaccional para rechazar.

### `PacienteDAO.cs`
CRUD que invoca `usp_Pacientes_*`.

### `DocumentoDAO.cs`
- `ListarPorConsulta(idConsulta)` -> `usp_Documentos_PorConsulta`.
- `Insertar(...)` -> `usp_Documentos_Insertar`.
- `AprobarPorConsulta(idConsulta)` -> `usp_Documentos_AprobarPorConsulta`.

### `ClinicaDAO.cs`, `RolDAO.cs`, `SuscripcionDAO.cs`, `UsuarioDeClinicaDAO.cs`
Patron similar: cada uno expone metodos que invocan stored procedures de su tabla.

**Punto clave**: ningun DAO escribe SQL embebido. Todo es stored procedure.

---

## `Contratos/` — Las interfaces de los DAOs

Para cada DAO existe una interface en `Contratos/`:

- `IUsuarioDAO` -> implementada por `UsuarioDAO`
- `IPacienteDAO` -> implementada por `PacienteDAO`
- ...etc

**Por que separar**: para inyeccion de dependencias. En `Program.cs` registramos:
```csharp
builder.Services.AddScoped<IUsuarioDAO, UsuarioDAO>();
```

Asi los controladores reciben la interface y son testeables.

---

## `Modelos/`

### `Modelos/Entidades/`
Clases C# que representan filas de la BD:
- `Usuario.cs`
- `Medico.cs`
- `Paciente.cs`
- `Consulta.cs`
- `Documento.cs`
- `PlanSuscripcion.cs`
- `RolDeClinica.cs`

Estas clases se "rellenan" desde los `SqlDataReader` en los DAOs.

### `Modelos/Peticiones/`
DTOs de entrada (request bodies). Tienen DataAnnotations para validacion automatica:
- `InicioSesionPeticion.cs`
- `RegistroPeticion.cs`
- `PeticionRegistrarClinica.cs`
- `PeticionCambiarContrasena.cs`

---

## `Validadores/`

### `SanitizadorDeTexto.cs`
Limpia caracteres potencialmente peligrosos de los inputs textuales (quita HTML, comillas raras, etc.). Se invoca desde los controladores antes de pasar a los DAOs.

---

## `Intermediarios/` (middleware)

### `ManejadorGlobalDeExcepciones.cs`
Middleware que **atrapa cualquier excepcion no controlada** y devuelve una respuesta JSON consistente:

```json
{
  "error": "error_interno",
  "mensaje": "Algo salio mal, reintenta en unos segundos"
}
```

Esto evita que se filtren stack traces al cliente y mejora la UX.

---

## Configuracion

### `appsettings.json`
```json
{
  "ConnectionStrings": {
    "sql": "Server=db,1434;Database=MedScribeDB;..."
  },
  "Jwt": {
    "ClaveSecreta": "...",
    "Emisor": "MedScribe",
    "Audiencia": "MedScribeClientes"
  },
  "ServicioIA": {
    "UrlBase": "http://servicio-ia:8000"
  }
}
```

### `appsettings.Development.json`
Override para entorno de desarrollo (cadenas de conexion locales, logs mas verbosos).

---

## Carpeta `obj/`

Es **codigo generado automaticamente por el compilador**. NO la mires ni la modifiques. Si te preguntan por algo ahi, es informacion del build.
