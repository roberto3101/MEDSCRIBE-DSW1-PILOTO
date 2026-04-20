USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Consultas_RegistrarCompleta
    @IdClinica INT,
    @IdMedico INT,
    @IdPaciente INT,
    @Especialidad VARCHAR(100),
    @TipoDocumento VARCHAR(50),
    @Transcripcion NVARCHAR(MAX) = NULL,
    @NotaClinica NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO Consultas (
            IdClinica,
            IdMedicoResponsable,
            IdPacienteAtendido,
            EspecialidadMedicaAplicada,
            TipoDocumentoClinico,
            TranscripcionDelAudio,
            NotaClinicaEstructurada,
            EstadoActualDeLaConsulta,
            FechaYHoraDeLaConsulta
        )
        VALUES (
            @IdClinica,
            @IdMedico,
            @IdPaciente,
            @Especialidad,
            @TipoDocumento,
            @Transcripcion,
            @NotaClinica,
            'Borrador',
            GETDATE()
        );

        DECLARE @IdConsultaGenerado INT = SCOPE_IDENTITY();

        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo)
        VALUES (@IdClinica, @IdConsultaGenerado, 'Inexistente', 'Borrador');

        COMMIT TRANSACTION;
        SELECT @IdConsultaGenerado;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
