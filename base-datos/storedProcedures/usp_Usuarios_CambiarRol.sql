USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Usuarios_CambiarRol
    @IdUsuario INT, @IdRol INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NombreRol VARCHAR(50);
    SELECT @NombreRol = NombreDelRol FROM RolesDeClinica WHERE IdRol = @IdRol;
    UPDATE Usuarios SET IdRol = @IdRol, RolDelSistema = @NombreRol WHERE IdUsuario = @IdUsuario;
END
GO
