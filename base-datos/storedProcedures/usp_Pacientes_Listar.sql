USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPaciente, IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
           FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria,
           EstaPacienteActivo, FechaRegistroEnSistema
    FROM Pacientes
    WHERE EstaPacienteActivo = 1 AND FechaEliminacion IS NULL
    ORDER BY ApellidoDelPaciente, NombreDelPaciente;
END
GO
