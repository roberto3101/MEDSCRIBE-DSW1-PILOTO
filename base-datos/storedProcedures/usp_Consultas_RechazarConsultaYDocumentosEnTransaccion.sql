USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Consultas_RechazarConsultaYDocumentosEnTransaccion
    @IdConsulta INT,
    @IdUsuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdClinicaActual INT, @EstadoAnterior VARCHAR(30);
    SELECT @IdClinicaActual = IdClinica, @EstadoAnterior = EstadoActualDeLaConsulta FROM Consultas WHERE IdConsulta = @IdConsulta;

    IF @EstadoAnterior IS NULL
    BEGIN
        RAISERROR('La consulta no existe', 16, 1);
        RETURN;
    END
    IF @EstadoAnterior != 'Borrador'
    BEGIN
        RAISERROR('Solo se pueden rechazar consultas en estado Borrador', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE Consultas SET EstadoActualDeLaConsulta = 'Rechazado' WHERE IdConsulta = @IdConsulta;

        UPDATE Documentos SET EstadoDeAprobacion = 'Rechazado'
        WHERE IdConsultaVinculada = @IdConsulta AND EstadoDeAprobacion = 'Borrador' AND FechaEliminacion IS NULL;

        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo, IdUsuarioQueRealizoElCambio)
        VALUES (@IdClinicaActual, @IdConsulta, @EstadoAnterior, 'Rechazado', @IdUsuario);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
