USE MedScribeDB;
GO

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
