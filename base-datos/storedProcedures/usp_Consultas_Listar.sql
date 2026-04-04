USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Consultas_Listar
    @IdMedico INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdConsulta, IdClinica, IdMedicoResponsable, IdPacienteAtendido, EspecialidadMedicaAplicada, TipoDocumentoClinico,
           RutaArchivoDeAudio, TranscripcionDelAudio, NotaClinicaEstructurada, EstadoActualDeLaConsulta, DuracionEnSegundos,
           FechaYHoraDeLaConsulta, FechaCreacionEnSistema
    FROM Consultas
    WHERE IdMedicoResponsable = @IdMedico AND FechaEliminacion IS NULL
    ORDER BY FechaCreacionEnSistema DESC;
END
GO
