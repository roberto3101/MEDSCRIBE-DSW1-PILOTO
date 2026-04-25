# 03. Flujos clave del backend

> Tres flujos que vale la pena dominar a profundidad. Si entiendes estos, entiendes como funciona todo el gateway.

---

## Flujo 1: Login completo (la cadena de autenticacion)

```
[Frontend manda POST /api/autenticacion/iniciar-sesion con {correo, contrasena}]
                            │
                            v
[Middleware ASP.NET Core enruta a AutenticacionControlador.IniciarSesion(peticion)]
                            │
                            v
[ASP.NET valida automaticamente DataAnnotations -> ModelState.IsValid]
                            │
                            v
[Controlador llama _usuarioDao.ValidarCredenciales(correo, contrasena)]
                            │
                            v
[UsuarioDAO ejecuta SP usp_Usuarios_ValidarCredenciales]
                            │
                            v
[SQL Server: BCrypt.Verify(contrasena, hash_guardado) + carga permisos]
                            │
                            v
[SP devuelve usuario + permisos JSON o NULL si invalido]
                            │
                            v
[Si valido: controlador genera JWT con claims (id_usuario, id_clinica, rol, permisos)]
                            │
                            v
[JWT firmado con HMAC SHA256 usando la clave secreta de appsettings.json]
                            │
                            v
[Devuelve 200 OK con {token, usuario, permisos}]
                            │
                            v
[Si invalido: devuelve 401 Unauthorized con mensaje generico]
```

**Codigo clave (simplificado)**:
```csharp
[HttpPost("iniciar-sesion")]
public async Task<IActionResult> IniciarSesion([FromBody] InicioSesionPeticion peticion)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var usuario = await _usuarioDao.ValidarCredenciales(peticion.Correo, peticion.Contrasena);
    if (usuario == null)
        return Unauthorized(new { mensaje = "Correo o contrasena incorrectos" });

    var token = GenerarJwt(usuario);
    return Ok(new { token, usuario });
}
```

**Por que es importante**: este es el flujo que valida toda la rubrica de autenticacion del curso (4 puntos). Si lo dominas, ganas la categoria.

---

## Flujo 2: Crear consulta desde audio (orquestacion completa)

Este es el flujo mas complejo del sistema. Involucra el frontend, el gateway, el servicio IA y la base de datos.

```
[Frontend manda POST /api/consultas con audio + idPaciente]
                            │
                            v
[ConsultaControlador.CrearConsulta(peticion) — incluye [Authorize]]
                            │
                            v
[Middleware ya valido JWT y poblo HttpContext.User con los claims]
                            │
                            v
[ProveedorContextoClinica extrae clinic_id del JWT]
                            │
                            v
[Validar permiso: usuario tiene "consultas.crear"]
                            │
                            v
[Llamar _clienteServicioIA.Transcribir(audio) — HTTP POST a servicio Python]
                            │
                            v
[Servicio IA devuelve transcripcion estructurada con oradores]
                            │
                            v
[Llamar _clienteServicioIA.Procesar(transcripcion, contextoPaciente)]
                            │
                            v
[Servicio IA devuelve nota clinica JSON estructurada SOAP]
                            │
                            v
[Llamar _consultaDao.CrearConsultaConDocumento(idClinica, idMedico, idPaciente, nota)]
                            │
                            v
[ConsultaDAO ejecuta SP usp_Consultas_CrearConsultaConDocumentoEnTransaccion]
                            │
                            v
[SQL Server inserta en 3 tablas en una transaccion: Consultas + ValoresDeSeccion + Documentos]
                            │
                            v
[Si todo OK, llamar _clienteServicioIA.GenerarPdf y GenerarWord]
                            │
                            v
[Servicio IA devuelve rutas de archivos]
                            │
                            v
[Devolver al frontend: 201 Created con la consulta + rutas de descarga]
```

**Manejo de errores**:
- Si el audio es invalido: 422 con mensaje del servicio IA.
- Si el servicio IA tarda mas de 90s: 504 Gateway Timeout.
- Si el SP falla: rollback automatico, devolver 500.
- Si la generacion de PDF falla: la consulta queda guardada, se notifica para regenerar despues.

