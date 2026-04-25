# 02. Las 13 tablas explicadas

> Cada tabla con su proposito, campos clave y relaciones. Si el profe te pregunta "muestrame la tabla X", aqui esta la info.

---

## Vista global

```
PlanesSuscripcion
       │
       v
Suscripciones <─── Clinicas ───┬───> Usuarios ──> Medicos
                               │         │
                               │         v
                               │      RolesDeClinica
                               │
                               ├───> Pacientes ──> Consultas ──> ValoresDeSeccionPorConsulta
                               │                       │              │
                               │                       │              v
                               │                       │         SeccionesDePlantilla
                               │                       │              │
                               │                       v              v
                               │                  Documentos    PlantillasHistoriaClinica
                               │                       │
                               │                       v
                               └─> AuditoriaDeConsultas
```

---

## Tabla 1: PlanesSuscripcion

**Para que sirve**: catalogo de planes de pago que las clinicas pueden contratar.

**Campos clave**:
- `IdPlan` INT PK
- `Nombre` VARCHAR (BASICO, PRO, ENTERPRISE)
- `PrecioMensual` DECIMAL
- `LimiteUsuarios` INT
- `LimiteConsultasMes` INT

**Relaciones**: una clinica tiene una suscripcion con un plan.

---

## Tabla 2: Clinicas

**Para que sirve**: registro de cada clinica que usa MedScribe.

**Campos clave**:
- `IdClinica` INT PK
- `Nombre` VARCHAR
- `RUC` VARCHAR(11) UNIQUE
- `Direccion` VARCHAR
- `Telefono` VARCHAR
- `CorreoContacto` VARCHAR
- `FechaRegistro` DATETIME
- `Activa` BIT

**Es la tabla "padre" del multi-tenant**. Casi todas las demas tablas tienen una FK a `IdClinica`.

---

## Tabla 3: Suscripciones

**Para que sirve**: estado del plan contratado por una clinica.

**Campos clave**:
- `IdSuscripcion` INT PK
- `IdClinica` INT FK
- `IdPlan` INT FK
- `Estado` VARCHAR (ACTIVA, TRIAL, VENCIDA, CANCELADA)
- `FechaInicio` DATE
- `FechaFin` DATE

**Logica**: cada clinica puede tener una sola suscripcion activa, pero historicamente muchas.

---

## Tabla 4: Usuarios

**Para que sirve**: cuentas de acceso al sistema.

**Campos clave**:
- `IdUsuario` INT PK
- `IdClinica` INT FK
- `IdRolDeClinica` INT FK
- `CorreoElectronico` VARCHAR UNIQUE (por clinica)
- `ContrasenaHash` VARCHAR(255) (BCrypt)
- `TipoUsuario` VARCHAR (Administrador, Medico, Recepcionista)
- `Activo` BIT
- `FechaCreacion` DATETIME

**Importante**: el correo es UNIQUE pero por clinica. Asi `juan@correo.com` puede existir en Clinica A y Clinica B.

---

## Tabla 5: Medicos

**Para que sirve**: perfil profesional asociado a un usuario tipo Medico.

**Campos clave**:
- `IdMedico` INT PK
- `IdUsuario` INT FK
- `Nombres` VARCHAR
- `Apellidos` VARCHAR
- `Especialidad` VARCHAR (Medicina General, Pediatria, etc.)
- `ColegiaturaCMP` VARCHAR (numero del Colegio Medico del Peru)

**Relacion**: un Usuario tipo "Medico" tiene UNA fila en Medicos. Es una relacion 1-a-1 opcional.

---

## Tabla 6: Pacientes

**Para que sirve**: pacientes registrados por la clinica.

**Campos clave**:
- `IdPaciente` INT PK
- `IdClinica` INT FK
- `DNI` VARCHAR(8) UNIQUE (por clinica)
- `Nombres` VARCHAR
- `Apellidos` VARCHAR
- `FechaNacimiento` DATE
- `Sexo` CHAR(1) (M/F)
- `Telefono` VARCHAR
- `CorreoElectronico` VARCHAR
- `DireccionDomicilio` VARCHAR
- `Activo` BIT

**Validaciones**: el DNI peruano es de 8 digitos. Validamos formato antes de insertar.

---

## Tabla 7: PlantillasHistoriaClinica

**Para que sirve**: plantillas de notas clinicas que cada clinica puede personalizar.

**Campos clave**:
- `IdPlantilla` INT PK
- `IdClinica` INT FK
- `Nombre` VARCHAR (SOAP, Receta, Historia Clinica Completa)
- `Tipo` VARCHAR
- `Activa` BIT

**Cada clinica** puede tener sus propias plantillas. Hay plantillas "base" del sistema y otras personalizadas.

---

## Tabla 8: SeccionesDePlantilla

**Para que sirve**: secciones que componen una plantilla. Por ejemplo, SOAP tiene 4 secciones: Subjetivo, Objetivo, Analisis, Plan.

