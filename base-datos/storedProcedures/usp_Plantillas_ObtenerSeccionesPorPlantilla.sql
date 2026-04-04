USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Plantillas_ObtenerSeccionesPorPlantilla
    @IdPlantilla INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdSeccion, IdClinica, IdPlantilla, NombreDeLaSeccion, DescripcionDeLaSeccion, OrdenDeVisualizacion,
           EsSeccionObligatoria, TipoDeCampo, OpcionesDeSeleccion, InstruccionParaIA
    FROM SeccionesDePlantilla
    WHERE IdPlantilla = @IdPlantilla AND EstaSeccionActiva = 1
    ORDER BY OrdenDeVisualizacion;
END
GO
