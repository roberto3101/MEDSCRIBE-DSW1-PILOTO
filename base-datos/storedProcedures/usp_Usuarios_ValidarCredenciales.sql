USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_ValidarCredenciales
    @Correo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario, u.IdClinica, u.NombreCompleto, u.CorreoElectronico, u.RolDelSistema,
           u.EstaCuentaActiva, u.IdRol, u.ContrasenaHasheada,
           r.NombreDelRol, r.PermisosEnFormatoJSON,
           c.NombreComercial AS NombreClinica,
           ISNULL(u.PermisosPersonalizadosJSON, '') AS PermisosPersonalizadosJSON
    FROM Usuarios u
    LEFT JOIN RolesDeClinica r ON u.IdClinica = r.IdClinica AND u.IdRol = r.IdRol
    LEFT JOIN Clinicas c ON u.IdClinica = c.IdClinica
    WHERE u.CorreoElectronico = @Correo;
END
GO
