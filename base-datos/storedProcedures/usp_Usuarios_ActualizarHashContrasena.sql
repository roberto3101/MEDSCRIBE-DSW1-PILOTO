USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_ActualizarHashContrasena
    @IdUsuario INT,
    @ContrasenaHasheada VARCHAR(255),
    @LimpiarBanderaDeCambio BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Usuarios
    SET ContrasenaHasheada = @ContrasenaHasheada,
        DebeCambiarContrasena = CASE WHEN @LimpiarBanderaDeCambio = 1 THEN 0 ELSE DebeCambiarContrasena END
    WHERE IdUsuario = @IdUsuario;
END
GO
