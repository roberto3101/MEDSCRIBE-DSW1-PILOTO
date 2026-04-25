# 04. Preguntas que te pueden hacer y como responder

---

## Preguntas tecnicas (alta probabilidad)

### "¿Por que ASP.NET Core 9 y no la version anterior?"
**Respuesta**: Porque .NET 9 es la version actual (LTS reciente) con las mejoras de rendimiento mas modernas. Tiene soporte oficial de Microsoft, integracion nativa con Docker, y compatibilidad con todas las librerias del ecosistema. Usar versiones viejas implicaria perder optimizaciones y soporte.

### "¿Que es MVC y como lo aplican aqui?"
**Respuesta**: MVC es Modelo-Vista-Controlador. Es un patron de diseno que separa la aplicacion en tres responsabilidades. En nuestro caso, el Modelo son las clases en `Modelos/Entidades/` y los DTOs en `Modelos/Peticiones/`. La Vista es el JSON que devolvemos, porque al ser una API REST no renderizamos HTML. El Controlador esta en `Controladores/` y recibe las peticiones HTTP, valida, delega a los servicios y DAOs, y devuelve la respuesta.

### "¿Por que ADO.NET y no Entity Framework?"
**Respuesta**: Por tres razones. Primero, la rubrica del curso exige stored procedures como proceso de negocio. Segundo, ADO.NET con SP nos da rendimiento maximo para operaciones complejas con joins. Tercero, las transacciones criticas viven en SQL en lugar de C#, lo que permite al DBA optimizar sin tocar codigo. Entity Framework habria sido mas comodo pero no cumple con esos requisitos.

### "¿Como funciona el JWT que generan?"
**Respuesta**: Cuando el usuario hace login y la contrasena es correcta, generamos un token JSON Web Token firmado con HMAC SHA256 usando una clave secreta. El token contiene claims con el id_usuario, id_clinica, rol y todos los permisos del usuario. Lo firmamos con `Microsoft.IdentityModel.Tokens`. El cliente lo guarda y lo envia en cada peticion en el header Authorization. El middleware de ASP.NET Core lo valida automaticamente sin necesidad de ir a la base de datos en cada peticion.

### "¿Por que BCrypt y no SHA-256 para las contrasenas?"
**Respuesta**: Porque BCrypt esta especificamente disenado para hashear contrasenas, mientras que SHA-256 es un hash criptografico generico. Tres ventajas concretas: BCrypt es lento a proposito, lo que dificulta los ataques por fuerza bruta. Tiene salt incorporado, asi dos contrasenas iguales producen hashes distintos. Y tiene un cost factor configurable que puedes aumentar conforme avance el hardware.

### "¿Como evitan SQL injection?"
**Respuesta**: De dos formas combinadas. Primero, todo el acceso a datos pasa por stored procedures, no por SQL embebido. Segundo, usamos parametros tipados con `SqlParameter` o `cmd.Parameters.AddWithValue`, lo que hace que ADO.NET escape los valores automaticamente. Es imposible inyectar SQL malicioso porque los parametros nunca se concatenan al string de la query.

### "¿Que es multi-tenant y como lo implementaron?"
**Respuesta**: Multi-tenant significa que la misma instalacion sirve a multiples clinicas sin que se vean entre si. Lo implementamos asi: toda tabla importante tiene una columna IdClinica. El JWT del usuario incluye su clinic_id como claim. Tenemos un servicio inyectado llamado `ProveedorContextoClinica` que extrae ese ID del JWT en cada peticion. Cada DAO usa ese ID para filtrar las queries SQL. Asi un usuario fisicamente no puede ver datos de otra clinica, aunque manipule la URL.

### "¿Como manejan los errores no controlados?"
**Respuesta**: Con un middleware global llamado `ManejadorGlobalDeExcepciones`. Lo configuramos en `Program.cs` al inicio del pipeline HTTP. Cuando ocurre cualquier excepcion no atrapada, el middleware la captura, registra el log con el stack trace completo, y devuelve al cliente un JSON consistente con un mensaje generico. Asi nunca se filtran stack traces al frontend y tenemos control total sobre el formato de los errores.

### "¿Que es inyeccion de dependencias?"
**Respuesta**: Es un patron donde un objeto recibe sus dependencias por constructor en lugar de crearlas el mismo. ASP.NET Core trae un contenedor DI built-in. En `Program.cs` registramos cada interface con su implementacion: `builder.Services.AddScoped<IPacienteDAO, PacienteDAO>()`. Asi cuando un controlador declara `IPacienteDAO` en su constructor, el framework inyecta automaticamente la implementacion. Esto nos permite testear con mocks, cambiar implementaciones sin tocar el codigo cliente, y desacoplar capas.

### "¿Como se comunica el gateway con el servicio Python?"
**Respuesta**: Por HTTP REST. Tenemos un cliente llamado `ClienteServicioIA` que es una clase con un `HttpClient` inyectado. Configuramos el `HttpClient` en `Program.cs` con la URL base del servicio Python (`http://servicio-ia:8000` cuando estan en Docker, `http://localhost:8000` en desarrollo). El cliente expone metodos como `Transcribir()`, `Procesar()`, `GenerarPdf()`. Cada metodo arma el request, envia y deserializa la respuesta a un DTO C#.

