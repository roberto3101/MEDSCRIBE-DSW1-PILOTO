USE MedScribeDB;
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
