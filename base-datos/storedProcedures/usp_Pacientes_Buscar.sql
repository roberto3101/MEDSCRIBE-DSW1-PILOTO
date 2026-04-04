USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Buscar
    @IdPaciente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPaciente, IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
           FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria,
           EstaPacienteActivo, FechaRegistroEnSistema
    FROM Pacientes
    WHERE IdPaciente = @IdPaciente AND FechaEliminacion IS NULL;
END
GO
