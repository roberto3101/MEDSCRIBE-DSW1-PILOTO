USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Documentos_AprobarPorConsulta
    @IdConsulta INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Documentos SET EstadoDeAprobacion = 'Aprobado'
    WHERE IdConsultaVinculada = @IdConsulta AND EstadoDeAprobacion = 'Borrador' AND FechaEliminacion IS NULL;
END
GO
