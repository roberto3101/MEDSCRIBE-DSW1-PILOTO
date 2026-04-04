USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_EstablecerContextoDeClinica
    @IdClinica INT
AS
BEGIN
    SET NOCOUNT ON;
    EXEC sp_set_session_context @key = N'IdClinica', @value = @IdClinica;
END
GO
