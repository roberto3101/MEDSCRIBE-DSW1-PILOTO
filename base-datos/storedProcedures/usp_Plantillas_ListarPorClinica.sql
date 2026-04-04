USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Plantillas_ListarPorClinica
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPlantilla, IdClinica, NombreDeLaPlantilla, TipoDocumentoClinico, EsPlantillaPorDefecto, EstaPlantillaActiva
    FROM PlantillasHistoriaClinica
    WHERE EstaPlantillaActiva = 1;
END
GO
