USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_ObtenerPermisosCompletos
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario, u.NombreCompleto, u.RolDelSistema,
           ISNULL(r.NombreDelRol, u.RolDelSistema) AS NombreDelRol,
           ISNULL(r.PermisosEnFormatoJSON, '{}') AS PermisosDelRolBase,
           ISNULL(u.PermisosPersonalizadosJSON, '') AS PermisosPersonalizadosJSON
    FROM Usuarios u
    LEFT JOIN RolesDeClinica r ON u.IdClinica = r.IdClinica AND u.IdRol = r.IdRol
    WHERE u.IdUsuario = @IdUsuario;
END
GO
