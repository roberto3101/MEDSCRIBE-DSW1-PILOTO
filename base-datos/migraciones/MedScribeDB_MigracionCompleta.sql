IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MedScribeDB')
BEGIN
    CREATE DATABASE MedScribeDB;
END
GO

USE MedScribeDB;
GO

IF OBJECT_ID('dbo.PlanesSuscripcion', 'U') IS NOT NULL
BEGIN
    PRINT 'Base de datos ya inicializada. Saltando creacion de tablas.';
    SET NOEXEC ON;
END
GO

-- =============================================================================
-- MEDSCRIBE AI - MULTITENANT SaaS
-- Motor: SQL Server 2022
-- Modelo: Shared Database, Shared Schema
-- Aislamiento: Row Level Security (RLS) con SESSION_CONTEXT
-- =============================================================================
--
-- PRINCIPIOS DE DISEÑO:
--
--   1.  IdClinica en TODAS las tablas → Aislamiento logico por clinica/empresa.
--
--   2.  Row Level Security (RLS) → SQL Server filtra automaticamente por
--       IdClinica usando SESSION_CONTEXT. El backend NO necesita WHERE.
--
--   3.  El backend solo ejecuta:
--       EXEC sp_set_session_context @key = N'IdClinica', @value = @IdClinica
--       al abrir conexion. Todas las queries se filtran solas.
--
--   4.  FKs compuestas (IdClinica, ref_id) → Garantizan que un registro
--       no referencie datos de otra clinica.
--
--   5.  Soft deletes (FechaEliminacion) → Los documentos clinicos no se
--       borran fisicamente por normativa de salud.
--
--   6.  Plantillas de historia clinica configurables por clinica →
--       Cada clinica define sus secciones y campos.
--
--   7.  Tabla de planes global (sin IdClinica) → Catalogo unico para todos.
--
-- =============================================================================


-- =============================================================================
-- 1. PLANES DE SUSCRIPCION (GLOBAL - sin IdClinica)
-- =============================================================================

