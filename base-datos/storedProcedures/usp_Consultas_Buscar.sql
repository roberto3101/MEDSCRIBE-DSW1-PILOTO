USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Consultas_Buscar
    @IdConsulta INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdConsulta, IdClinica, IdMedicoResponsable, IdPacienteAtendido, EspecialidadMedicaAplicada, TipoDocumentoClinico,
           RutaArchivoDeAudio, TranscripcionDelAudio, NotaClinicaEstructurada, EstadoActualDeLaConsulta, DuracionEnSegundos,
           FechaYHoraDeLaConsulta, FechaCreacionEnSistema
    FROM Consultas
    WHERE IdConsulta = @IdConsulta AND FechaEliminacion IS NULL;
END
GO
