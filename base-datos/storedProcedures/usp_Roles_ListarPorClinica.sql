USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Roles_ListarPorClinica
    @IdClinica INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdRol, IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON,
           EsRolBase, ISNULL(EstaActivo, 1) AS EstaActivo, FechaCreacion
    FROM RolesDeClinica WHERE IdClinica = @IdClinica;
END
GO
