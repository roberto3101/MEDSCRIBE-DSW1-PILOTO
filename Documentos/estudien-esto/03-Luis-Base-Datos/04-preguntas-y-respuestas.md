# 04. Preguntas que te pueden hacer y como responder

---

## Preguntas tecnicas (alta probabilidad)

### "¿Por que SQL Server y no MySQL o PostgreSQL?"
**Respuesta**: Por tres razones. Primero, lo pide la rubrica del curso, ya que es el motor estandar de Microsoft y se integra naturalmente con .NET. Segundo, SQL Server tiene T-SQL, un dialecto muy potente para stored procedures con manejo de errores TRY/CATCH y JSON nativo. Tercero, la version Express es gratuita y suficiente para nuestro caso.

### "¿Cuantas tablas tienen y cuales son?"
**Respuesta**: Tenemos 13 tablas: PlanesSuscripcion, Clinicas, Suscripciones, Usuarios, Medicos, Pacientes, PlantillasHistoriaClinica, SeccionesDePlantilla, Consultas, ValoresDeSeccionPorConsulta, Documentos, RolesDeClinica y AuditoriaDeConsultas. Estan organizadas en jerarquia: Clinicas es la tabla raiz del multi-tenant, y casi todas las demas tienen una FK que apunta a ella.

### "¿Por que stored procedures en lugar de queries en C#?"
**Respuesta**: Por cuatro razones. Primero, lo pide la rubrica del curso. Segundo, los SPs son mas rapidos porque SQL Server precompila el plan de ejecucion. Tercero, dan seguridad por construccion: imposible inyectar SQL si los parametros estan tipados. Cuarto, las transacciones criticas viven en SQL, no en C#, lo que mejora la atomicidad y permite al DBA optimizar sin tocar codigo de aplicacion.

### "¿Cuantos stored procedures tienen?"
**Respuesta**: Mas de 45. Estan organizados por tabla: 10 de Usuarios, 8 de Consultas, 7 de Pacientes, 6 de Documentos, 4 de Roles, 3 de Backup, 2 de Plantillas, 2 de Planes, y otros para clinicas y medicos. Cada SP tiene un proposito unico y sigue la convencion de nombres `usp_<Tabla>_<Accion>`.

### "¿Como manejan las transacciones?"
**Respuesta**: Con `BEGIN TRY / BEGIN TRANSACTION / COMMIT / END TRY / BEGIN CATCH / ROLLBACK / END CATCH`. Por ejemplo, el SP `usp_Consultas_CrearConsultaConDocumentoEnTransaccion` inserta atomicamente en 4 tablas: Consultas, ValoresDeSeccionPorConsulta, Documentos y AuditoriaDeConsultas. Si cualquier insert falla, todo se revierte y la BD queda como estaba antes. Esto cumple con las propiedades ACID.

### "¿Que es ACID?"
**Respuesta**: Son las cuatro garantias que da una transaccion. Atomicidad: o todo o nada. Consistencia: la BD pasa de un estado valido a otro valido. Isolamiento: las transacciones concurrentes no se interfieren. Durabilidad: una vez COMMIT, los datos persisten incluso si se cae el servidor. SQL Server cumple estas cuatro por defecto.

### "¿Como evitan SQL injection?"
**Respuesta**: De dos formas combinadas. Primero, todo el acceso a la BD se hace via stored procedures, no con SQL embebido en C#. Segundo, los parametros se pasan tipados, no concatenados al string. Asi, si un usuario malintencionado escribe `' OR 1=1 --` en un campo, ADO.NET lo trata como un string literal, no como codigo SQL ejecutable.

### "¿Que es multi-tenant y como lo implementan en BD?"
**Respuesta**: Significa que varias clinicas usan la misma instalacion del software sin ver los datos de las otras. Lo implementamos asi: toda tabla importante tiene una columna IdClinica como FK a la tabla Clinicas. Los stored procedures siempre reciben un parametro @IdClinica y lo usan en el WHERE de cada query. Asi una clinica fisicamente no puede leer datos de otra. El IdClinica viene del JWT del usuario, firmado por el backend.

### "¿Que tipo de relaciones tienen?"
**Respuesta**: Tenemos relaciones uno-a-muchos (una Clinica tiene muchos Usuarios), uno-a-uno (un Usuario tipo Medico tiene un perfil en Medicos), y muchos-a-muchos implicitos a traves de tablas intermedias (un paciente y un medico se relacionan a traves de Consultas). Todas las relaciones estan declaradas con FOREIGN KEY constraints, lo que garantiza integridad referencial.

### "¿Que es soft delete y por que lo usan?"
**Respuesta**: Es marcar las filas como inactivas con un campo Activo en lugar de borrarlas fisicamente. Lo usamos por dos razones: en el sector salud no se debe perder datos historicos por normativa, y permite recuperar eliminaciones accidentales. En MedScribe, las "eliminaciones" son UPDATE Activo = 0, y las consultas siempre filtran por Activo = 1.

### "¿Como guardan los permisos de los roles?"
**Respuesta**: Como JSON en la columna PermisosJSON de la tabla RolesDeClinica. SQL Server soporta JSON nativo desde 2016, podemos consultarlo con OPENJSON o JSON_VALUE. La estructura es modulo + accion: cada rol tiene un objeto donde las claves son modulos como pacientes, consultas, documentos, y los valores son objetos con las acciones ver, crear, editar, eliminar. Esto da maxima flexibilidad: la clinica crea roles personalizados sin necesidad de modificar el esquema.

