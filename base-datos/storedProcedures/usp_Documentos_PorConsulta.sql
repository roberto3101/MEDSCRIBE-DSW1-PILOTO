USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Documentos_PorConsulta
    @IdConsulta INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdDocumento, IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo,
           RutaFisicaDelArchivo, EstadoDeAprobacion, NumeroDeVersion, FechaDeGeneracion
    FROM Documentos
    WHERE IdConsultaVinculada = @IdConsulta AND FechaEliminacion IS NULL
    ORDER BY NumeroDeVersion DESC;
END
GO