CREATE TABLE PlanesSuscripcion (
    IdPlan                          INT IDENTITY(1,1) PRIMARY KEY,
    CodigoDelPlan                   VARCHAR(20) NOT NULL UNIQUE,
    NombreDelPlan                   VARCHAR(50) NOT NULL,
    DescripcionDelPlan              VARCHAR(500) NULL,
    PrecioMensualEnSoles            DECIMAL(10,2) NOT NULL DEFAULT 0,
    PrecioAnualEnSoles              DECIMAL(10,2) NULL,
    MaximoDeSedesPermitidas         INT NOT NULL DEFAULT 1,
    MaximoDeUsuariosPermitidos      INT NOT NULL DEFAULT 1,
    MaximoDeConsultasPorMes         INT NOT NULL DEFAULT 100,
    MaximoDeMedicosPorClinica       INT NOT NULL DEFAULT 1,
    PermiteGenerarWord              BIT NOT NULL DEFAULT 0,
    PermiteModoVerificacion         BIT NOT NULL DEFAULT 0,
    PermitePersonalizarPlantillas   BIT NOT NULL DEFAULT 0,
    PermiteSoportePrioritario       BIT NOT NULL DEFAULT 0,
    AlmacenamientoMaximoEnMB        INT NOT NULL DEFAULT 500,
    OrdenDeVisualizacion            INT NOT NULL DEFAULT 0,
    EstaPlanActivo                  BIT NOT NULL DEFAULT 1,
    FechaCreacion                   DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================================================
-- 2. CLINICAS (TENANT)
-- =============================================================================

CREATE TABLE Clinicas (
    IdClinica                       INT IDENTITY(1,1) PRIMARY KEY,
    RazonSocial                     VARCHAR(200) NOT NULL,
    RucDeLaClinica                  VARCHAR(11) NOT NULL UNIQUE,
    NombreComercial                 VARCHAR(200) NULL,
    DireccionLegal                  VARCHAR(300) NULL,
    Departamento                    VARCHAR(50) NULL,
    Provincia                       VARCHAR(50) NULL,
    Distrito                        VARCHAR(50) NULL,
    TelefonoPrincipal               VARCHAR(20) NULL,
    CorreoDeContacto                VARCHAR(150) NULL,
    LogoUrl                         VARCHAR(500) NULL,
    SlugPublico                     VARCHAR(100) NOT NULL UNIQUE,
    ColorPrimario                   VARCHAR(7) DEFAULT '#1a56db',
    PlazoRespuestaDias              INT NOT NULL DEFAULT 15,
    NotificarPorCorreo              BIT NOT NULL DEFAULT 1,
    EstaClinicaActiva               BIT NOT NULL DEFAULT 1,
    FechaRegistroEnSistema          DATETIME NOT NULL DEFAULT GETDATE(),
    FechaActualizacion              DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================================================
-- 3. SUSCRIPCIONES
-- =============================================================================

CREATE TABLE Suscripciones (
    IdClinica                       INT NOT NULL,
    IdSuscripcion                   INT IDENTITY(1,1),
    IdPlan                          INT NOT NULL,
    EstadoDeLaSuscripcion           VARCHAR(20) NOT NULL DEFAULT 'ACTIVA'
        CONSTRAINT CK_Suscripciones_Estado CHECK (EstadoDeLaSuscripcion IN ('ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'TRIAL', 'VENCIDA')),
    CicloDeFacturacion              VARCHAR(10) NOT NULL DEFAULT 'MENSUAL'
        CONSTRAINT CK_Suscripciones_Ciclo CHECK (CicloDeFacturacion IN ('MENSUAL', 'ANUAL')),
    FechaInicio                     DATETIME NOT NULL DEFAULT GETDATE(),
    FechaFin                        DATETIME NULL,
    FechaProximoCobro               DATE NULL,
    EsTrial                         BIT NOT NULL DEFAULT 0,
    DiasDelTrial                    INT DEFAULT 0,
    FechaFinDelTrial                DATE NULL,
    OverrideMaxSedes                INT NULL,
    OverrideMaxUsuarios             INT NULL,
    OverrideMaxConsultas            INT NULL,
    OverrideMaxMedicos              INT NULL,
    FechaCreacion                   DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Suscripciones PRIMARY KEY (IdClinica, IdSuscripcion),
    CONSTRAINT FK_Suscripciones_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica),
    CONSTRAINT FK_Suscripciones_Plan FOREIGN KEY (IdPlan) REFERENCES PlanesSuscripcion(IdPlan)
);
GO

CREATE INDEX IX_Suscripciones_Activa ON Suscripciones (IdClinica, EstadoDeLaSuscripcion)
    WHERE EstadoDeLaSuscripcion IN ('ACTIVA', 'TRIAL');
GO

-- =============================================================================
-- 4. USUARIOS (MULTITENANT)
-- =============================================================================

CREATE TABLE Usuarios (
    IdClinica                       INT NOT NULL,
    IdUsuario                       INT IDENTITY(1,1),
    NombreCompleto                  VARCHAR(100) NOT NULL,
    CorreoElectronico               VARCHAR(150) NOT NULL,
    ContrasenaHasheada              VARCHAR(255) NOT NULL,
    RolDelSistema                   VARCHAR(20) NOT NULL DEFAULT 'Medico'
        CONSTRAINT CK_Usuarios_Rol CHECK (RolDelSistema IN ('Administrador', 'Medico', 'Recepcionista')),
    EstaCuentaActiva                BIT NOT NULL DEFAULT 1,
    DebeCambiarContrasena           BIT NOT NULL DEFAULT 1,
    IdRol                           INT NULL,
    FotoPerfilUrl                   VARCHAR(500) NULL,
    UltimoAcceso                    DATETIME NULL,
    FechaRegistroEnSistema          DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Usuarios PRIMARY KEY (IdClinica, IdUsuario),
    CONSTRAINT FK_Usuarios_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
);
GO

CREATE UNIQUE INDEX IX_Usuarios_CorreoPorClinica ON Usuarios (IdClinica, CorreoElectronico);
GO

-- =============================================================================
-- 5. MEDICOS (MULTITENANT)
-- =============================================================================

CREATE TABLE Medicos (
    IdClinica                       INT NOT NULL,
    IdMedico                        INT IDENTITY(1,1),
    IdUsuarioVinculado              INT NOT NULL,
    NombreDelMedico                 VARCHAR(100) NOT NULL,
    ApellidoDelMedico               VARCHAR(100) NOT NULL,
    EspecialidadMedica              VARCHAR(100) NOT NULL,
    NumeroColegiaturaDelPeru        VARCHAR(20) NOT NULL,
    TelefonoDeContacto              VARCHAR(20) NULL,
    EstaMedicoActivo                BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_Medicos PRIMARY KEY (IdClinica, IdMedico),
    CONSTRAINT FK_Medicos_Usuario FOREIGN KEY (IdClinica, IdUsuarioVinculado) REFERENCES Usuarios(IdClinica, IdUsuario)
);
GO

-- =============================================================================
-- 6. PACIENTES (MULTITENANT)
-- =============================================================================

CREATE TABLE Pacientes (
    IdClinica                       INT NOT NULL,
    IdPaciente                      INT IDENTITY(1,1),
    NombreDelPaciente               VARCHAR(100) NOT NULL,
    ApellidoDelPaciente             VARCHAR(100) NOT NULL,
    NumeroDocumentoIdentidad        VARCHAR(20) NOT NULL,
    TipoDocumentoIdentidad          VARCHAR(20) NOT NULL DEFAULT 'DNI'
        CONSTRAINT CK_Pacientes_TipoDoc CHECK (TipoDocumentoIdentidad IN ('DNI', 'CE', 'Pasaporte')),
    FechaDeNacimiento               DATE NOT NULL,
    SexoBiologico                   VARCHAR(10) NOT NULL
        CONSTRAINT CK_Pacientes_Sexo CHECK (SexoBiologico IN ('Masculino', 'Femenino')),
    TelefonoDeContacto              VARCHAR(20) NULL,
    CorreoElectronico               VARCHAR(150) NULL,
    DireccionDomiciliaria           VARCHAR(300) NULL,
    EstaPacienteActivo              BIT NOT NULL DEFAULT 1,
    FechaRegistroEnSistema          DATETIME NOT NULL DEFAULT GETDATE(),
    FechaEliminacion                DATETIME NULL,

    CONSTRAINT PK_Pacientes PRIMARY KEY (IdClinica, IdPaciente),
    CONSTRAINT FK_Pacientes_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
);
GO

CREATE INDEX IX_Pacientes_Documento ON Pacientes (IdClinica, NumeroDocumentoIdentidad);
GO

-- =============================================================================
-- 7. PLANTILLAS DE HISTORIA CLINICA (CONFIGURABLES POR CLINICA)
-- =============================================================================

CREATE TABLE PlantillasHistoriaClinica (
    IdClinica                       INT NOT NULL,
    IdPlantilla                     INT IDENTITY(1,1),
    NombreDeLaPlantilla             VARCHAR(100) NOT NULL,
    TipoDocumentoClinico            VARCHAR(50) NOT NULL
        CONSTRAINT CK_Plantillas_Tipo CHECK (TipoDocumentoClinico IN ('SOAP', 'HistoriaClinica', 'Receta', 'Personalizada')),
    EsPlantillaPorDefecto           BIT NOT NULL DEFAULT 0,
    EstaPlantillaActiva             BIT NOT NULL DEFAULT 1,
    FechaCreacion                   DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Plantillas PRIMARY KEY (IdClinica, IdPlantilla),
    CONSTRAINT FK_Plantillas_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
);
GO

-- =============================================================================
-- 8. SECCIONES DE PLANTILLA (CONFIGURABLES)
-- =============================================================================

CREATE TABLE SeccionesDePlantilla (
    IdClinica                       INT NOT NULL,
    IdSeccion                       INT IDENTITY(1,1),
    IdPlantilla                     INT NOT NULL,
    NombreDeLaSeccion               VARCHAR(100) NOT NULL,
    DescripcionDeLaSeccion          VARCHAR(300) NULL,
    OrdenDeVisualizacion            INT NOT NULL DEFAULT 0,
    EsSeccionObligatoria            BIT NOT NULL DEFAULT 1,
    TipoDeCampo                     VARCHAR(30) NOT NULL DEFAULT 'TextoLibre'
        CONSTRAINT CK_Secciones_TipoCampo CHECK (TipoDeCampo IN ('TextoLibre', 'TextoCorto', 'Numerico', 'Fecha', 'Seleccion', 'ListaMultiple', 'SiNo')),
    OpcionesDeSeleccion             VARCHAR(MAX) NULL,
    InstruccionParaIA               VARCHAR(500) NULL,
    EstaSeccionActiva               BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_Secciones PRIMARY KEY (IdClinica, IdSeccion),
    CONSTRAINT FK_Secciones_Plantilla FOREIGN KEY (IdClinica, IdPlantilla) REFERENCES PlantillasHistoriaClinica(IdClinica, IdPlantilla)
);
GO

-- =============================================================================
-- 9. CONSULTAS (MULTITENANT)
-- =============================================================================

CREATE TABLE Consultas (
    IdClinica                       INT NOT NULL,
    IdConsulta                      INT IDENTITY(1,1),
    IdMedicoResponsable             INT NOT NULL,
    IdPacienteAtendido              INT NOT NULL,
    IdPlantillaUtilizada            INT NULL,
    EspecialidadMedicaAplicada      VARCHAR(100) NOT NULL,
    TipoDocumentoClinico            VARCHAR(50) NOT NULL
        CONSTRAINT CK_Consultas_TipoDoc CHECK (TipoDocumentoClinico IN ('SOAP', 'HistoriaClinica', 'Receta', 'Personalizada')),
    RutaArchivoDeAudio              VARCHAR(500) NULL,
    TranscripcionDelAudio           NVARCHAR(MAX) NULL,
    NotaClinicaEstructurada         NVARCHAR(MAX) NULL,
    EstadoActualDeLaConsulta        VARCHAR(30) NOT NULL DEFAULT 'Grabando'
        CONSTRAINT CK_Consultas_Estado CHECK (EstadoActualDeLaConsulta IN ('Grabando', 'Transcribiendo', 'Procesando', 'Borrador', 'Aprobado', 'Rechazado')),
    DuracionEnSegundos              INT NULL DEFAULT 0,
    FechaYHoraDeLaConsulta          DATETIME NOT NULL,
    FechaCreacionEnSistema          DATETIME NOT NULL DEFAULT GETDATE(),
    FechaEliminacion                DATETIME NULL,

    CONSTRAINT PK_Consultas PRIMARY KEY (IdClinica, IdConsulta),
    CONSTRAINT FK_Consultas_Medico FOREIGN KEY (IdClinica, IdMedicoResponsable) REFERENCES Medicos(IdClinica, IdMedico),
    CONSTRAINT FK_Consultas_Paciente FOREIGN KEY (IdClinica, IdPacienteAtendido) REFERENCES Pacientes(IdClinica, IdPaciente),
    CONSTRAINT FK_Consultas_Plantilla FOREIGN KEY (IdClinica, IdPlantillaUtilizada) REFERENCES PlantillasHistoriaClinica(IdClinica, IdPlantilla)
);
GO

CREATE INDEX IX_Consultas_Medico ON Consultas (IdClinica, IdMedicoResponsable, FechaCreacionEnSistema DESC)
    WHERE FechaEliminacion IS NULL;
GO

-- =============================================================================
-- 10. VALORES DE SECCIONES POR CONSULTA (DATOS DINAMICOS)
-- =============================================================================

CREATE TABLE ValoresDeSeccionPorConsulta (
    IdClinica                       INT NOT NULL,
    IdValor                         INT IDENTITY(1,1),
    IdConsulta                      INT NOT NULL,
    IdSeccion                       INT NOT NULL,
    ValorIngresado                  NVARCHAR(MAX) NULL,
    FechaRegistro                   DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_ValoresSeccion PRIMARY KEY (IdClinica, IdValor),
    CONSTRAINT FK_Valores_Consulta FOREIGN KEY (IdClinica, IdConsulta) REFERENCES Consultas(IdClinica, IdConsulta),
    CONSTRAINT FK_Valores_Seccion FOREIGN KEY (IdClinica, IdSeccion) REFERENCES SeccionesDePlantilla(IdClinica, IdSeccion)
);
GO

-- =============================================================================
-- 11. DOCUMENTOS (MULTITENANT)
-- =============================================================================

CREATE TABLE Documentos (
    IdClinica                       INT NOT NULL,
    IdDocumento                     INT IDENTITY(1,1),
    IdConsultaVinculada             INT NOT NULL,
    TipoDocumentoClinico            VARCHAR(50) NOT NULL
        CONSTRAINT CK_Documentos_Tipo CHECK (TipoDocumentoClinico IN ('SOAP', 'HistoriaClinica', 'Receta', 'Personalizada')),
    FormatoDeArchivo                VARCHAR(10) NOT NULL DEFAULT 'PDF'
        CONSTRAINT CK_Documentos_Formato CHECK (FormatoDeArchivo IN ('PDF', 'Word')),
    RutaFisicaDelArchivo            VARCHAR(500) NOT NULL,
    EstadoDeAprobacion              VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CONSTRAINT CK_Documentos_Estado CHECK (EstadoDeAprobacion IN ('Borrador', 'Aprobado', 'Rechazado')),
    NumeroDeVersion                 INT NOT NULL DEFAULT 1,
    FechaDeGeneracion               DATETIME NOT NULL DEFAULT GETDATE(),
    FechaEliminacion                DATETIME NULL,

    CONSTRAINT PK_Documentos PRIMARY KEY (IdClinica, IdDocumento),
    CONSTRAINT FK_Documentos_Consulta FOREIGN KEY (IdClinica, IdConsultaVinculada) REFERENCES Consultas(IdClinica, IdConsulta)
);
GO

-- =============================================================================
-- 12. AUDITORIA DE CONSULTAS (MULTITENANT)
-- =============================================================================

CREATE TABLE AuditoriaDeConsultas (
    IdClinica                       INT NOT NULL,
    IdAuditoria                     INT IDENTITY(1,1),
    IdConsulta                      INT NOT NULL,
    EstadoAnterior                  VARCHAR(30) NOT NULL,
    EstadoNuevo                     VARCHAR(30) NOT NULL,
    IdUsuarioQueRealizoElCambio     INT NULL,
    FechaDelCambio                  DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Auditoria PRIMARY KEY (IdClinica, IdAuditoria),
    CONSTRAINT FK_Auditoria_Consulta FOREIGN KEY (IdClinica, IdConsulta) REFERENCES Consultas(IdClinica, IdConsulta)
);
GO

CREATE TABLE RolesDeClinica (
    IdClinica                   INT NOT NULL,
    IdRol                       INT IDENTITY(1,1),
    NombreDelRol                VARCHAR(50) NOT NULL,
    DescripcionDelRol           VARCHAR(200) NULL,
    PermisosEnFormatoJSON       VARCHAR(MAX) NOT NULL DEFAULT '{}',
    EsRolBase                   BIT NOT NULL DEFAULT 0,
    FechaCreacion               DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_RolesDeClinica PRIMARY KEY (IdClinica, IdRol),
    CONSTRAINT FK_Roles_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
);
GO

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- El backend ejecuta: EXEC sp_set_session_context @key=N'IdClinica', @value=@Id
-- Todas las queries se filtran automaticamente. Cero WHERE en el backend.
-- =============================================================================

CREATE FUNCTION dbo.FiltrarPorClinica(@IdClinica INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS ResultadoDelFiltro
    WHERE @IdClinica = CAST(SESSION_CONTEXT(N'IdClinica') AS INT)
       OR SESSION_CONTEXT(N'IdClinica') IS NULL;
GO

CREATE SECURITY POLICY PoliticaAislamientoPorClinica
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Usuarios,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Medicos,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Pacientes,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Consultas,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Documentos,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.AuditoriaDeConsultas,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Suscripciones,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.PlantillasHistoriaClinica,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.SeccionesDePlantilla,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.ValoresDeSeccionPorConsulta,
    ADD FILTER PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.RolesDeClinica,
    ADD BLOCK PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Usuarios,
    ADD BLOCK PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.RolesDeClinica,
    ADD BLOCK PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Medicos,
    ADD BLOCK PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Pacientes,
    ADD BLOCK PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Consultas,
    ADD BLOCK PREDICATE dbo.FiltrarPorClinica(IdClinica) ON dbo.Documentos
WITH (STATE = ON);
GO

-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- El backend ejecuta sp_set_session_context ANTES de llamar a cualquier SP.
-- Los SP no necesitan recibir @IdClinica como parametro en las consultas
-- SELECT porque RLS filtra automaticamente.
-- Los SP de INSERT si reciben @IdClinica para escribir el valor en la fila.
-- =============================================================================

CREATE OR ALTER PROCEDURE usp_EstablecerContextoDeClinica
    @IdClinica INT
AS
BEGIN
    SET NOCOUNT ON;
    EXEC sp_set_session_context @key = N'IdClinica', @value = @IdClinica;
END
GO

-- USUARIOS

CREATE OR ALTER PROCEDURE usp_Usuarios_ValidarCredenciales
    @Correo VARCHAR(150),
    @Contrasena VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario, u.IdClinica, u.NombreCompleto, u.CorreoElectronico, u.RolDelSistema,
           u.EstaCuentaActiva, u.IdRol,
           r.NombreDelRol, r.PermisosEnFormatoJSON,
           c.NombreComercial AS NombreClinica,
           CAST('' AS VARCHAR(MAX)) AS PermisosPersonalizadosJSON
    FROM Usuarios u
    LEFT JOIN RolesDeClinica r ON u.IdClinica = r.IdClinica AND u.IdRol = r.IdRol
    LEFT JOIN Clinicas c ON u.IdClinica = c.IdClinica
    WHERE u.CorreoElectronico = @Correo AND u.ContrasenaHasheada = @Contrasena AND u.EstaCuentaActiva = 1;
END
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_RegistrarConRetornoId
    @IdClinica INT,
    @Nombre VARCHAR(100),
    @Correo VARCHAR(150),
    @Contrasena VARCHAR(255),
    @Rol VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Usuarios WHERE IdClinica = @IdClinica AND CorreoElectronico = @Correo)
    BEGIN
        RAISERROR('El correo electronico ya esta registrado en esta clinica', 16, 1);
        RETURN;
    END
    INSERT INTO Usuarios (IdClinica, NombreCompleto, CorreoElectronico, ContrasenaHasheada, RolDelSistema)
    VALUES (@IdClinica, @Nombre, @Correo, @Contrasena, @Rol);
    SELECT SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_RegistrarMedicoConUsuarioEnTransaccion
    @IdClinica INT,
    @NombreCompleto VARCHAR(100),
    @Correo VARCHAR(150),
    @Contrasena VARCHAR(255),
    @NombreMedico VARCHAR(100),
    @ApellidoMedico VARCHAR(100),
    @Especialidad VARCHAR(100),
    @NumeroColegiatura VARCHAR(20),
    @Telefono VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Usuarios WHERE IdClinica = @IdClinica AND CorreoElectronico = @Correo)
        BEGIN
            RAISERROR('El correo electronico ya esta registrado en esta clinica', 16, 1);
        END

        INSERT INTO Usuarios (IdClinica, NombreCompleto, CorreoElectronico, ContrasenaHasheada, RolDelSistema)
        VALUES (@IdClinica, @NombreCompleto, @Correo, @Contrasena, 'Medico');

        DECLARE @IdUsuarioGenerado INT = SCOPE_IDENTITY();

        INSERT INTO Medicos (IdClinica, IdUsuarioVinculado, NombreDelMedico, ApellidoDelMedico, EspecialidadMedica, NumeroColegiaturaDelPeru, TelefonoDeContacto)
        VALUES (@IdClinica, @IdUsuarioGenerado, @NombreMedico, @ApellidoMedico, @Especialidad, @NumeroColegiatura, @Telefono);

        COMMIT TRANSACTION;
        SELECT @IdUsuarioGenerado AS IdUsuario;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_BuscarPorCorreo
    @Correo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdUsuario, IdClinica, NombreCompleto, CorreoElectronico, RolDelSistema, EstaCuentaActiva, FechaRegistroEnSistema
    FROM Usuarios
    WHERE CorreoElectronico = @Correo;
END
GO

-- MEDICOS

CREATE OR ALTER PROCEDURE usp_Medicos_Insertar
    @IdClinica INT,
    @IdUsuario INT,
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @Especialidad VARCHAR(100),
    @NumeroColegiatura VARCHAR(20),
    @Telefono VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Medicos (IdClinica, IdUsuarioVinculado, NombreDelMedico, ApellidoDelMedico, EspecialidadMedica, NumeroColegiaturaDelPeru, TelefonoDeContacto)
    VALUES (@IdClinica, @IdUsuario, @Nombre, @Apellido, @Especialidad, @NumeroColegiatura, @Telefono);
END
GO

-- PACIENTES

CREATE OR ALTER PROCEDURE usp_Pacientes_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPaciente, IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
           FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria,
           EstaPacienteActivo, FechaRegistroEnSistema
    FROM Pacientes
    WHERE EstaPacienteActivo = 1 AND FechaEliminacion IS NULL
    ORDER BY ApellidoDelPaciente, NombreDelPaciente;
END
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Buscar
    @IdPaciente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPaciente, IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
           FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria,
           EstaPacienteActivo, FechaRegistroEnSistema
    FROM Pacientes
    WHERE IdPaciente = @IdPaciente AND FechaEliminacion IS NULL;
END
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_BuscarPorDocumento
    @NumeroDocumento VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPaciente, IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
           FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria,
           EstaPacienteActivo, FechaRegistroEnSistema
    FROM Pacientes
    WHERE NumeroDocumentoIdentidad = @NumeroDocumento AND FechaEliminacion IS NULL;
END
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Insertar
    @IdClinica INT,
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @NumeroDocumento VARCHAR(20),
    @TipoDocumento VARCHAR(20),
    @FechaNacimiento DATE,
    @Sexo VARCHAR(10),
    @Telefono VARCHAR(20),
    @Correo VARCHAR(150),
    @Direccion VARCHAR(300)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Pacientes WHERE IdClinica = @IdClinica AND NumeroDocumentoIdentidad = @NumeroDocumento AND EstaPacienteActivo = 1 AND FechaEliminacion IS NULL)
    BEGIN
        RAISERROR('Ya existe un paciente activo con ese numero de documento en esta clinica', 16, 1);
        RETURN;
    END
    INSERT INTO Pacientes (IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
                          FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria)
    VALUES (@IdClinica, @Nombre, @Apellido, @NumeroDocumento, @TipoDocumento, @FechaNacimiento, @Sexo, @Telefono, @Correo, @Direccion);
END
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Actualizar
    @IdPaciente INT,
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @NumeroDocumento VARCHAR(20),
    @TipoDocumento VARCHAR(20),
    @FechaNacimiento DATE,
    @Sexo VARCHAR(10),
    @Telefono VARCHAR(20),
    @Correo VARCHAR(150),
    @Direccion VARCHAR(300)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Pacientes WHERE IdPaciente = @IdPaciente AND FechaEliminacion IS NULL)
    BEGIN
        RAISERROR('El paciente no existe', 16, 1);
        RETURN;
    END
    UPDATE Pacientes SET
        NombreDelPaciente = @Nombre, ApellidoDelPaciente = @Apellido,
        NumeroDocumentoIdentidad = @NumeroDocumento, TipoDocumentoIdentidad = @TipoDocumento,
        FechaDeNacimiento = @FechaNacimiento, SexoBiologico = @Sexo,
        TelefonoDeContacto = @Telefono, CorreoElectronico = @Correo, DireccionDomiciliaria = @Direccion
    WHERE IdPaciente = @IdPaciente;
