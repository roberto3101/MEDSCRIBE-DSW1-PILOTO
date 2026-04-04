USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Documentos_Buscar
    @IdDocumento INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdDocumento, IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo,
           RutaFisicaDelArchivo, EstadoDeAprobacion, NumeroDeVersion, FechaDeGeneracion
    FROM Documentos
    WHERE IdDocumento = @IdDocumento AND FechaEliminacion IS NULL;
END
GO
