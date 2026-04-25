# 01. Fundamentos que debes dominar

> Conceptos basicos en lenguaje simple. Si te preguntan "que es X", debes poder responder con tus propias palabras.

---

## 1. ¿Que es C#?

C# es un lenguaje de programacion creado por Microsoft. Es **fuertemente tipado** (cada variable tiene un tipo que no cambia) y **orientado a objetos**. Se compila a un lenguaje intermedio que ejecuta el runtime de .NET.

**Ventajas que debes mencionar**:
- Rendimiento muy alto.
- El compilador atrapa muchos errores antes de ejecutar.
- Excelente IDE: Visual Studio.
- Lo pide la rubrica del curso.

---

## 2. ¿Que es .NET?

.NET es la **plataforma** (runtime + librerias) sobre la que corre C#. Es como la JVM para Java.

**Versiones importantes**:
- .NET Framework: la vieja, solo Windows. NO la usamos.
- .NET Core / .NET 5+: la moderna, multiplataforma (Windows, Linux, Mac). **Esta es la que usamos**, version 9.

---

## 3. ¿Que es ASP.NET Core?

Es el **framework web** dentro de .NET. Sirve para construir paginas web (MVC con vistas) o **APIs REST** (que es lo nuestro).

**ASP.NET Core Web API** es la modalidad que usamos: el servidor recibe peticiones HTTP y devuelve JSON, sin generar HTML. El frontend (React) es quien renderiza las vistas.

---

## 4. ¿Que es una API REST?

**REST** = Representational State Transfer. Es un estilo de diseno de APIs que usa HTTP de forma estructurada.

**Las cuatro operaciones basicas (CRUD)**:
- **GET** `/api/pacientes` -> listar pacientes
- **POST** `/api/pacientes` -> crear un paciente
- **PUT** `/api/pacientes/123` -> actualizar el paciente 123
- **DELETE** `/api/pacientes/123` -> eliminar el paciente 123

**El cuerpo del mensaje** se envia y recibe como JSON.

---

## 5. ¿Que es MVC?

**MVC** = Model-View-Controller. Patron de diseno que separa una aplicacion en 3 partes:

