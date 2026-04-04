using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface ISuscripcionDAO
    {
        IEnumerable<PlanSuscripcion> ListarTodosLosPlanesActivos();
        PlanSuscripcion? BuscarPlanPorId(int idPlan);
    }
}
