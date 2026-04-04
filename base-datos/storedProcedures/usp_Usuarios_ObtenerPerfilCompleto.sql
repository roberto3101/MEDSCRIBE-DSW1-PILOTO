USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_ObtenerPerfilCompleto
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.IdUsuario, u.IdClinica, u.NombreCompleto, u.CorreoElectronico, u.RolDelSistema,
           u.EstaCuentaActiva, u.DebeCambiarContrasena, u.UltimoAcceso, u.FechaRegistroEnSistema, u.FotoPerfilUrl,
           m.IdMedico, m.NombreDelMedico, m.ApellidoDelMedico, m.EspecialidadMedica,
           m.NumeroColegiaturaDelPeru, m.TelefonoDeContacto, m.EstaMedicoActivo
    FROM Usuarios u LEFT JOIN Medicos m ON u.IdClinica = m.IdClinica AND u.IdUsuario = m.IdUsuarioVinculado
    WHERE u.IdUsuario = @IdUsuario;
END
GO
