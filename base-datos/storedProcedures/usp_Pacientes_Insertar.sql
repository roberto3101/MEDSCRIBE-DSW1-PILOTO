USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Insertar
    @IdClinica INT,
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @NumeroDocumento VARCHAR(20),
    @TipoDocumento VARCHAR(20),
    @FechaNacimiento DATE,
    @Sexo VARCHAR(10),
    @Telefono VARCHAR(20),
    @Correo VARCHAR(150),
    @Direccion VARCHAR(300)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Pacientes WHERE IdClinica = @IdClinica AND NumeroDocumentoIdentidad = @NumeroDocumento AND EstaPacienteActivo = 1 AND FechaEliminacion IS NULL)
    BEGIN
        RAISERROR('Ya existe un paciente activo con ese numero de documento en esta clinica', 16, 1);
        RETURN;
    END
    INSERT INTO Pacientes (IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad,
                          FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria)
    VALUES (@IdClinica, @Nombre, @Apellido, @NumeroDocumento, @TipoDocumento, @FechaNacimiento, @Sexo, @Telefono, @Correo, @Direccion);

    SELECT SCOPE_IDENTITY() AS IdPaciente;
END
GO
