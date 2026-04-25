# 03. Stored Procedures principales

> Tenemos mas de 45 SPs. Aqui los mas importantes con explicacion. Los demas siguen patrones similares.

---

## Convencion de nombres

`usp_<TablaPrincipal>_<Accion>[Modificador]`

Ejemplos:
- `usp_Usuarios_ValidarCredenciales`
- `usp_Consultas_CrearConsultaConDocumentoEnTransaccion`
- `usp_Pacientes_BuscarPorDocumento`

**El prefijo `usp_`** distingue los SPs propios del sistema de los `sp_` que SQL Server reserva para SPs internos.

---

## Categoria 1: Usuarios y Autenticacion

### `usp_Usuarios_ValidarCredenciales`
**Que hace**: el SP de login. Valida correo + contrasena y devuelve los datos del usuario con sus permisos.

**Entrada**: `@Correo VARCHAR`, `@ContrasenaHash VARCHAR` (ya hasheado por C#).

**Salida**: SELECT con datos del usuario, su rol y el JSON de permisos. NULL si invalido.

**Por que es clave**: es el primer SP que se ejecuta en cada sesion de usuario. Vale 4 puntos en la rubrica.

### `usp_Usuarios_RegistrarMedicoConUsuarioEnTransaccion`
**Que hace**: crea un usuario tipo Medico Y su perfil profesional en una sola transaccion atomica.

**Por que es transaccional**: si crearamos primero el usuario y la creacion del medico fallara, quedariamos con un usuario huerfano sin perfil.

### `usp_Usuarios_BuscarPorCorreo`
**Que hace**: busca un usuario por correo (para validar que no exista al registrar).

### `usp_Usuarios_CambiarContrasena`
**Que hace**: actualiza el `ContrasenaHash` despues de validar la contrasena anterior.

### `usp_Usuarios_ObtenerPermisosCompletos`
**Que hace**: devuelve el JSON de permisos del usuario, combinando los del rol + permisos personalizados.

### `usp_Usuarios_ListarPorClinica`
**Que hace**: lista todos los usuarios de la clinica activa para el modulo de gestion.

### `usp_Usuarios_ActualizarPermisosPersonalizados`
**Que hace**: permite al admin dar permisos extra a un usuario especifico, mas alla de su rol.

---

## Categoria 2: Pacientes

### `usp_Pacientes_Listar`
**Que hace**: lista paginada de pacientes de la clinica activa, con filtros opcionales (DNI, nombre).

**Patron de paginacion**:
```sql
ORDER BY Apellidos, Nombres
OFFSET @Pagina * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;
```

### `usp_Pacientes_Insertar`
**Que hace**: crea un paciente nuevo. Valida que el DNI no exista en la clinica.

### `usp_Pacientes_Actualizar`
**Que hace**: actualiza datos de un paciente.

### `usp_Pacientes_BuscarPorDocumento`
**Que hace**: busca rapido por DNI (para autocompletado al crear consulta).

### `usp_Pacientes_Buscar`
**Que hace**: busca por id.

### `usp_Pacientes_Eliminar`
**Que hace**: soft delete (`UPDATE Activo = 0`).

---

## Categoria 3: Consultas (los SPs mas complejos)

### `usp_Consultas_CrearConsultaConDocumentoEnTransaccion` ⭐ ARCHIVO CLAVE
**Que hace**: crea una consulta nueva insertando atomicamente en 4 tablas:
1. `Consultas`
2. `ValoresDeSeccionPorConsulta` (multiples filas, una por seccion)
3. `Documentos` (referencias a PDF y Word)
4. `AuditoriaDeConsultas`

**Estructura del SP**:
```sql
CREATE PROCEDURE usp_Consultas_CrearConsultaConDocumentoEnTransaccion
    @IdMedico INT,
    @IdPaciente INT,
    @IdPlantilla INT,
    @MotivoConsulta NVARCHAR(500),
    @ValoresJSON NVARCHAR(MAX),  -- valores de las secciones como JSON
    @RutaPdf VARCHAR(500),
    @RutaWord VARCHAR(500),
    @IdUsuarioCreador INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdConsulta INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 1. Insertar consulta
        INSERT INTO Consultas (IdMedico, IdPaciente, IdPlantilla, MotivoConsulta, Estado, FechaConsulta, IdUsuarioCreador)
        VALUES (@IdMedico, @IdPaciente, @IdPlantilla, @MotivoConsulta, 'BORRADOR', GETDATE(), @IdUsuarioCreador);
        
        SET @IdConsulta = SCOPE_IDENTITY();
        
        -- 2. Insertar valores de secciones desde el JSON
        INSERT INTO ValoresDeSeccionPorConsulta (IdConsulta, IdSeccion, Contenido)
        SELECT @IdConsulta, IdSeccion, Contenido
        FROM OPENJSON(@ValoresJSON) WITH (
            IdSeccion INT '$.idSeccion',
            Contenido NVARCHAR(MAX) '$.contenido'
        );
        
        -- 3. Insertar documentos PDF y Word
        INSERT INTO Documentos (IdConsulta, TipoArchivo, RutaArchivo, EstadoAprobacion, FechaGeneracion)
        VALUES 
            (@IdConsulta, 'PDF', @RutaPdf, 'PENDIENTE', GETDATE()),
            (@IdConsulta, 'DOCX', @RutaWord, 'PENDIENTE', GETDATE());
        
        -- 4. Auditoria
        INSERT INTO AuditoriaDeConsultas (IdConsulta, IdUsuario, Accion, FechaHora)
        VALUES (@IdConsulta, @IdUsuarioCreador, 'CREADA', GETDATE());
        
        COMMIT TRANSACTION;
        
        -- Devolver el ID generado
        SELECT @IdConsulta AS IdConsulta;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;  -- relanza el error a C#
    END CATCH;
END
```

**Por que es importante**: este SP es el ejemplo perfecto del valor de los SPs transaccionales. Si lo hicieramos en C# con multiples queries, seria mas lento y mas propenso a errores.

### `usp_Consultas_AprobarConsultaYDocumentosEnTransaccion`
**Que hace**: aprueba una consulta Y todos sus documentos atomicamente.

**Pasos**:
1. Update Consultas SET Estado = 'APROBADA'.
2. Update Documentos SET EstadoAprobacion = 'APROBADO' WHERE IdConsulta = X.
3. Insert AuditoriaDeConsultas con accion 'APROBADA'.

### `usp_Consultas_RechazarConsultaYDocumentosEnTransaccion`
**Que hace**: lo opuesto a aprobar.

### `usp_Consultas_Listar`
**Que hace**: lista paginada con filtros (paciente, fecha, estado).

### `usp_Consultas_Buscar`
**Que hace**: trae el detalle completo de una consulta con sus valores y documentos.

### `usp_Consultas_ActualizarEstado`
**Que hace**: cambia el estado (validando transiciones permitidas).

### `usp_Consultas_RegistrarCompleta`
**Que hace**: alternativa al `CrearConsultaConDocumento` para casos donde la nota viene completa.

### `usp_Consultas_Insertar`
**Que hace**: SP simple de insercion, usado internamente.

---

## Categoria 4: Documentos

### `usp_Documentos_AprobarPorConsulta`
**Que hace**: aprueba todos los documentos de una consulta a la vez.

### `usp_Documentos_PorConsulta`
**Que hace**: lista los documentos asociados a una consulta.

### `usp_Documentos_Listar`, `_Buscar`, `_Insertar`, `_ActualizarEstado`
**Que hacen**: CRUD basico.

---

## Categoria 5: Roles y Permisos

### `usp_Roles_Crear`
**Que hace**: crea un rol nuevo con su matriz de permisos JSON.

### `usp_Roles_Actualizar`
**Que hace**: actualiza el JSON de permisos de un rol existente.

### `usp_Roles_ListarPorClinica`
**Que hace**: lista los roles disponibles en la clinica activa.

### `usp_Roles_CambiarEstado`
**Que hace**: activa o desactiva un rol.

---

## Categoria 6: Plantillas

### `usp_Plantillas_ListarPorClinica`
**Que hace**: lista las plantillas que la clinica activa tiene disponibles.

### `usp_Plantillas_ObtenerSeccionesPorPlantilla`
**Que hace**: trae las secciones de una plantilla especifica (lo usa la IA para saber que rellenar).

---

## Categoria 7: Suscripciones y Planes

### `usp_Planes_Listar`, `usp_Planes_Buscar`
**Que hacen**: catalogo de planes disponibles.

### `usp_Clinicas_RegistrarClinicaCompletaEnTransaccion`
**Que hace**: registro inicial de una clinica nueva. Crea atomicamente:
1. Fila en `Clinicas`.
2. Fila en `Suscripciones` (con plan TRIAL).
3. Fila en `Usuarios` (admin inicial).
4. Fila en `RolesDeClinica` (roles base: Admin, Medico).

---

## Categoria 8: Backups

### `usp_Backup_GenerarBackupCompleto`
**Que hace**: dispara un backup completo de la BD.

### `usp_Backup_GenerarBackupDiferencial`
**Que hace**: backup solo de cambios desde el ultimo completo.

### `usp_Backup_GenerarBackupDeLog`
**Que hace**: backup del transaction log para recuperacion punto-en-tiempo.

**Por que importan**: en salud no se puede perder datos. Estrategia tipica: backup completo semanal + diferencial diario + log cada hora.

---

## Patrones que se repiten en todos los SPs

### Patron 1: Manejo de errores
```sql
BEGIN TRY
    BEGIN TRANSACTION;
    -- operaciones
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

### Patron 2: SET NOCOUNT ON
Al inicio de cada SP. Evita que SQL Server devuelva mensajes de "filas afectadas" que confunden a los clientes.

### Patron 3: SCOPE_IDENTITY()
Despues de un INSERT, recuperamos el ID autogenerado para usarlo en operaciones posteriores.

### Patron 4: Validacion previa
```sql
IF NOT EXISTS (SELECT 1 FROM Pacientes WHERE IdPaciente = @IdPaciente)
BEGIN
    RAISERROR('Paciente no encontrado', 16, 1);
    RETURN;
END
```

### Patron 5: Filtro multi-tenant
Todos los SPs que tocan tablas con `IdClinica` reciben ese parametro y lo usan en el WHERE.

---

## Donde encontrar todos los SPs

```
base-datos/storedProcedures/
├── usp_Backup_*.sql            (3 archivos)
├── usp_Clinicas_*.sql          (1 archivo)
├── usp_Consultas_*.sql         (8 archivos)
├── usp_Documentos_*.sql        (6 archivos)
├── usp_EstablecerContexto*.sql (1 archivo)
├── usp_Medicos_*.sql           (1 archivo)
├── usp_Pacientes_*.sql         (7 archivos)
├── usp_Planes_*.sql            (2 archivos)
├── usp_Plantillas_*.sql        (2 archivos)
├── usp_Roles_*.sql             (4 archivos)
└── usp_Usuarios_*.sql          (10 archivos)
```

**Total: 45 archivos .sql**, cada uno con un SP independiente.
