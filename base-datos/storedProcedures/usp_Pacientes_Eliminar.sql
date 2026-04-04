USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Eliminar
    @IdPaciente INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Pacientes SET EstaPacienteActivo = 0, FechaEliminacion = GETDATE() WHERE IdPaciente = @IdPaciente;
END
GO
