using MedScribe.API.Contratos;
using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Datos.DAO
{
    public class ClinicaDAO : IClinicaDAO
    {
        private readonly string _cadenaDeConexion;

        public ClinicaDAO(IConfiguration configuracion)
        {
            _cadenaDeConexion = configuracion.GetConnectionString("sql")!;
        }

        public int RegistrarClinicaCompleta(string razonSocial, string ruc, string nombreComercial, string slug, string correoContacto, string nombreAdmin, string correoAdmin, string contrasenaAdmin)
        {
            using var conexion = new SqlConnection(_cadenaDeConexion);
            conexion.Open();
            using var comando = new SqlCommand("usp_Clinicas_RegistrarClinicaCompletaEnTransaccion", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@RazonSocial", SqlDbType.VarChar, 200) { Value = razonSocial });
            comando.Parameters.Add(new SqlParameter("@RucDeLaClinica", SqlDbType.VarChar, 11) { Value = ruc });
            comando.Parameters.Add(new SqlParameter("@NombreComercial", SqlDbType.VarChar, 200) { Value = nombreComercial });
            comando.Parameters.Add(new SqlParameter("@SlugPublico", SqlDbType.VarChar, 100) { Value = slug });
            comando.Parameters.Add(new SqlParameter("@CorreoDeContacto", SqlDbType.VarChar, 150) { Value = correoContacto });
            comando.Parameters.Add(new SqlParameter("@NombreAdmin", SqlDbType.VarChar, 100) { Value = nombreAdmin });
            comando.Parameters.Add(new SqlParameter("@CorreoAdmin", SqlDbType.VarChar, 150) { Value = correoAdmin });
            comando.Parameters.Add(new SqlParameter("@ContrasenaAdmin", SqlDbType.VarChar, 255) { Value = contrasenaAdmin });
            var resultado = comando.ExecuteScalar();
            return resultado != null ? Convert.ToInt32(resultado) : 0;
        }
    }
}
