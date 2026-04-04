USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Pacientes_Actualizar
    @IdPaciente INT,
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
    IF NOT EXISTS (SELECT 1 FROM Pacientes WHERE IdPaciente = @IdPaciente AND FechaEliminacion IS NULL)
    BEGIN
        RAISERROR('El paciente no existe', 16, 1);
        RETURN;
    END
    UPDATE Pacientes SET
        NombreDelPaciente = @Nombre, ApellidoDelPaciente = @Apellido,
        NumeroDocumentoIdentidad = @NumeroDocumento, TipoDocumentoIdentidad = @TipoDocumento,
        FechaDeNacimiento = @FechaNacimiento, SexoBiologico = @Sexo,
        TelefonoDeContacto = @Telefono, CorreoElectronico = @Correo, DireccionDomiciliaria = @Direccion
    WHERE IdPaciente = @IdPaciente;
END
GO
