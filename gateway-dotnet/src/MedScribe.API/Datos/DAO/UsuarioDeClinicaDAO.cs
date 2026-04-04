using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Net;

namespace MedScribe.API.Datos.DAO
{
    public class UsuarioDeClinicaDAO : IUsuarioDeClinicaDAO
    {
        private readonly ProveedorContextoClinica _contexto;

        public UsuarioDeClinicaDAO(ProveedorContextoClinica contexto)
        {
            _contexto = contexto;
        }

        public IEnumerable<Usuario> ListarUsuariosPorClinica()
        {
            var lista = new List<Usuario>();
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_ListarPorClinica", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            using var lector = comando.ExecuteReader();
            while (lector.Read())
            {
                lista.Add(new Usuario
                {
                    IdUsuario = lector.GetInt32(lector.GetOrdinal("IdUsuario")),
                    NombreCompleto = lector.GetString(lector.GetOrdinal("NombreCompleto")),
                    CorreoElectronico = lector.GetString(lector.GetOrdinal("CorreoElectronico")),
                    RolDelSistema = lector.GetString(lector.GetOrdinal("RolDelSistema")),
                    EstaCuentaActiva = lector.GetBoolean(lector.GetOrdinal("EstaCuentaActiva")),
                    FechaRegistroEnSistema = lector.GetDateTime(lector.GetOrdinal("FechaRegistroEnSistema"))
                });
            }
            return lista;
        }

        public int CrearUsuarioEnClinica(string nombreCompleto, string correoElectronico, string contrasena, string rolDelSistema)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_CrearEnClinica", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            comando.Parameters.Add(new SqlParameter("@Nombre", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(nombreCompleto) });
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = WebUtility.HtmlEncode(correoElectronico) });
            comando.Parameters.Add(new SqlParameter("@Contrasena", SqlDbType.VarChar, 255) { Value = contrasena });
            comando.Parameters.Add(new SqlParameter("@Rol", SqlDbType.VarChar, 20) { Value = rolDelSistema });
            var resultado = comando.ExecuteScalar();
            return resultado != null ? Convert.ToInt32(resultado) : 0;
        }

        public int CambiarRolDeUsuario(int idUsuario, string nuevoRol)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_CambiarRol", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdUsuario", SqlDbType.Int) { Value = idUsuario });
            comando.Parameters.Add(new SqlParameter("@NuevoRol", SqlDbType.VarChar, 20) { Value = nuevoRol });
            return comando.ExecuteNonQuery();
        }
    }
}
