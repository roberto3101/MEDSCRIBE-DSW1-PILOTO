using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Datos.DAO
{
    public class RolDAO : IRolDAO
    {
        private readonly ProveedorContextoClinica _contexto;

        public RolDAO(ProveedorContextoClinica contexto)
        {
            _contexto = contexto;
        }

        private static RolDeClinica MapearRolDesdeLector(SqlDataReader lector)
        {
            int ordinalEstaActivo = -1;
            try { ordinalEstaActivo = lector.GetOrdinal("EstaActivo"); } catch { ordinalEstaActivo = -1; }

            return new RolDeClinica
            {
                IdRol = lector.GetInt32(lector.GetOrdinal("IdRol")),
                IdClinica = lector.GetInt32(lector.GetOrdinal("IdClinica")),
                NombreDelRol = lector.GetString(lector.GetOrdinal("NombreDelRol")),
                DescripcionDelRol = lector.IsDBNull(lector.GetOrdinal("DescripcionDelRol")) ? string.Empty : lector.GetString(lector.GetOrdinal("DescripcionDelRol")),
                PermisosEnFormatoJSON = lector.IsDBNull(lector.GetOrdinal("PermisosEnFormatoJSON")) ? string.Empty : lector.GetString(lector.GetOrdinal("PermisosEnFormatoJSON")),
                EsRolBase = lector.GetBoolean(lector.GetOrdinal("EsRolBase")),
                EstaActivo = ordinalEstaActivo >= 0 && !lector.IsDBNull(ordinalEstaActivo) ? lector.GetBoolean(ordinalEstaActivo) : true,
                FechaCreacion = lector.GetDateTime(lector.GetOrdinal("FechaCreacion"))
            };
        }

        public IEnumerable<RolDeClinica> ListarRolesPorClinica()
        {
            var lista = new List<RolDeClinica>();
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Roles_ListarPorClinica", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            using var lector = comando.ExecuteReader();
            while (lector.Read()) lista.Add(MapearRolDesdeLector(lector));
            return lista;
        }

        public int CrearRol(string nombre, string descripcion, string permisosJson)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Roles_Crear", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            comando.Parameters.Add(new SqlParameter("@NombreDelRol", SqlDbType.VarChar, 100) { Value = nombre });
            comando.Parameters.Add(new SqlParameter("@DescripcionDelRol", SqlDbType.VarChar, 500) { Value = (object?)descripcion ?? DBNull.Value });
            comando.Parameters.Add(new SqlParameter("@PermisosEnFormatoJSON", SqlDbType.NVarChar, -1) { Value = (object?)permisosJson ?? DBNull.Value });
            var resultado = comando.ExecuteScalar();
            return resultado != null ? Convert.ToInt32(resultado) : 0;
        }

        public int ActualizarRol(int idRol, string nombre, string descripcion, string permisosJson)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Roles_Actualizar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdRol", SqlDbType.Int) { Value = idRol });
            comando.Parameters.Add(new SqlParameter("@NombreDelRol", SqlDbType.VarChar, 100) { Value = nombre });
            comando.Parameters.Add(new SqlParameter("@DescripcionDelRol", SqlDbType.VarChar, 500) { Value = (object?)descripcion ?? DBNull.Value });
            comando.Parameters.Add(new SqlParameter("@PermisosEnFormatoJSON", SqlDbType.NVarChar, -1) { Value = (object?)permisosJson ?? DBNull.Value });
            comando.ExecuteNonQuery();
            return 1;
        }

        public int CambiarEstadoDelRol(int idRol, bool estaActivo)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Roles_CambiarEstado", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdRol", SqlDbType.Int) { Value = idRol });
            comando.Parameters.Add(new SqlParameter("@EstaActivo", SqlDbType.Bit) { Value = estaActivo });
            comando.ExecuteNonQuery();
            return 1;
        }
    }
}
