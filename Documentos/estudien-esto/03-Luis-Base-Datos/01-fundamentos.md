# 01. Fundamentos que debes dominar

> Conceptos basicos de bases de datos relacionales y SQL Server. Si te preguntan "que es X", debes poder responder con tus propias palabras.

---

## 1. ¿Que es una base de datos relacional?

Es una forma de **guardar informacion organizada en tablas** (filas y columnas), donde las tablas se relacionan entre si por **claves**.

**Ejemplo simple**:
- Tabla `Pacientes`: tiene un `IdPaciente` (clave primaria), nombre, DNI.
- Tabla `Consultas`: tiene un `IdConsulta` (clave primaria) y un `IdPaciente` (clave foranea que apunta a la otra tabla).

Asi, cada consulta sabe a que paciente pertenece sin duplicar los datos del paciente.

---

## 2. ¿Que es SQL Server?

Es el **motor de base de datos relacional de Microsoft**. Lo elegimos porque:
- Lo pide la rubrica del curso (es el estandar Microsoft).
- Excelente integracion con .NET y C#.
- Stored procedures muy potentes con T-SQL.
- Version gratuita (SQL Server Express) para desarrollo.

**Diferencia con MySQL/PostgreSQL**: misma idea, motor distinto. SQL Server tiene su propio dialecto de SQL llamado **T-SQL** con extensiones unicas.

---

## 3. ¿Que es T-SQL?

**T-SQL** = Transact-SQL. Es el **dialecto de SQL de Microsoft**, mas potente que el SQL estandar.

**Cosas que T-SQL puede hacer y SQL estandar no**:
- Variables (`DECLARE @variable INT`).
- Estructuras de control (`IF`, `WHILE`).
- Manejo de errores con `TRY/CATCH`.
- Stored procedures con parametros de entrada y salida.
- `CTE` (Common Table Expressions) avanzadas.
- Funciones de ventana (`ROW_NUMBER()`, `RANK()`).

---

## 4. ¿Que es una clave primaria (PK)?

Es la **columna que identifica de forma unica cada fila de una tabla**. No puede repetirse ni ser nula.

En nuestras tablas, la PK siempre es un `INT IDENTITY(1,1)` autoincremental llamado `Id<NombreTabla>`. Por ejemplo: `IdPaciente`, `IdConsulta`, `IdUsuario`.

---

## 5. ¿Que es una clave foranea (FK)?

Es una **columna que referencia la PK de otra tabla**. Garantiza que no puedan existir relaciones rotas.

**Ejemplo**: en la tabla `Consultas`, la columna `IdPaciente` es FK que apunta a `Pacientes.IdPaciente`. SQL Server no te dejara insertar una consulta con un `IdPaciente` que no existe en la tabla de pacientes.

---

## 6. ¿Que es un Stored Procedure (SP)?

Es un **conjunto de instrucciones SQL guardado dentro de la base de datos**, con un nombre. Se invoca como una funcion.

**Ejemplo**:
```sql
CREATE PROCEDURE usp_Pacientes_Listar
    @IdClinica INT
AS
BEGIN
    SELECT * FROM Pacientes WHERE IdClinica = @IdClinica AND Activo = 1
    ORDER BY Apellidos, Nombres;
END
```

**Ventajas de los SPs**:
1. **Rendimiento**: SQL Server precompila el plan de ejecucion.
2. **Seguridad**: imposible inyectar SQL si los parametros estan tipados.
3. **Centralizacion**: la logica vive en la BD, accesible desde cualquier cliente.
4. **Reuso**: el mismo SP puede ser llamado por C#, Python, o consultas manuales.
5. **Mantenibilidad**: el DBA puede tunear sin tocar codigo de aplicacion.

**Convencion de nombres en MedScribe**: `usp_<TablaPrincipal>_<Accion>`. Por ejemplo: `usp_Usuarios_ValidarCredenciales`.

---

## 7. ¿Que es una transaccion?

Es un **conjunto de operaciones que se ejecutan como una sola unidad atomica**: o todas tienen exito, o ninguna se aplica.

**Ejemplo**: cuando creamos una consulta nueva, hay que insertar:
1. Una fila en `Consultas`.
2. Multiples filas en `ValoresDeSeccionPorConsulta`.
3. Una fila en `Documentos`.
4. Una fila en `AuditoriaDeConsultas`.

Si alguno falla a la mitad, lo que ya se inserto debe revertirse. Esto se llama **rollback**.