END
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Eliminar
    @IdPaciente INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Pacientes SET EstaPacienteActivo = 0, FechaEliminacion = GETDATE() WHERE IdPaciente = @IdPaciente;
END
GO

-- CONSULTAS

CREATE OR ALTER PROCEDURE usp_Consultas_Listar
    @IdMedico INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdConsulta, IdClinica, IdMedicoResponsable, IdPacienteAtendido, EspecialidadMedicaAplicada, TipoDocumentoClinico,
           RutaArchivoDeAudio, TranscripcionDelAudio, NotaClinicaEstructurada, EstadoActualDeLaConsulta, DuracionEnSegundos,
           FechaYHoraDeLaConsulta, FechaCreacionEnSistema
    FROM Consultas
    WHERE IdMedicoResponsable = @IdMedico AND FechaEliminacion IS NULL
    ORDER BY FechaCreacionEnSistema DESC;
END
GO

CREATE OR ALTER PROCEDURE usp_Consultas_Buscar
    @IdConsulta INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdConsulta, IdClinica, IdMedicoResponsable, IdPacienteAtendido, EspecialidadMedicaAplicada, TipoDocumentoClinico,
           RutaArchivoDeAudio, TranscripcionDelAudio, NotaClinicaEstructurada, EstadoActualDeLaConsulta, DuracionEnSegundos,
           FechaYHoraDeLaConsulta, FechaCreacionEnSistema
    FROM Consultas
    WHERE IdConsulta = @IdConsulta AND FechaEliminacion IS NULL;