**Campos clave**:
- `IdSeccion` INT PK
- `IdPlantilla` INT FK
- `Titulo` VARCHAR
- `Orden` INT (en que orden aparece)
- `Obligatoria` BIT
- `InstruccionParaIA` TEXT (que debe rellenar la IA aqui)

**Las instrucciones para la IA** se incluyen en el prompt al LLM para guiar la generacion.

---

## Tabla 9: Consultas

**Para que sirve**: registro de cada consulta medica realizada.

**Campos clave**:
- `IdConsulta` INT PK
- `IdMedico` INT FK
- `IdPaciente` INT FK
- `IdPlantilla` INT FK
- `FechaConsulta` DATETIME
- `Estado` VARCHAR (BORRADOR, EN_PROCESO, APROBADA, ANULADA)
- `MotivoConsulta` VARCHAR
- `IdUsuarioCreador` INT
- `FechaCreacion` DATETIME
- `FechaAprobacion` DATETIME

**Constraint CHECK** en `Estado` para garantizar que solo acepta valores validos.

---

## Tabla 10: ValoresDeSeccionPorConsulta

**Para que sirve**: lo que la IA o el medico llenaron en cada seccion de la nota.

**Campos clave**:
- `IdValor` INT PK
- `IdConsulta` INT FK
- `IdSeccion` INT FK
- `Contenido` TEXT
- `EditadoPorMedico` BIT (true si el medico modifico lo de la IA)

**Estructura clave-valor**: una consulta tiene N valores, uno por cada seccion de la plantilla elegida.

---

## Tabla 11: Documentos

**Para que sirve**: PDFs y Words generados a partir de las consultas.

**Campos clave**:
- `IdDocumento` INT PK
- `IdConsulta` INT FK
- `TipoArchivo` VARCHAR (PDF, DOCX)
- `NombreArchivo` VARCHAR
- `RutaArchivo` VARCHAR (path en disco)
- `EstadoAprobacion` VARCHAR (PENDIENTE, APROBADO, RECHAZADO)
- `FechaGeneracion` DATETIME
- `IdUsuarioAprobador` INT
- `FechaAprobacion` DATETIME

**Una consulta** puede generar 2 documentos (PDF + Word). Cada uno con su estado de aprobacion.

---

## Tabla 12: RolesDeClinica

**Para que sirve**: roles personalizados con permisos granulares.

**Campos clave**:
- `IdRol` INT PK
- `IdClinica` INT FK
- `Nombre` VARCHAR (Medico, Admin, Recepcionista, ...)
- `PermisosJSON` NVARCHAR(MAX) (JSON con permisos por modulo y accion)
- `Activo` BIT

**El JSON de permisos**:
```json
{
  "pacientes": {"ver": true, "crear": true, "editar": true, "eliminar": false},
  "consultas": {"ver": true, "crear": true, "editar": true, "eliminar": false},
  "documentos": {"ver": true, "crear": false, "editar": false, "eliminar": false},
  "configuracion": {"ver": false, "crear": false, "editar": false, "eliminar": false},
  "usuarios": {"ver": false, "crear": false, "editar": false, "eliminar": false},
  "roles": {"ver": false, "crear": false, "editar": false, "eliminar": false}
}
```

**Cada clinica** puede crear sus propios roles ademas de los predeterminados.

---

## Tabla 13: AuditoriaDeConsultas

**Para que sirve**: log de todas las acciones criticas sobre consultas.

**Campos clave**:
- `IdAuditoria` INT PK
- `IdConsulta` INT FK
- `IdUsuario` INT (quien hizo la accion)
- `Accion` VARCHAR (CREADA, EDITADA, APROBADA, RECHAZADA, ANULADA)
- `FechaHora` DATETIME
- `DatosAnteriores` NVARCHAR(MAX) (JSON del estado previo)
- `DatosNuevos` NVARCHAR(MAX) (JSON del estado nuevo)
- `IpOrigen` VARCHAR (de donde vino la peticion)

**Para que sirve**: cumplir con normativa de salud que exige trazabilidad de cambios.

---

## Diagramas que debes mirar antes de presentar

1. **Modelo Entidad-Relacion** (figura 4): vista grafica de las 13 tablas y sus relaciones.
2. **Diagrama de Clases** (figura 3): version mas conceptual.
3. **Diagrama de Estados** (figura 10): ciclo de vida de una consulta.

Los tres estan en `Documentos/Tecnico/Diagramas/` o renderizados en el HTML.

---

## Lo que debes saber recitar de memoria

**Las 13 tablas en orden**:
1. PlanesSuscripcion
2. Clinicas
3. Suscripciones
4. Usuarios
5. Medicos
6. Pacientes
7. PlantillasHistoriaClinica
8. SeccionesDePlantilla
9. Consultas
10. ValoresDeSeccionPorConsulta
11. Documentos
12. RolesDeClinica
13. AuditoriaDeConsultas

**Mnemotecnia**: "Plan Clinica Suscribe Usuario Medico Paciente Plantilla Seccion Consulta Valor Documento Rol Auditoria" (PCSUM-PPSCV-DRA).
