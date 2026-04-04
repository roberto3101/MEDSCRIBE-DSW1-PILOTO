USE MedScribeDB;
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