END
GO

CREATE OR ALTER PROCEDURE usp_Consultas_Insertar
    @IdClinica INT,
    @IdMedico INT,
    @IdPaciente INT,
    @Especialidad VARCHAR(100),
    @TipoDocumento VARCHAR(50),
    @RutaAudio VARCHAR(500),
    @FechaConsulta DATETIME,
    @IdPlantilla INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Consultas (IdClinica, IdMedicoResponsable, IdPacienteAtendido, IdPlantillaUtilizada, EspecialidadMedicaAplicada, TipoDocumentoClinico, RutaArchivoDeAudio, FechaYHoraDeLaConsulta)
    VALUES (@IdClinica, @IdMedico, @IdPaciente, @IdPlantilla, @Especialidad, @TipoDocumento, @RutaAudio, @FechaConsulta);
    SELECT SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE usp_Consultas_ActualizarEstado
    @IdConsulta INT,
    @Estado VARCHAR(30),
    @IdUsuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdClinicaActual INT, @EstadoAnterior VARCHAR(30);
    SELECT @IdClinicaActual = IdClinica, @EstadoAnterior = EstadoActualDeLaConsulta FROM Consultas WHERE IdConsulta = @IdConsulta;
    IF @EstadoAnterior IS NULL
    BEGIN
        RAISERROR('La consulta no existe', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE Consultas SET EstadoActualDeLaConsulta = @Estado WHERE IdConsulta = @IdConsulta;
        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo, IdUsuarioQueRealizoElCambio)
        VALUES (@IdClinicaActual, @IdConsulta, @EstadoAnterior, @Estado, @IdUsuario);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_Consultas_CrearConsultaConDocumentoEnTransaccion
    @IdClinica INT,
    @IdMedico INT,
    @IdPaciente INT,
    @Especialidad VARCHAR(100),
    @TipoDocumento VARCHAR(50),
    @RutaAudio VARCHAR(500),
    @FechaConsulta DATETIME,
    @IdPlantilla INT = NULL,
    @FormatoArchivo VARCHAR(10) = 'PDF',
    @RutaArchivo VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO Consultas (IdClinica, IdMedicoResponsable, IdPacienteAtendido, IdPlantillaUtilizada, EspecialidadMedicaAplicada, TipoDocumentoClinico, RutaArchivoDeAudio, FechaYHoraDeLaConsulta)
        VALUES (@IdClinica, @IdMedico, @IdPaciente, @IdPlantilla, @Especialidad, @TipoDocumento, @RutaAudio, @FechaConsulta);

        DECLARE @IdConsultaGenerado INT = SCOPE_IDENTITY();

        INSERT INTO Documentos (IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo, RutaFisicaDelArchivo)
        VALUES (@IdClinica, @IdConsultaGenerado, @TipoDocumento, @FormatoArchivo, @RutaArchivo);

        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo)
        VALUES (@IdClinica, @IdConsultaGenerado, 'Inexistente', 'Grabando');

        COMMIT TRANSACTION;
        SELECT @IdConsultaGenerado AS IdConsulta;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_Consultas_AprobarConsultaYDocumentosEnTransaccion
    @IdConsulta INT,
    @IdUsuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdClinicaActual INT, @EstadoAnterior VARCHAR(30);
    SELECT @IdClinicaActual = IdClinica, @EstadoAnterior = EstadoActualDeLaConsulta FROM Consultas WHERE IdConsulta = @IdConsulta;

    IF @EstadoAnterior IS NULL
    BEGIN
        RAISERROR('La consulta no existe', 16, 1);
        RETURN;
    END
    IF @EstadoAnterior != 'Borrador'
    BEGIN
        RAISERROR('Solo se pueden aprobar consultas en estado Borrador', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE Consultas SET EstadoActualDeLaConsulta = 'Aprobado' WHERE IdConsulta = @IdConsulta;

        UPDATE Documentos SET EstadoDeAprobacion = 'Aprobado'
        WHERE IdConsultaVinculada = @IdConsulta AND EstadoDeAprobacion = 'Borrador' AND FechaEliminacion IS NULL;

        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo, IdUsuarioQueRealizoElCambio)
        VALUES (@IdClinicaActual, @IdConsulta, @EstadoAnterior, 'Aprobado', @IdUsuario);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE usp_Consultas_RechazarConsultaYDocumentosEnTransaccion
    @IdConsulta INT,
    @IdUsuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdClinicaActual INT, @EstadoAnterior VARCHAR(30);
    SELECT @IdClinicaActual = IdClinica, @EstadoAnterior = EstadoActualDeLaConsulta FROM Consultas WHERE IdConsulta = @IdConsulta;

    IF @EstadoAnterior IS NULL
    BEGIN
        RAISERROR('La consulta no existe', 16, 1);
        RETURN;
    END
    IF @EstadoAnterior != 'Borrador'
    BEGIN
        RAISERROR('Solo se pueden rechazar consultas en estado Borrador', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE Consultas SET EstadoActualDeLaConsulta = 'Rechazado' WHERE IdConsulta = @IdConsulta;

        UPDATE Documentos SET EstadoDeAprobacion = 'Rechazado'
        WHERE IdConsultaVinculada = @IdConsulta AND EstadoDeAprobacion = 'Borrador' AND FechaEliminacion IS NULL;

        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo, IdUsuarioQueRealizoElCambio)
        VALUES (@IdClinicaActual, @IdConsulta, @EstadoAnterior, 'Rechazado', @IdUsuario);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- DOCUMENTOS

