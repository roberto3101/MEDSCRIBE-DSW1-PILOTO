USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Roles_ListarPorClinica
    @IdClinica INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdRol, IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON, EsRolBase, FechaCreacion
    FROM RolesDeClinica WHERE IdClinica = @IdClinica;
END
GO
