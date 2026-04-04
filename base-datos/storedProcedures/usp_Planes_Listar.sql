USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Planes_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPlan, CodigoDelPlan, NombreDelPlan, DescripcionDelPlan, PrecioMensualEnSoles, PrecioAnualEnSoles,
           MaximoDeSedesPermitidas, MaximoDeUsuariosPermitidos, MaximoDeConsultasPorMes, MaximoDeMedicosPorClinica,
           PermiteGenerarWord, PermiteModoVerificacion, PermitePersonalizarPlantillas, PermiteSoportePrioritario,
           AlmacenamientoMaximoEnMB
    FROM PlanesSuscripcion
    WHERE EstaPlanActivo = 1
    ORDER BY OrdenDeVisualizacion;
END
GO
