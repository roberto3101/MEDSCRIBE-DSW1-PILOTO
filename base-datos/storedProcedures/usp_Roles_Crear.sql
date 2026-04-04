USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Roles_Crear
    @IdClinica INT, @NombreDelRol VARCHAR(50), @DescripcionDelRol VARCHAR(200), @PermisosEnFormatoJSON VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO RolesDeClinica (IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON)
    VALUES (@IdClinica, @NombreDelRol, @DescripcionDelRol, @PermisosEnFormatoJSON);
    SELECT SCOPE_IDENTITY() AS IdRol;
END
GO