### "¿Que es la tabla AuditoriaDeConsultas?"
**Respuesta**: Es el log de cambios sobre consultas. Cada vez que una consulta se crea, edita, aprueba, rechaza o anula, insertamos una fila en AuditoriaDeConsultas con quien lo hizo, cuando, los datos antes y los datos despues. Esto cumple con normativa de salud que exige trazabilidad, y permite reconstruir el historial completo de cualquier consulta.

### "¿Como guardan las contrasenas?"
**Respuesta**: Hasheadas con BCrypt en la columna ContrasenaHash. NUNCA en texto plano. BCrypt es lento a proposito, lo que dificulta ataques por fuerza bruta, y tiene salt incorporado para que dos contrasenas iguales generen hashes distintos. El hashing lo hace C# antes de pasar el valor al SP, y el SP solo guarda o compara el hash.

### "¿Que indices tienen?"
**Respuesta**: Indices en columnas que se usan mucho en busquedas: Correo de Usuarios para login rapido, DNI de Pacientes para busqueda por documento, IdClinica en todas las tablas multi-tenant para filtrado eficiente, FechaConsulta en Consultas para busquedas por rango. Las claves primarias y foraneas tienen indices automaticos por defecto.

### "¿Que constraints aplican ademas de PK y FK?"
**Respuesta**: Tenemos UNIQUE en RUC de Clinicas y en Correo + IdClinica de Usuarios. CHECK constraints en columnas Estado para garantizar que solo acepten valores validos como BORRADOR, APROBADA, ANULADA. NOT NULL en campos obligatorios. DEFAULT GETDATE() en columnas de fecha de creacion para que SQL Server las complete automaticamente.

---

## Preguntas sobre el modelo

### "¿Por que separaron Usuarios de Medicos?"
**Respuesta**: Porque no todos los usuarios son medicos. Tenemos administradores, recepcionistas y otros roles. La tabla Usuarios contiene el dato comun a todos (correo, contrasena, rol). La tabla Medicos contiene datos especificos del rol medico (especialidad, colegiatura CMP). Es una relacion uno-a-uno opcional: un Usuario puede o no tener fila en Medicos.

### "¿Por que tienen una tabla ValoresDeSeccionPorConsulta?"
**Respuesta**: Porque las plantillas son flexibles. Una plantilla SOAP tiene 4 secciones, una de Receta tiene 2, una de Historia Completa puede tener 10. En lugar de columnas fijas en Consultas, guardamos los valores como filas en ValoresDeSeccionPorConsulta, donde cada fila apunta a su seccion en la plantilla. Esto se llama modelo entidad-atributo-valor, perfecto para datos flexibles.

### "¿Como saben cual es la version actual de la nota si se edita?"
**Respuesta**: Cada vez que se edita, actualizamos la fila en ValoresDeSeccionPorConsulta y registramos la accion en AuditoriaDeConsultas con los datos antes y despues. La version "actual" es lo que esta en ValoresDeSeccionPorConsulta. El historial completo de cambios esta en la auditoria.

---

## Preguntas dificiles ("trampa")

### "¿Que pasa si dos personas editan la misma consulta al mismo tiempo?"
**Respuesta**: SQL Server maneja la concurrencia con bloqueos a nivel de fila (row-level locking). La ultima escritura gana. Si quisieramos prevenir pisarse, agregariamos una columna RowVersion (timestamp) y validariamos optimistic concurrency en cada UPDATE. Para nuestro caso de uso, donde las consultas son creadas por un solo medico a la vez, la complejidad adicional no se justifica.

### "¿Por que no usan un trigger para registrar la auditoria automaticamente?"
**Respuesta**: Lo evaluamos pero decidimos no usar triggers. Tres razones: los triggers son magicos, se ejecutan sin ser invocados explicitamente, lo que dificulta depurar; la auditoria que necesitamos requiere conocer el IdUsuario, que un trigger no tiene de forma natural; y prefiero que la auditoria sea una decision explicita del SP transaccional, no un efecto secundario oculto. Es mas verboso pero mas mantenible.

### "¿Han hecho backup alguna vez?"
**Respuesta**: En desarrollo no, porque la BD se reconstruye cuando levantamos Docker. Para produccion tenemos los SPs `usp_Backup_GenerarBackupCompleto`, `usp_Backup_GenerarBackupDiferencial` y `usp_Backup_GenerarBackupDeLog`. La estrategia recomendada es backup completo semanal + diferencial diario + log cada hora, lo que permite recuperacion punto-en-tiempo.

### "¿Y si un dia tienen 100 millones de filas en Consultas?"
**Respuesta**: La paginacion ya esta implementada con OFFSET / FETCH. Para esa escala agregariamos particionamiento por fecha en Consultas, archivariamos consultas viejas a una tabla historica fria, y revisaremos los planes de ejecucion para confirmar que los indices se usan. Tambien podriamos pasar el componente vectorial RAG a un servicio dedicado y considerar SQL Server Enterprise por sus features de paralelizacion.

---

## Si te quedas en blanco

**Frase magica**:
> "Buena pregunta. Eso lo manejamos en el SP `usp_<adivina>_<algo>`. Si quieres, lo abrimos para verlo."

Aunque inventes el nombre, dirigir a "ver el codigo" muestra dominio.

---

## Lo que NO debes decir

❌ "Triggers" — NO los usamos.

❌ "Entity Framework" o "LINQ" — NO los usamos.

❌ "MySQL" o "PostgreSQL" — es SQL Server.

❌ "Tabla en MongoDB" — MongoDB es NoSQL, no tiene tablas.

❌ "El backend hace los joins" — los joins se hacen en el SP, no en C#.
