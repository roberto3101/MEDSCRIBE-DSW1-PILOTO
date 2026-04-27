USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_CambiarContrasena
    @IdUsuario INT,
    @ContrasenaHasheadaNueva VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE IdUsuario = @IdUsuario)
    BEGIN
        RAISERROR('Usuario no encontrado', 16, 1);
        RETURN;
    END
    UPDATE Usuarios
    SET ContrasenaHasheada = @ContrasenaHasheadaNueva,
        DebeCambiarContrasena = 0
    WHERE IdUsuario = @IdUsuario;
END
GO
