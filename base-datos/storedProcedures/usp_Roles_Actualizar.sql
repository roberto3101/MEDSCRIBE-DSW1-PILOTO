USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Roles_Actualizar
    @IdRol INT, @NombreDelRol VARCHAR(50), @DescripcionDelRol VARCHAR(200), @PermisosEnFormatoJSON VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RolesDeClinica
       SET NombreDelRol = CASE WHEN EsRolBase = 1 THEN NombreDelRol ELSE @NombreDelRol END,
           DescripcionDelRol = @DescripcionDelRol,
           PermisosEnFormatoJSON = @PermisosEnFormatoJSON
     WHERE IdRol = @IdRol;
END
GO
