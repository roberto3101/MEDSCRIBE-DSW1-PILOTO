USE MedScribeDB;
GO

CREATE OR ALTER PROCEDURE usp_Planes_Buscar
    @IdPlan INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdPlan, CodigoDelPlan, NombreDelPlan, DescripcionDelPlan, PrecioMensualEnSoles, PrecioAnualEnSoles,
           MaximoDeSedesPermitidas, MaximoDeUsuariosPermitidos, MaximoDeConsultasPorMes, MaximoDeMedicosPorClinica,
           PermiteGenerarWord, PermiteModoVerificacion, PermitePersonalizarPlantillas, PermiteSoportePrioritario,
           AlmacenamientoMaximoEnMB
    FROM PlanesSuscripcion
    WHERE IdPlan = @IdPlan;
END
GO