### "¿Que pasa si el servicio Python esta caido?"
**Respuesta**: El `HttpClient` lanza una excepcion despues del timeout configurado (90 segundos). El middleware global la atrapa y devuelve al frontend un 504 Gateway Timeout con un mensaje claro. El usuario ve "El servicio de IA no responde, reintenta en unos segundos". El sistema sigue funcionando para todo lo que no necesita IA: ver consultas anteriores, descargar documentos, gestionar pacientes.

### "¿Como funciona el sistema de permisos granulares?"
**Respuesta**: Implementamos RBAC granular. Cada rol (Medico, Admin, o roles personalizados) tiene una matriz de permisos que se guarda como JSON en la tabla `RolesDeClinica`. La estructura es modulo + accion: por ejemplo `pacientes.ver`, `pacientes.crear`, `documentos.aprobar`. Cuando generamos el JWT incluimos un claim `permiso` por cada permiso del usuario. En `Program.cs` registramos politicas de autorizacion: `options.AddPolicy("pacientes.crear", p => p.RequireClaim("permiso", "pacientes.crear"))`. Cada endpoint usa el atributo `[Authorize(Policy = "pacientes.crear")]`. ASP.NET Core hace el chequeo antes de invocar el controlador.

### "¿Como configuran CORS?"
**Respuesta**: En `Program.cs`. Definimos una politica que permite explicitamente al frontend (`http://localhost:3000`) hacer peticiones, y permitimos los metodos HTTP que usamos (GET, POST, PUT, DELETE). Tambien permitimos los headers necesarios como `Authorization` y `Content-Type`. Aplicamos la politica con `app.UseCors()` antes de `UseAuthorization`.

---

## Preguntas sobre patrones y arquitectura

### "¿Que es el patron DAO?"
**Respuesta**: Data Access Object. Es un patron donde encapsulamos todo el acceso a una tabla en una clase. En nuestro caso tenemos `UsuarioDAO`, `PacienteDAO`, `ConsultaDAO`, etc. Cada uno expone metodos como `Listar()`, `Insertar()`, `Actualizar()`, `Eliminar()`. Cada metodo invoca un stored procedure especifico. Esto centraliza todo el SQL en un solo lugar, evita duplicacion y facilita los cambios futuros.

### "¿Por que separan las interfaces (Contratos) de las implementaciones (DAO)?"
**Respuesta**: Para inyeccion de dependencias y testing. Los controladores reciben las interfaces, no las clases concretas. Esto nos permite inyectar implementaciones distintas en distintos entornos: en produccion va el DAO real, en tests podriamos inyectar un mock con datos en memoria. Tambien permite cambiar la implementacion sin tocar a los consumidores.

### "¿Que pasa si dos personas modifican el mismo paciente al mismo tiempo?"
**Respuesta**: SQL Server maneja la concurrencia con bloqueos a nivel de fila. La ultima escritura gana (last-writer-wins). Para casos donde sea critico evitar pisarse, podriamos agregar una columna `RowVersion` y validar el optimistic locking, pero para nuestro caso de uso es suficiente.

---

## Preguntas dificiles ("trampa")

### "¿Es seguro guardar el JWT en localStorage?"
**Respuesta**: Es una compensacion. localStorage es vulnerable a XSS, pero las cookies son vulnerables a CSRF. Para una aplicacion B2B como esta, donde los usuarios son medicos que controlan estrictamente quien usa la app, el riesgo XSS es manejable. Mitigamos sanitizando todo input, usando Content Security Policy (CSP), y manteniendo el JWT con expiracion corta (24 horas). Para casos de mayor riesgo se podria mover a cookies httpOnly, pero implica anadir manejo de CSRF.

### "¿Por que Microsoft eligio C# y por que ustedes en este proyecto?"
**Respuesta**: Microsoft creo C# para tener un lenguaje moderno orientado a objetos competitivo con Java pero integrado a su ecosistema Windows y Office. Para nosotros la razon es mas simple: el curso lo exige. Adicionalmente, C# es un excelente lenguaje empresarial: tipado fuerte, gran tooling, rendimiento alto, y .NET es multiplataforma desde hace 6 anos.

### "¿Y si quisieran reemplazar SQL Server por PostgreSQL?"
**Respuesta**: Habria que reescribir los stored procedures (la sintaxis cambia) y cambiar los `SqlConnection` por `NpgsqlConnection`. Como toda la logica de SQL vive solo en los DAOs, no habria que tocar los controladores ni los servicios. La separacion de capas hace que este tipo de cambios sean localizados.

---

## Si te quedas en blanco

**Frase magica**:
> "Buena pregunta. La logica especifica de eso esta en [archivo X], que es donde encapsulamos [responsabilidad]. ¿Quiere que lo abramos?"

Esto demuestra dominio de la arquitectura sin necesidad de memorizar cada metodo.

---

## Lo que NO debes decir

❌ "Es generado automatico" (suena a que no entiendes lo que copiaste).

❌ "Es estandar de la industria" (no convence sin explicar POR QUE es estandar).

❌ Confundir terminos: NO digas "Entity Framework" ni "LINQ" porque NO los usamos. Solo ADO.NET puro.

❌ "JavaScript" en lugar de "TypeScript" cuando hables del frontend.
