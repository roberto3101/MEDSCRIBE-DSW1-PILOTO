USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Documentos_Listar
    @IdMedico INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT d.IdDocumento, d.IdClinica, d.IdConsultaVinculada, d.TipoDocumentoClinico, d.FormatoDeArchivo,
           d.RutaFisicaDelArchivo, d.EstadoDeAprobacion, d.NumeroDeVersion, d.FechaDeGeneracion
    FROM Documentos d
    INNER JOIN Consultas c ON d.IdClinica = c.IdClinica AND d.IdConsultaVinculada = c.IdConsulta
    WHERE c.IdMedicoResponsable = @IdMedico AND d.FechaEliminacion IS NULL
    ORDER BY d.FechaDeGeneracion DESC;
END
GO
