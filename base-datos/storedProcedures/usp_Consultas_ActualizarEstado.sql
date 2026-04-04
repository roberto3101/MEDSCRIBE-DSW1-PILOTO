USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Consultas_ActualizarEstado
    @IdConsulta INT,
    @Estado VARCHAR(30),
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

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE Consultas SET EstadoActualDeLaConsulta = @Estado WHERE IdConsulta = @IdConsulta;
        INSERT INTO AuditoriaDeConsultas (IdClinica, IdConsulta, EstadoAnterior, EstadoNuevo, IdUsuarioQueRealizoElCambio)
        VALUES (@IdClinicaActual, @IdConsulta, @EstadoAnterior, @Estado, @IdUsuario);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