CREATE OR ALTER PROCEDURE usp_Documentos_Listar
    @IdMedico INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT d.IdDocumento, d.IdClinica, d.IdConsultaVinculada, d.TipoDocumentoClinico, d.FormatoDeArchivo,
           d.RutaFisicaDelArchivo, d.EstadoDeAprobacion, d.NumeroDeVersion, d.FechaDeGeneracion
    FROM Documentos d
    INNER JOIN Consultas c ON d.IdClinica = c.IdClinica AND d.IdConsultaVinculada = c.IdConsulta
    WHERE c.IdMedicoResponsable = @IdMedico AND d.FechaEliminacion IS NULL
    ORDER BY d.FechaDeGeneracion DESC;
END
GO

CREATE OR ALTER PROCEDURE usp_Documentos_Buscar
    @IdDocumento INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdDocumento, IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo,
           RutaFisicaDelArchivo, EstadoDeAprobacion, NumeroDeVersion, FechaDeGeneracion
    FROM Documentos
    WHERE IdDocumento = @IdDocumento AND FechaEliminacion IS NULL;
END
GO

CREATE OR ALTER PROCEDURE usp_Documentos_PorConsulta
    @IdConsulta INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdDocumento, IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo,
           RutaFisicaDelArchivo, EstadoDeAprobacion, NumeroDeVersion, FechaDeGeneracion
    FROM Documentos
    WHERE IdConsultaVinculada = @IdConsulta AND FechaEliminacion IS NULL
    ORDER BY NumeroDeVersion DESC;
END
GO

CREATE OR ALTER PROCEDURE usp_Documentos_Insertar
    @IdClinica INT,
    @IdConsulta INT,
    @TipoDocumento VARCHAR(50),
    @Formato VARCHAR(10),
    @RutaArchivo VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Documentos (IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo, RutaFisicaDelArchivo)
    VALUES (@IdClinica, @IdConsulta, @TipoDocumento, @Formato, @RutaArchivo);
END
GO

CREATE OR ALTER PROCEDURE usp_Documentos_ActualizarEstado
    @IdDocumento INT,
    @Estado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Documentos SET EstadoDeAprobacion = @Estado WHERE IdDocumento = @IdDocumento AND FechaEliminacion IS NULL;
END
GO

CREATE OR ALTER PROCEDURE usp_Documentos_AprobarPorConsulta
    @IdConsulta INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Documentos SET EstadoDeAprobacion = 'Aprobado'
    WHERE IdConsultaVinculada = @IdConsulta AND EstadoDeAprobacion = 'Borrador' AND FechaEliminacion IS NULL;
END
GO

-- =============================================================================
-- PROTECCION CONTRA ELIMINACION FISICA EN TABLAS CLINICAS (NTS 139-MINSA)
-- Retencion minima: 20 anios. Solo soft delete permitido.
-- =============================================================================

