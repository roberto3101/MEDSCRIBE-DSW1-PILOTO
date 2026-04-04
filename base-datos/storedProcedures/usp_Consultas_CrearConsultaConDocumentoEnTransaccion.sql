USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Consultas_CrearConsultaConDocumentoEnTransaccion
    @IdClinica INT,
    @IdMedico INT,
    @IdPaciente INT,
    @Especialidad VARCHAR(100),
    @TipoDocumento VARCHAR(50),
    @RutaAudio VARCHAR(500),
    @FechaConsulta DATETIME,
    @IdPlantilla INT = NULL,
    @FormatoArchivo VARCHAR(10) = 'PDF',
    @RutaArchivo VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO Consultas (IdClinica, IdMedicoResponsable, IdPacienteAtendido, IdPlantillaUtilizada, EspecialidadMedicaAplicada, TipoDocumentoClinico, RutaArchivoDeAudio, FechaYHoraDeLaConsulta)
        VALUES (@IdClinica, @IdMedico, @IdPaciente, @IdPlantilla, @Especialidad, @TipoDocumento, @RutaAudio, @FechaConsulta);

        DECLARE @IdConsultaGenerado INT = SCOPE_IDENTITY();

        INSERT INTO Documentos (IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo, RutaFisicaDelArchivo)
        VALUES (@IdClinica, @IdConsultaGenerado, @TipoDocumento, @FormatoArchivo, @RutaArchivo);

        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo)
        VALUES (@IdClinica, @IdConsultaGenerado, 'Inexistente', 'Grabando');

        COMMIT TRANSACTION;
        SELECT @IdConsultaGenerado AS IdConsulta;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
