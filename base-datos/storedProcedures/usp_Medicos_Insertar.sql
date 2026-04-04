USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Medicos_Insertar
    @IdClinica INT,
    @IdUsuario INT,
    @Nombre VARCHAR(100),
    @Apellido VARCHAR(100),
    @Especialidad VARCHAR(100),
    @NumeroColegiatura VARCHAR(20),
    @Telefono VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Medicos (IdClinica, IdUsuarioVinculado, NombreDelMedico, ApellidoDelMedico, EspecialidadMedica, NumeroColegiaturaDelPeru, TelefonoDeContacto)
    VALUES (@IdClinica, @IdUsuario, @Nombre, @Apellido, @Especialidad, @NumeroColegiatura, @Telefono);
END
GO