CREATE OR ALTER TRIGGER TR_Consultas_BloquearEliminacionFisica ON Consultas
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Consultas SET FechaEliminacion = GETDATE(), EstadoActualDeLaConsulta = 'Rechazado'
    WHERE IdConsulta IN (SELECT IdConsulta FROM deleted);
END
GO

CREATE OR ALTER TRIGGER TR_Documentos_BloquearEliminacionFisica ON Documentos
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Documentos SET FechaEliminacion = GETDATE()
    WHERE IdDocumento IN (SELECT IdDocumento FROM deleted);
END
GO

CREATE OR ALTER TRIGGER TR_Pacientes_BloquearEliminacionFisica ON Pacientes
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Pacientes SET EstaPacienteActivo = 0, FechaEliminacion = GETDATE()
    WHERE IdPaciente IN (SELECT IdPaciente FROM deleted);
END
GO

-- =============================================================================
-- BACKUP AUTOMATIZADO
-- =============================================================================

CREATE OR ALTER PROCEDURE usp_Backup_GenerarBackupCompleto
    @RutaDeDestino VARCHAR(500) = 'C:\Backups\MedScribeDB\'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NombreDelArchivo VARCHAR(500);
    SET @NombreDelArchivo = @RutaDeDestino + 'MedScribeDB_FULL_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmmss') + '.bak';

    BACKUP DATABASE MedScribeDB
    TO DISK = @NombreDelArchivo
    WITH FORMAT, COMPRESSION, STATS = 10,
         NAME = N'MedScribeDB - Backup Completo';
END
GO

CREATE OR ALTER PROCEDURE usp_Backup_GenerarBackupDiferencial
    @RutaDeDestino VARCHAR(500) = 'C:\Backups\MedScribeDB\'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NombreDelArchivo VARCHAR(500);
    SET @NombreDelArchivo = @RutaDeDestino + 'MedScribeDB_DIFF_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmmss') + '.bak';

    BACKUP DATABASE MedScribeDB
    TO DISK = @NombreDelArchivo
    WITH DIFFERENTIAL, COMPRESSION, STATS = 10,
         NAME = N'MedScribeDB - Backup Diferencial';
END
GO

CREATE OR ALTER PROCEDURE usp_Backup_GenerarBackupDeLog
    @RutaDeDestino VARCHAR(500) = 'C:\Backups\MedScribeDB\'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NombreDelArchivo VARCHAR(500);
    SET @NombreDelArchivo = @RutaDeDestino + 'MedScribeDB_LOG_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmmss') + '.trn';

    BACKUP LOG MedScribeDB
    TO DISK = @NombreDelArchivo
    WITH COMPRESSION, STATS = 10,
         NAME = N'MedScribeDB - Backup de Log';
END
GO

-- PLANTILLAS

CREATE OR ALTER PROCEDURE usp_Plantillas_ListarPorClinica
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPlantilla, IdClinica, NombreDeLaPlantilla, TipoDocumentoClinico, EsPlantillaPorDefecto, EstaPlantillaActiva
    FROM PlantillasHistoriaClinica
    WHERE EstaPlantillaActiva = 1;
END
GO

CREATE OR ALTER PROCEDURE usp_Plantillas_ObtenerSeccionesPorPlantilla
    @IdPlantilla INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdSeccion, IdClinica, IdPlantilla, NombreDeLaSeccion, DescripcionDeLaSeccion, OrdenDeVisualizacion,
           EsSeccionObligatoria, TipoDeCampo, OpcionesDeSeleccion, InstruccionParaIA
    FROM SeccionesDePlantilla
    WHERE IdPlantilla = @IdPlantilla AND EstaSeccionActiva = 1
    ORDER BY OrdenDeVisualizacion;
END
GO

-- PLANES (global, sin RLS)

CREATE OR ALTER PROCEDURE usp_Planes_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPlan, CodigoDelPlan, NombreDelPlan, DescripcionDelPlan, PrecioMensualEnSoles, PrecioAnualEnSoles,
           MaximoDeSedesPermitidas, MaximoDeUsuariosPermitidos, MaximoDeConsultasPorMes, MaximoDeMedicosPorClinica,
           PermiteGenerarWord, PermiteModoVerificacion, PermitePersonalizarPlantillas, PermiteSoportePrioritario,
           AlmacenamientoMaximoEnMB
    FROM PlanesSuscripcion
    WHERE EstaPlanActivo = 1
    ORDER BY OrdenDeVisualizacion;
END
GO

CREATE OR ALTER PROCEDURE usp_Planes_Buscar
    @IdPlan INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPlan, CodigoDelPlan, NombreDelPlan, DescripcionDelPlan, PrecioMensualEnSoles, PrecioAnualEnSoles,
           MaximoDeSedesPermitidas, MaximoDeUsuariosPermitidos, MaximoDeConsultasPorMes, MaximoDeMedicosPorClinica,
           PermiteGenerarWord, PermiteModoVerificacion, PermitePersonalizarPlantillas, PermiteSoportePrioritario,
           AlmacenamientoMaximoEnMB
    FROM PlanesSuscripcion
    WHERE IdPlan = @IdPlan;
END
GO

-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS: Clinicas (Registro)
-- =============================================================================

CREATE OR ALTER PROCEDURE usp_Clinicas_RegistrarClinicaCompletaEnTransaccion
    @RazonSocial VARCHAR(200),
    @RucDeLaClinica VARCHAR(11),
    @NombreComercial VARCHAR(200),
    @SlugPublico VARCHAR(100),
    @CorreoDeContacto VARCHAR(150),
    @NombreAdmin VARCHAR(100),
    @CorreoAdmin VARCHAR(150),
    @ContrasenaAdmin VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Clinicas WHERE RucDeLaClinica = @RucDeLaClinica)
        BEGIN
            RAISERROR('Ya existe una clinica con ese RUC', 16, 1);
        END
        INSERT INTO Clinicas (RazonSocial, RucDeLaClinica, NombreComercial, SlugPublico, CorreoDeContacto)
        VALUES (@RazonSocial, @RucDeLaClinica, @NombreComercial, @SlugPublico, @CorreoDeContacto);
        DECLARE @IdClinicaCreada INT = SCOPE_IDENTITY();
        INSERT INTO Suscripciones (IdClinica, IdPlan, EstadoDeLaSuscripcion, EsTrial, DiasDelTrial, FechaFinDelTrial)
        VALUES (@IdClinicaCreada, 1, 'TRIAL', 1, 30, DATEADD(DAY, 30, GETDATE()));
        DECLARE @PA VARCHAR(MAX) = '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":true},"consultas":{"ver":true,"crear":true,"editar":true,"eliminar":true},"documentos":{"ver":true,"crear":true,"editar":true,"eliminar":true},"configuracion":{"ver":true,"crear":true,"editar":true,"eliminar":true},"usuarios":{"ver":true,"crear":true,"editar":true,"eliminar":true},"roles":{"ver":true,"crear":true,"editar":true,"eliminar":true}}';
        DECLARE @PM VARCHAR(MAX) = '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":false},"consultas":{"ver":true,"crear":true,"editar":true,"eliminar":false},"documentos":{"ver":true,"crear":true,"editar":false,"eliminar":false},"configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false},"usuarios":{"ver":false,"crear":false,"editar":false,"eliminar":false},"roles":{"ver":false,"crear":false,"editar":false,"eliminar":false}}';
        DECLARE @PR VARCHAR(MAX) = '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":false},"consultas":{"ver":true,"crear":false,"editar":false,"eliminar":false},"documentos":{"ver":true,"crear":false,"editar":false,"eliminar":false},"configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false},"usuarios":{"ver":false,"crear":false,"editar":false,"eliminar":false},"roles":{"ver":false,"crear":false,"editar":false,"eliminar":false}}';
        INSERT INTO RolesDeClinica (IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON, EsRolBase) VALUES (@IdClinicaCreada, 'Administrador', 'Acceso total al sistema', @PA, 1);
        DECLARE @IdRolAdmin INT = SCOPE_IDENTITY();
        INSERT INTO RolesDeClinica (IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON, EsRolBase) VALUES (@IdClinicaCreada, 'Medico', 'Acceso a pacientes consultas y documentos', @PM, 1);
        INSERT INTO RolesDeClinica (IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON, EsRolBase) VALUES (@IdClinicaCreada, 'Recepcionista', 'Acceso limitado', @PR, 1);
        INSERT INTO Usuarios (IdClinica, NombreCompleto, CorreoElectronico, ContrasenaHasheada, RolDelSistema, IdRol, DebeCambiarContrasena) VALUES (@IdClinicaCreada, @NombreAdmin, @CorreoAdmin, @ContrasenaAdmin, 'Administrador', @IdRolAdmin, 0);
        COMMIT TRANSACTION;
        SELECT @IdClinicaCreada AS IdClinica;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS: Roles