**Sintaxis T-SQL**:
```sql
BEGIN TRY
    BEGIN TRANSACTION;
    
    INSERT INTO Consultas (...) VALUES (...);
    INSERT INTO ValoresDeSeccionPorConsulta (...) VALUES (...);
    INSERT INTO Documentos (...) VALUES (...);
    INSERT INTO AuditoriaDeConsultas (...) VALUES (...);
    
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

**Las 4 propiedades ACID que garantiza una transaccion**:
- **A**tomicidad: todo o nada.
- **C**onsistencia: la BD pasa de un estado valido a otro valido.
- **I**solamiento: las transacciones concurrentes no se interfieren.
- **D**urabilidad: una vez COMMIT, los cambios persisten incluso si se cae el servidor.

---

## 8. ¿Que es un indice?

Es una **estructura adicional que acelera las busquedas** en una tabla. Funciona como el indice de un libro: en lugar de leer todo, vas directo a donde sabes que esta.

**Sin indice**: SQL Server debe escanear toda la tabla (lento si hay millones de filas).
**Con indice**: SQL Server consulta el indice y va directo al dato (rapido).

**Donde poner indices**:
- En columnas que se usan mucho en `WHERE` o `JOIN`.
- En claves foraneas.
- En columnas usadas para ordenar (`ORDER BY`).

**En MedScribe** indexamos: `Correo` (para login rapido), `DNI` (busqueda de pacientes), `IdClinica` (multi-tenant), `IdMedico` (consultas por medico).

---

## 9. ¿Que es un Constraint?

Es una **regla** que se aplica a una columna o tabla. Si los datos no la cumplen, SQL Server los rechaza.

**Tipos en MedScribe**:
- `PRIMARY KEY`: identifica unicamente la fila.
- `FOREIGN KEY`: garantiza relaciones consistentes.
- `UNIQUE`: el valor no puede repetirse (ejemplo: `Correo` por clinica).
- `NOT NULL`: la columna es obligatoria.
- `DEFAULT`: valor por defecto si no se especifica.
- `CHECK`: regla custom (ejemplo: `Estado IN ('BORRADOR', 'APROBADA', 'ANULADA')`).

---

## 10. ¿Que es un Trigger?

Un trigger es un SP que se **dispara automaticamente** cuando ocurre un evento (INSERT, UPDATE, DELETE).

**En MedScribe NO usamos triggers explicitamente**. Toda la logica esta en SPs invocados por el codigo. Los triggers son "magicos" y dificiles de depurar.

---

## 11. ¿Que es Soft Delete?

Es una tecnica donde **NO se borran fisicamente las filas**, solo se marcan como inactivas con un campo `Activo BIT` o `EliminadoEn DATETIME`.

**Por que lo usamos**:
- En el sector salud no debes perder datos historicos.
- Permite "deshacer" eliminaciones.
- Auditoria completa.

En MedScribe, todas las tablas tienen un campo `Activo` o equivalente. Las "eliminaciones" son `UPDATE Activo = 0`.

---

## 12. ¿Que es la Auditoria?

Es el registro de **quien hizo que y cuando**. Permite saber por que la BD esta en su estado actual.

**En MedScribe**: tenemos la tabla `AuditoriaDeConsultas` que registra cada accion importante (creacion, edicion, aprobacion, anulacion) con `IdUsuario`, `Accion`, `Fecha`, `DatosAnteriores`, `DatosNuevos`.

---

## 13. ¿Que es Multi-tenant en BD?

Tenemos **muchas clinicas usando la misma BD**, pero cada clinica solo debe ver sus propios datos.

**Estrategia que usamos**: cada tabla "principal" tiene una columna `IdClinica`. Todas las queries filtran por `IdClinica = @IdClinica` (que viene del JWT del usuario).

**Alternativas (que NO usamos)**:
- BD por cliente: complicado de mantener.
- Esquemas separados: medio complicado.
- **Filtro por IdClinica** (lo que usamos): mas simple y suficiente para nuestro caso.

---

## 14. ¿Que es BCrypt en BD?

Las contrasenas no se guardan en texto plano. Se guardan **hasheadas con BCrypt**.

**En MedScribe**: la columna `ContrasenaHash` guarda el hash. El SP `usp_Usuarios_ValidarCredenciales` recibe la contrasena en claro y la compara con el hash usando funciones de BCrypt (en C# antes de llamar al SP).

---

## 15. ¿Que es JSON en SQL Server?

SQL Server 2016+ tiene soporte nativo para JSON. Permite guardar JSON como texto y consultarlo con funciones especiales (`JSON_VALUE`, `JSON_QUERY`, `OPENJSON`).

**En MedScribe**: la tabla `RolesDeClinica` tiene una columna `PermisosJSON` que guarda los permisos como JSON estructurado. Asi un rol puede tener permisos super flexibles sin necesidad de crear nuevas tablas.

**Ejemplo de PermisosJSON**:
```json
{
  "pacientes": { "ver": true, "crear": true, "editar": true, "eliminar": false },
  "consultas": { "ver": true, "crear": true, "editar": false, "eliminar": false },
  "documentos": { "ver": true, "crear": false, "editar": false, "eliminar": false }
}
```

---

## 16. Resumen de conceptos en una tabla

| Concepto | Definicion | Donde se ve en MedScribe |
|---|---|---|
| Tabla | Estructura de filas y columnas | 13 tablas en `MedScribeDB_MigracionCompleta.sql` |
| Clave primaria | Identifica unicamente cada fila | `IdPaciente`, `IdConsulta`, etc. |
| Clave foranea | Apunta a la PK de otra tabla | `IdPaciente` en `Consultas` |
| Stored procedure | Codigo SQL guardado e invocable | 45+ SPs en `storedProcedures/` |
| Transaccion | Conjunto atomico de operaciones | SPs con `BEGIN TRAN`/`COMMIT` |
| Indice | Estructura de busqueda rapida | En `Correo`, `DNI`, `IdClinica` |
| Constraint | Regla de validacion | `UNIQUE`, `CHECK`, `FOREIGN KEY` |
| Soft delete | Marcar como inactivo en lugar de borrar | Campo `Activo` en cada tabla |
| Auditoria | Registro de cambios | Tabla `AuditoriaDeConsultas` |
| Multi-tenant | Aislar clinicas | Columna `IdClinica` + filtro |
| Hash BCrypt | Almacenar contrasenas seguras | Columna `ContrasenaHash` |
| JSON nativo | Guardar estructuras flexibles | Columna `PermisosJSON` |