**Codigo clave (simplificado)**:
```csharp
[HttpPost]
[Authorize(Policy = "consultas.crear")]
public async Task<IActionResult> CrearConsulta([FromForm] CrearConsultaPeticion peticion)
{
    var idClinica = _contextoClinica.IdClinicaActual;
    
    var transcripcion = await _clienteServicioIA.Transcribir(peticion.Audio);
    var nota = await _clienteServicioIA.Procesar(transcripcion, peticion.IdPaciente);
    var idConsulta = await _consultaDao.CrearConsultaConDocumento(idClinica, peticion.IdMedico, peticion.IdPaciente, nota);
    
    var rutaPdf = await _clienteServicioIA.GenerarPdf(nota, peticion.IdPaciente);
    var rutaWord = await _clienteServicioIA.GenerarWord(nota, peticion.IdPaciente);
    
    return CreatedAtAction(nameof(ObtenerConsulta), new { id = idConsulta },
        new { idConsulta, rutaPdf, rutaWord });
}
```

---

## Flujo 3: Multi-tenant en accion

**Escenario**: el doctor Juan, de la "Clinica San Pablo", quiere ver sus pacientes. NO debe poder ver pacientes de la "Clinica Santa Maria".

```
[Doctor Juan se loguea — JWT incluye clinic_id=42]
                            │
                            v
[Frontend manda GET /api/pacientes con header Authorization: Bearer <jwt>]
                            │
                            v
[Middleware JWT valida token y puebla HttpContext.User con claims]
                            │
                            v
[ProveedorContextoClinica.IdClinicaActual = 42]
                            │
                            v
[PacienteControlador.Listar() invoca _pacienteDao.Listar(42)]
                            │
                            v
[PacienteDAO ejecuta SP usp_Pacientes_Listar @IdClinica=42]
                            │
                            v
[SQL Server: SELECT * FROM Pacientes WHERE IdClinica = 42]
                            │
                            v
[Devuelve solo pacientes de Clinica San Pablo]
```

**Lo importante**: la clinica NO viene en el body de la peticion. Viene del JWT, que firmamos nosotros y nadie puede modificar. Por eso es seguro.

**Si un atacante intenta enviar `?idClinica=99` en la URL**, el sistema lo ignora. Solo confiamos en el JWT.

---

## Flujo bonus: chequeo de permisos granular

Cada endpoint tiene un atributo que indica que permiso requiere:

```csharp
[Authorize(Policy = "pacientes.crear")]
public async Task<IActionResult> CrearPaciente(...) { ... }
```

Esto se configura en `Program.cs`:

```csharp
builder.Services.AddAuthorization(options => {
    options.AddPolicy("pacientes.crear", p => p.RequireClaim("permiso", "pacientes.crear"));
    options.AddPolicy("pacientes.eliminar", p => p.RequireClaim("permiso", "pacientes.eliminar"));
    // ...etc
});
```

Cuando generamos el JWT, incluimos un claim `permiso` por cada permiso que tiene el usuario. ASP.NET Core hace el chequeo automaticamente.

Si el usuario intenta acceder a un endpoint sin el permiso, recibe **403 Forbidden** sin que el controlador siquiera se ejecute.

---

## Resumen visual de patrones

```
┌──────────────────────────────────┐
│  Controlador                     │
│  - Valida ModelState             │
│  - Chequea permisos              │
│  - Orquesta servicios y DAOs     │
└─────────────┬────────────────────┘
              │
      ┌───────┴───────┐
      │               │
      v               v
┌──────────┐    ┌──────────────────┐
│ Servicio │    │ DAO              │
│ (logica) │    │ (datos)          │
└──────────┘    └────┬─────────────┘
                     │
                     v
                ┌────────────┐
                │ SP en BD   │
                │ (negocio)  │
                └────────────┘
```

**El controlador NO toca SQL. El DAO NO tiene logica de negocio. La logica transaccional vive en los SP.** Cada capa tiene una responsabilidad clara.
