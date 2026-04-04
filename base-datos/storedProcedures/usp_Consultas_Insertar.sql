USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Consultas_Insertar
    @IdClinica INT,
    @IdMedico INT,
    @IdPaciente INT,
    @Especialidad VARCHAR(100),
    @TipoDocumento VARCHAR(50),
    @RutaAudio VARCHAR(500),
    @FechaConsulta DATETIME,
    @IdPlantilla INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Consultas (IdClinica, IdMedicoResponsable, IdPacienteAtendido, IdPlantillaUtilizada, EspecialidadMedicaAplicada, TipoDocumentoClinico, RutaArchivoDeAudio, FechaYHoraDeLaConsulta)
    VALUES (@IdClinica, @IdMedico, @IdPaciente, @IdPlantilla, @Especialidad, @TipoDocumento, @RutaAudio, @FechaConsulta);
    SELECT SCOPE_IDENTITY();
END
GO
