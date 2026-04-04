USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Documentos_Insertar
    @IdClinica INT,
    @IdConsulta INT,
    @TipoDocumento VARCHAR(50),
    @Formato VARCHAR(10),
    @RutaArchivo VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Documentos (IdClinica, IdConsultaVinculada, TipoDocumentoClinico, FormatoDeArchivo, RutaFisicaDelArchivo)
    VALUES (@IdClinica, @IdConsulta, @TipoDocumento, @Formato, @RutaArchivo);
END
GO
