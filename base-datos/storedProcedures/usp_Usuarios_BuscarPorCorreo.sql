USE MedScribeDB;
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
