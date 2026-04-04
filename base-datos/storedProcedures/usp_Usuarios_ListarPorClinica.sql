USE MedScribeDB;
GO

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
