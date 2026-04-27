using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Servicios
{
    public class ProveedorContextoClinica
    {
        private readonly string _cadenaDeConexion;
        private int _idClinicaActual = 0;

        public ProveedorContextoClinica(IConfiguration configuracion)
        {
            _cadenaDeConexion = configuracion.GetConnectionString("sql")!;
        }

        public void EstablecerClinicaActual(int idClinica)
        {
            _idClinicaActual = idClinica;
        }

        public int ObtenerIdClinicaActual()
        {
            return _idClinicaActual;
        }

        public SqlConnection AbrirConexionConContextoDeClinica()
        {
            var conexion = new SqlConnection(_cadenaDeConexion);
            conexion.Open();
            using var comando = new SqlCommand("EXEC sp_set_session_context @key=N'IdClinica', @value=@IdClinica", conexion);
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _idClinicaActual });
            comando.ExecuteNonQuery();
            return conexion;
        }
    }
}
