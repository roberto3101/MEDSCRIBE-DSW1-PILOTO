using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Datos.DAO
{
    public class SuscripcionDAO : ISuscripcionDAO
    {
        private readonly ProveedorContextoClinica _contexto;

        public SuscripcionDAO(ProveedorContextoClinica contexto)
        {
            _contexto = contexto;
        }

        private static PlanSuscripcion MapearPlanDesdeLector(SqlDataReader lector)
        {
            return new PlanSuscripcion
            {
                IdPlan = lector.GetInt32(lector.GetOrdinal("IdPlan")),
                NombreDelPlan = lector.GetString(lector.GetOrdinal("NombreDelPlan")),
                PrecioMensualEnSoles = lector.GetDecimal(lector.GetOrdinal("PrecioMensualEnSoles")),
                LimiteDeConsultasPorMes = lector.GetInt32(lector.GetOrdinal("LimiteDeConsultasPorMes")),
                DescripcionDeCaracteristicas = lector.IsDBNull(lector.GetOrdinal("DescripcionDeCaracteristicas")) ? string.Empty : lector.GetString(lector.GetOrdinal("DescripcionDeCaracteristicas")),
                EstaPlanActivo = lector.GetBoolean(lector.GetOrdinal("EstaPlanActivo"))
            };
        }

        public IEnumerable<PlanSuscripcion> ListarTodosLosPlanesActivos()
        {
            var lista = new List<PlanSuscripcion>();
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Planes_Listar", conexion) { CommandType = CommandType.StoredProcedure };
            using var lector = comando.ExecuteReader();
            while (lector.Read()) lista.Add(MapearPlanDesdeLector(lector));
            return lista;
        }

        public PlanSuscripcion? BuscarPlanPorId(int idPlan)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Planes_Buscar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdPlan", SqlDbType.Int) { Value = idPlan });
            using var lector = comando.ExecuteReader();
            return lector.Read() ? MapearPlanDesdeLector(lector) : null;
        }
    }
}