- **Modelo**: datos y reglas de negocio (clases C# en `Modelos/`)
- **Vista**: lo que el usuario ve. En nuestro caso es JSON, no HTML.
- **Controlador**: recibe la peticion, decide que hacer, llama al modelo y devuelve la vista (JSON).

En el codigo, los controladores estan en `Controladores/` y heredan de `ControllerBase`.

---

## 6. ¿Que es ADO.NET y por que NO usamos Entity Framework?

**ADO.NET** es la **API de bajo nivel de .NET para hablar con bases de datos**. Tu armas las queries SQL y las ejecutas directamente con `SqlCommand`.

**Entity Framework** es un **ORM** (Object Relational Mapper): traduce automaticamente entre clases C# y tablas SQL. Es mas comodo pero mas lento y menos controlable.

**Por que elegimos ADO.NET**:
1. **Lo pide la rubrica**: el curso exige stored procedures como proceso de negocio.
2. **Rendimiento**: para joins complejos y operaciones bulk, los SP son mucho mas rapidos.
3. **Control total**: sabemos exactamente que SQL se ejecuta. Cero sorpresas.
4. **Las transacciones criticas viven en SQL**, no en C#. El DBA puede tunear sin tocar el backend.

**Ejemplo de codigo**:
```csharp
using var conn = new SqlConnection(_cadenaConexion);
using var cmd = new SqlCommand("usp_Usuarios_ValidarCredenciales", conn);
cmd.CommandType = CommandType.StoredProcedure;
cmd.Parameters.AddWithValue("@Correo", peticion.Correo);
cmd.Parameters.AddWithValue("@Contrasena", peticion.Contrasena);
await conn.OpenAsync();
var lector = await cmd.ExecuteReaderAsync();
```

---

## 7. ¿Que es JWT?

**JWT** = JSON Web Token. Es un **token de autenticacion** firmado digitalmente.

**Como funciona**:
1. El usuario manda correo + contrasena al login.
2. El servidor valida y, si es correcto, **genera un JWT** firmado con una clave secreta.
3. El JWT contiene: id_usuario, id_clinica, rol, permisos, fecha de expiracion.
4. El servidor devuelve el JWT al cliente.
5. El cliente guarda el JWT (en localStorage en nuestro caso).
6. En cada peticion siguiente, el cliente manda el JWT en el header `Authorization: Bearer <token>`.
7. El servidor verifica la firma del JWT (no necesita ir a la BD) y deja pasar.

**Ventajas**:
- Stateless: el servidor no guarda sesiones.
- El JWT contiene toda la info del usuario, evita queries.
- Estandar de la industria.

---

## 8. ¿Que es BCrypt?

BCrypt es un **algoritmo para hashear contrasenas** de forma segura.

**El problema**: si guardas la contrasena en texto plano y alguien roba la BD, tiene todas las contrasenas.

**La solucion**: la pasas por una funcion de hash (de un solo sentido). Lo que guardas es el hash, no la contrasena.

**Por que BCrypt y no SHA o MD5**:
- BCrypt es **lento a proposito**: hace miles de iteraciones internas, lo que hace inviable un ataque por fuerza bruta.
- Tiene **salt incorporado**: dos contrasenas iguales generan hashes diferentes.
- **Cost factor configurable**: puedes hacerlo mas lento conforme avance el hardware.

En el codigo usamos BCrypt con cost factor 11.

---

## 9. ¿Que es RBAC?

**RBAC** = Role-Based Access Control. Sistema de permisos basado en roles.

**Ejemplo simple**:
- Rol "Medico" puede: ver pacientes, crear consultas.
- Rol "Admin" puede: lo mismo + crear usuarios + aprobar documentos + configurar plantillas.

**En MedScribe usamos RBAC granular**: cada rol tiene una matriz de permisos por modulo y accion.

```
Modulos: pacientes, consultas, documentos, configuracion, usuarios, roles
Acciones por modulo: ver, crear, editar, eliminar
```

Asi un rol "Recepcionista" podria tener `pacientes.ver`, `pacientes.crear`, `pacientes.editar` pero NO `pacientes.eliminar` ni nada de consultas.

Los permisos se guardan como **JSON en la columna `PermisosJSON` de la tabla `RolesDeClinica`**.

---

## 10. ¿Que es Multi-tenant?

**Multi-tenant** significa que la **misma instalacion del software sirve a varias organizaciones (tenants) sin que se vean entre si**. En nuestro caso, varias clinicas usan la misma instalacion de MedScribe.

**Como lo garantizamos**:
- Toda tabla importante tiene una columna `IdClinica`.
- Cada usuario solo ve datos de su clinica.
- El JWT incluye el `IdClinica` del usuario logueado.
- Un servicio llamado `ProveedorContextoClinica` extrae ese ID en cada peticion.
- Toda query SQL filtra automaticamente por `IdClinica`.

---

## 11. ¿Que es Inyeccion de Dependencias (DI)?

Patron donde **un objeto recibe sus dependencias en lugar de crearlas**.

**Sin DI** (mal):
```csharp
public class PacienteControlador {
    private PacienteDAO _dao = new PacienteDAO("cadena_conexion_hardcoded");
}
```

**Con DI** (bien):
```csharp
public class PacienteControlador {
    private IPacienteDAO _dao;
    public PacienteControlador(IPacienteDAO dao) {
        _dao = dao;
    }
}
```

ASP.NET Core resuelve automaticamente que implementacion inyectar. Esto se configura en `Program.cs`:
```csharp
builder.Services.AddScoped<IPacienteDAO, PacienteDAO>();
```

**Ventajas**:
- Testeable: puedes inyectar un mock para tests.
- Cambias la implementacion sin tocar el controlador.

---

## 12. ¿Que es DAO?

**DAO** = Data Access Object. Patron para **encapsular el acceso a datos en una clase**.

En nuestro caso:
- Cada tabla tiene su DAO: `PacienteDAO`, `ConsultaDAO`, `UsuarioDAO`, etc.
- Cada DAO tiene metodos como `Listar()`, `Insertar()`, `Actualizar()`, `Eliminar()`.
- Cada metodo invoca un stored procedure especifico.

Asi, **todo el SQL del sistema vive solo en los DAOs**. Los controladores no tocan SQL.

---

## 13. ¿Que es ModelState?

ASP.NET Core valida automaticamente los DTOs de entrada usando **DataAnnotations**:

```csharp
public class InicioSesionPeticion {
    [Required(ErrorMessage = "El correo es obligatorio")]
    [EmailAddress(ErrorMessage = "Formato de correo invalido")]
    public string Correo { get; set; }
    
    [Required]
    [MinLength(8)]
    public string Contrasena { get; set; }
}
```

Si el JSON entrante no cumple las reglas, `ModelState.IsValid` es `false` y devolvemos HTTP 400 con los errores.

---

## 14. ¿Que es CORS?

**CORS** = Cross-Origin Resource Sharing. Mecanismo del navegador para **permitir o bloquear peticiones entre dominios distintos**.

**El problema**: nuestro frontend corre en `localhost:3000` y el backend en `localhost:5000`. Sin CORS, el navegador bloquea las peticiones porque son de "origenes" distintos.

**La solucion**: configurar CORS en `Program.cs` para permitir explicitamente al frontend.

---

## 15. ¿Que es un Middleware?

Es una **pieza de codigo que intercepta cada peticion** antes o despues del controlador. Se configura en `Program.cs` en orden.

**Ejemplos en nuestro proyecto**:
- Middleware de autenticacion JWT (valida el token automaticamente).
- Middleware de autorizacion (chequea permisos).
- `ManejadorGlobalDeExcepciones` (atrapa errores no controlados y devuelve un JSON consistente).

---

## 16. Resumen de tecnologias en una tabla

| Concepto | Tecnologia | Para que | Donde en el codigo |
|---|---|---|---|
| Lenguaje | C# 13 | Todo el backend | `gateway-dotnet/src/` |
| Plataforma | .NET 9 | Runtime y librerias | `MedScribe.API.csproj` |
| Framework web | ASP.NET Core 9 Web API | Endpoints REST | `Program.cs`, `Controladores/` |
| Acceso a datos | ADO.NET + SqlCommand | Llamar stored procedures | `Datos/DAO/` |
| Autenticacion | JWT Bearer | Tokens firmados | `Program.cs` (config) |
| Hash contrasenas | BCrypt | Almacenar contrasenas seguras | `UsuarioDAO.cs` |
| Inyeccion deps | Built-in DI | Desacoplar componentes | `Program.cs` |
| Validacion entrada | DataAnnotations | Validar DTOs | `Modelos/Peticiones/` |
| Manejo errores | Middleware global | Respuestas JSON consistentes | `Intermediarios/` |
| Documentacion API | Swagger / OpenAPI | Probar endpoints | `Program.cs` |
| Multi-tenant | Servicio propio | Aislar clinicas | `ProveedorContextoClinica.cs` |
| Cliente HTTP | HttpClient | Hablar con servicio IA | `ClienteServicioIA.cs` |
