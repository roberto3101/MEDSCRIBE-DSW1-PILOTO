USE MedScribeDB;
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