-- =============================================================================

CREATE OR ALTER PROCEDURE usp_Roles_ListarPorClinica
    @IdClinica INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdRol, IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON, EsRolBase, FechaCreacion
    FROM RolesDeClinica WHERE IdClinica = @IdClinica;
END
GO

CREATE OR ALTER PROCEDURE usp_Roles_Crear
    @IdClinica INT, @NombreDelRol VARCHAR(50), @DescripcionDelRol VARCHAR(200), @PermisosEnFormatoJSON VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO RolesDeClinica (IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON)
    VALUES (@IdClinica, @NombreDelRol, @DescripcionDelRol, @PermisosEnFormatoJSON);
    SELECT SCOPE_IDENTITY() AS IdRol;
END
GO

CREATE OR ALTER PROCEDURE usp_Roles_Actualizar
    @IdRol INT, @NombreDelRol VARCHAR(50), @DescripcionDelRol VARCHAR(200), @PermisosEnFormatoJSON VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RolesDeClinica SET NombreDelRol = @NombreDelRol, DescripcionDelRol = @DescripcionDelRol, PermisosEnFormatoJSON = @PermisosEnFormatoJSON
    WHERE IdRol = @IdRol AND EsRolBase = 0;
END
GO

-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS: Usuarios de Clinica
-- =============================================================================

CREATE OR ALTER PROCEDURE usp_Usuarios_ListarPorClinica
    @IdClinica INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario, u.IdClinica, u.NombreCompleto, u.CorreoElectronico, u.RolDelSistema,
           u.EstaCuentaActiva, u.IdRol, u.FechaRegistroEnSistema, r.NombreDelRol
    FROM Usuarios u LEFT JOIN RolesDeClinica r ON u.IdClinica = r.IdClinica AND u.IdRol = r.IdRol
    WHERE u.IdClinica = @IdClinica;
END
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_CrearEnClinica
    @IdClinica INT, @NombreCompleto VARCHAR(100), @CorreoElectronico VARCHAR(150),
    @Contrasena VARCHAR(255), @RolDelSistema VARCHAR(20), @IdRol INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Usuarios WHERE IdClinica = @IdClinica AND CorreoElectronico = @CorreoElectronico)
    BEGIN
        RAISERROR('El correo ya esta registrado en esta clinica', 16, 1);
        RETURN;
    END
    INSERT INTO Usuarios (IdClinica, NombreCompleto, CorreoElectronico, ContrasenaHasheada, RolDelSistema, IdRol)
    VALUES (@IdClinica, @NombreCompleto, @CorreoElectronico, @Contrasena, @RolDelSistema, @IdRol);
    SELECT SCOPE_IDENTITY() AS IdUsuario;
END
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_CambiarRol
    @IdUsuario INT, @IdRol INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NombreRol VARCHAR(50);
    SELECT @NombreRol = NombreDelRol FROM RolesDeClinica WHERE IdRol = @IdRol;
    UPDATE Usuarios SET IdRol = @IdRol, RolDelSistema = @NombreRol WHERE IdUsuario = @IdUsuario;
END
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_ObtenerPerfilCompleto
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario, u.IdClinica, u.NombreCompleto, u.CorreoElectronico, u.RolDelSistema,
           u.EstaCuentaActiva, u.DebeCambiarContrasena, u.UltimoAcceso, u.FechaRegistroEnSistema, u.FotoPerfilUrl,
           m.IdMedico, m.NombreDelMedico, m.ApellidoDelMedico, m.EspecialidadMedica,
           m.NumeroColegiaturaDelPeru, m.TelefonoDeContacto, m.EstaMedicoActivo
    FROM Usuarios u LEFT JOIN Medicos m ON u.IdClinica = m.IdClinica AND u.IdUsuario = m.IdUsuarioVinculado
    WHERE u.IdUsuario = @IdUsuario;
END
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_CambiarContrasena
    @IdUsuario INT, @ContrasenaActual VARCHAR(255), @ContrasenaNueva VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE IdUsuario = @IdUsuario AND ContrasenaHasheada = @ContrasenaActual)
    BEGIN
        RAISERROR('Contrasena actual incorrecta', 16, 1);
        RETURN;
    END
    UPDATE Usuarios SET ContrasenaHasheada = @ContrasenaNueva, DebeCambiarContrasena = 0 WHERE IdUsuario = @IdUsuario;
END
GO

-- =============================================================================
-- VISTA: Uso actual del tenant vs limites del plan
-- =============================================================================

CREATE OR ALTER VIEW v_UsoActualDeLaClinica AS
SELECT
    c.IdClinica,
    c.RazonSocial,
    c.NombreComercial,
    p.CodigoDelPlan,
    p.NombreDelPlan,
    s.EstadoDeLaSuscripcion,
    COALESCE(s.OverrideMaxConsultas, p.MaximoDeConsultasPorMes) AS LimiteConsultasMes,
    COALESCE(s.OverrideMaxUsuarios, p.MaximoDeUsuariosPermitidos) AS LimiteUsuarios,
    COALESCE(s.OverrideMaxMedicos, p.MaximoDeMedicosPorClinica) AS LimiteMedicos,
    (SELECT COUNT(*) FROM Usuarios u WHERE u.IdClinica = c.IdClinica AND u.EstaCuentaActiva = 1) AS UsoUsuarios,
    (SELECT COUNT(*) FROM Medicos m WHERE m.IdClinica = c.IdClinica AND m.EstaMedicoActivo = 1) AS UsoMedicos,
    (SELECT COUNT(*) FROM Consultas co WHERE co.IdClinica = c.IdClinica AND co.FechaEliminacion IS NULL
        AND co.FechaCreacionEnSistema >= DATEADD(DAY, 1 - DAY(GETDATE()), CAST(GETDATE() AS DATE))) AS UsoConsultasEsteMes
FROM Clinicas c
JOIN Suscripciones s ON s.IdClinica = c.IdClinica AND s.EstadoDeLaSuscripcion IN ('ACTIVA', 'TRIAL')
JOIN PlanesSuscripcion p ON p.IdPlan = s.IdPlan;
GO

-- =============================================================================
-- DATOS SEMILLA
-- =============================================================================

INSERT INTO PlanesSuscripcion (CodigoDelPlan, NombreDelPlan, DescripcionDelPlan, PrecioMensualEnSoles, PrecioAnualEnSoles,
    MaximoDeSedesPermitidas, MaximoDeUsuariosPermitidos, MaximoDeConsultasPorMes, MaximoDeMedicosPorClinica,
    PermiteGenerarWord, PermiteModoVerificacion, PermitePersonalizarPlantillas, PermiteSoportePrioritario,
    AlmacenamientoMaximoEnMB, OrdenDeVisualizacion) VALUES
