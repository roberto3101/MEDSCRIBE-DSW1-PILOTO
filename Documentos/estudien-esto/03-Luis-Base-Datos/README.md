# GUIA DE ESTUDIO - Luis Joel Curi
## Tema: Base de Datos en SQL Server

> Esta carpeta contiene todo lo que necesitas saber para presentar tu parte. Lee los archivos en orden.

## Tu mision el dia de la presentacion

Vas a explicar **el corazon de los datos del sistema**: la base de datos SQL Server con sus 13 tablas, mas de 45 stored procedures, transacciones atomicas y sistema de auditoria. Tu parte es la mas critica para la integridad del sistema: si la BD falla o esta mal disenada, todo lo demas se cae.

## Tu codigo vive en

```
base-datos/
├── migraciones/
│   └── MedScribeDB_MigracionCompleta.sql       <- DDL completo
└── storedProcedures/                            <- 45+ archivos .sql
    ├── usp_Usuarios_*.sql
    ├── usp_Pacientes_*.sql
    ├── usp_Consultas_*.sql
    ├── usp_Documentos_*.sql
    ├── usp_Roles_*.sql
    ├── usp_Plantillas_*.sql
    ├── usp_Planes_*.sql
    ├── usp_Backup_*.sql
    └── usp_Clinicas_*.sql
```

## Archivos en esta carpeta

| Archivo | Que aprenderas | Cuando leerlo |
|---|---|---|
| `01-fundamentos.md` | Que es SQL Server, T-SQL, stored procedure, transaccion, indice, en lenguaje simple | PRIMERO |
| `02-recorrido-tablas.md` | Las 13 tablas explicadas: campos, claves, relaciones | SEGUNDO |
| `03-stored-procedures.md` | Los SPs mas importantes con su explicacion | TERCERO |
| `04-preguntas-y-respuestas.md` | Lo que el profe puede preguntarte y como responder | ANTES DE PRESENTAR |
| `05-guion-presentacion.md` | Tu guion de 5 minutos palabra por palabra | EL DIA ANTES |

## Tiempo estimado de estudio

- Lectura completa: 2 horas
- Memorizar nombres de las 13 tablas: 30 minutos
- Practicar exposicion en voz alta: 3 veces (15 min cada una)

**Total: 3 horas** distribuidas en 2-3 dias.

## Tu archivo clave

Si tienes que abrir un solo archivo en la demo, abre:
- **`base-datos/storedProcedures/usp_Consultas_CrearConsultaConDocumentoEnTransaccion.sql`** - el SP transaccional mas representativo. Muestra TRY/CATCH, BEGIN TRAN/COMMIT/ROLLBACK y el patron atomico.

## Tu mensaje principal

Si el profesor te pregunta "en una frase, que hiciste tu":

> "Disene e implemente la base de datos en SQL Server: 13 tablas relacionales con integridad referencial, mas de 45 stored procedures que encapsulan toda la logica de datos, transacciones atomicas para operaciones criticas, sistema de auditoria, soft delete, y constraints que garantizan la calidad de los datos clinicos."

## Lo que debes evitar

- NO digas "MySQL" o "PostgreSQL". Es **SQL Server Express**.
- NO digas "tablas con LINQ". NO usamos LINQ ni Entity Framework. Son SPs llamados con ADO.NET.
- NO confundas "stored procedure" con "trigger". El SP se invoca explicitamente; el trigger se dispara solo.
