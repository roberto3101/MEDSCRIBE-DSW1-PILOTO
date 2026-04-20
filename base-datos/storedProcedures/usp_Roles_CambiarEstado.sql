USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Roles_CambiarEstado
    @IdRol INT,
    @EstaActivo BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RolesDeClinica
       SET EstaActivo = @EstaActivo
     WHERE IdRol = @IdRol AND EsRolBase = 0;
END
GO
