USE MedScribeDB;
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
