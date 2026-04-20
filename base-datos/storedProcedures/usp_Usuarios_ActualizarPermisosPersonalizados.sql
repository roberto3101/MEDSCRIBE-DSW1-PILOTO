USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_ActualizarPermisosPersonalizados
    @IdUsuario INT,
    @PermisosPersonalizadosJSON VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Usuarios
       SET PermisosPersonalizadosJSON = @PermisosPersonalizadosJSON
     WHERE IdUsuario = @IdUsuario;
END
GO