('BASICO', 'Plan Basico', 'Transcripcion + documento PDF', 79.00, 790.00, 1, 2, 100, 1, 0, 0, 0, 0, 500, 1),
('PROFESIONAL', 'Plan Profesional', 'Modo verificacion + Word editable + PDF', 149.00, 1490.00, 1, 5, 300, 3, 1, 1, 0, 0, 2000, 2),
('CLINICA', 'Plan Clinica', 'Multi-usuario + soporte prioritario + plantillas personalizables', 349.00, 3490.00, 5, 20, 99999, 10, 1, 1, 1, 1, 10000, 3);
GO

INSERT INTO Clinicas (RazonSocial, RucDeLaClinica, NombreComercial, SlugPublico, CorreoDeContacto) VALUES
('Clinica Demo SAC', '20123456789', 'MedScribe Demo', 'medscribe-demo', 'admin@medscribe.pe');
GO

INSERT INTO Suscripciones (IdClinica, IdPlan, EstadoDeLaSuscripcion, EsTrial, DiasDelTrial, FechaFinDelTrial) VALUES
(1, 3, 'TRIAL', 1, 30, DATEADD(DAY, 30, GETDATE()));
GO

EXEC usp_EstablecerContextoDeClinica @IdClinica = 1;
GO

INSERT INTO RolesDeClinica (IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON, EsRolBase) VALUES
(1, 'Administrador', 'Acceso total al sistema', '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":true},"consultas":{"ver":true,"crear":true,"editar":true,"eliminar":true},"documentos":{"ver":true,"crear":true,"editar":true,"eliminar":true},"configuracion":{"ver":true,"crear":true,"editar":true,"eliminar":true},"usuarios":{"ver":true,"crear":true,"editar":true,"eliminar":true},"roles":{"ver":true,"crear":true,"editar":true,"eliminar":true}}', 1),
(1, 'Medico', 'Acceso a pacientes consultas y documentos', '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":false},"consultas":{"ver":true,"crear":true,"editar":true,"eliminar":false},"documentos":{"ver":true,"crear":true,"editar":false,"eliminar":false},"configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false},"usuarios":{"ver":false,"crear":false,"editar":false,"eliminar":false},"roles":{"ver":false,"crear":false,"editar":false,"eliminar":false}}', 1),
(1, 'Recepcionista', 'Acceso limitado', '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":false},"consultas":{"ver":true,"crear":false,"editar":false,"eliminar":false},"documentos":{"ver":true,"crear":false,"editar":false,"eliminar":false},"configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false},"usuarios":{"ver":false,"crear":false,"editar":false,"eliminar":false},"roles":{"ver":false,"crear":false,"editar":false,"eliminar":false}}', 1);
GO

INSERT INTO Usuarios (IdClinica, NombreCompleto, CorreoElectronico, ContrasenaHasheada, RolDelSistema, IdRol, DebeCambiarContrasena) VALUES
(1, 'Administrador del Sistema', 'admin@medscribe.pe', 'Admin2026!', 'Administrador', 1, 0),
(1, 'Jose Roberto', 'jroberto@medscribe.pe', 'Medico2026!', 'Medico', 2, 0);
GO

INSERT INTO Medicos (IdClinica, IdUsuarioVinculado, NombreDelMedico, ApellidoDelMedico, EspecialidadMedica, NumeroColegiaturaDelPeru, TelefonoDeContacto) VALUES
(1, 2, 'Jose', 'Roberto', 'Medicina General', 'CMP-12345', '999888777');
GO

INSERT INTO Pacientes (IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad, FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria) VALUES
(1, 'Maria', 'Garcia Lopez', '72345678', 'DNI', '1990-05-15', 'Femenino', '987654321', 'maria.garcia@gmail.com', 'Av. Arequipa 1234, Lima'),
(1, 'Carlos', 'Torres Mendoza', '45678901', 'DNI', '1985-11-20', 'Masculino', '912345678', 'carlos.torres@gmail.com', 'Jr. Huancayo 567, Lima');
GO

INSERT INTO PlantillasHistoriaClinica (IdClinica, NombreDeLaPlantilla, TipoDocumentoClinico, EsPlantillaPorDefecto) VALUES
(1, 'Nota SOAP Estandar', 'SOAP', 1),
(1, 'Historia Clinica Completa', 'HistoriaClinica', 1),
(1, 'Receta Medica', 'Receta', 1);
GO

INSERT INTO SeccionesDePlantilla (IdClinica, IdPlantilla, NombreDeLaSeccion, DescripcionDeLaSeccion, OrdenDeVisualizacion, EsSeccionObligatoria, TipoDeCampo, InstruccionParaIA) VALUES
(1, 1, 'Subjetivo', 'Motivo de consulta y sintomas referidos por el paciente', 1, 1, 'TextoLibre', 'Extrae los sintomas que refiere el paciente y el motivo de consulta'),
(1, 1, 'Objetivo', 'Signos vitales y hallazgos del examen fisico', 2, 1, 'TextoLibre', 'Extrae signos vitales, hallazgos del examen fisico y resultados de examenes'),
(1, 1, 'Analisis', 'Diagnostico y razonamiento clinico', 3, 1, 'TextoLibre', 'Genera el diagnostico con codigos CIE-10 y razonamiento clinico'),
(1, 1, 'Plan', 'Tratamiento, medicamentos e indicaciones', 4, 1, 'TextoLibre', 'Genera el plan de tratamiento con medicamentos, dosis y proxima cita'),
(1, 2, 'Datos del Paciente', 'Nombre, edad, sexo, documento', 1, 1, 'TextoLibre', 'Extrae datos demograficos del paciente'),
(1, 2, 'Motivo de Consulta', 'Razon principal de la visita', 2, 1, 'TextoLibre', 'Extrae la razon principal por la que acude'),
(1, 2, 'Enfermedad Actual', 'Descripcion cronologica de sintomas', 3, 1, 'TextoLibre', 'Genera descripcion cronologica de los sintomas actuales'),
(1, 2, 'Antecedentes', 'Personales y familiares', 4, 0, 'TextoLibre', 'Extrae antecedentes personales y familiares mencionados'),
(1, 2, 'Examen Fisico', 'Signos vitales y hallazgos', 5, 1, 'TextoLibre', 'Extrae hallazgos del examen fisico por sistemas'),
(1, 2, 'Diagnostico', 'Diagnostico principal y secundarios', 6, 1, 'TextoLibre', 'Genera diagnosticos con codigos CIE-10'),
(1, 2, 'Plan de Tratamiento', 'Medicamentos e indicaciones', 7, 1, 'TextoLibre', 'Genera plan de tratamiento detallado'),
(1, 3, 'Diagnostico', 'Diagnostico con CIE-10', 1, 1, 'TextoLibre', 'Extrae el diagnostico principal con codigo CIE-10'),
(1, 3, 'Prescripcion', 'Medicamentos con dosis y frecuencia', 2, 1, 'TextoLibre', 'Extrae cada medicamento con nombre generico, dosis, via, frecuencia y duracion'),
(1, 3, 'Indicaciones Generales', 'Recomendaciones al paciente', 3, 0, 'TextoLibre', 'Genera recomendaciones generales para el paciente'),
(1, 3, 'Proxima Cita', 'Fecha sugerida para control', 4, 0, 'Fecha', 'Extrae la fecha sugerida para la proxima cita');
GO
