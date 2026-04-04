USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_BuscarPorDocumento
    @NumeroDocumento VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPaciente, IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
           FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria,
           EstaPacienteActivo, FechaRegistroEnSistema
    FROM Pacientes
    WHERE NumeroDocumentoIdentidad = @NumeroDocumento AND FechaEliminacion IS NULL;
END
GO
