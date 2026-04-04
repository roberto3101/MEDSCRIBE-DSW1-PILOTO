USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Documentos_ActualizarEstado
    @IdDocumento INT,
    @Estado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Documentos SET EstadoDeAprobacion = @Estado WHERE IdDocumento = @IdDocumento AND FechaEliminacion IS NULL;
END
GO
