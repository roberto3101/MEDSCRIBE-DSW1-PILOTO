using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Net;

namespace MedScribe.API.Datos.DAO
{
    public class UsuarioDAO : IUsuarioDAO
    {
        private readonly ProveedorContextoClinica _contexto;

        public UsuarioDAO(ProveedorContextoClinica contexto)
        {
            _contexto = contexto;
        }

        public Usuario? ValidarCredencialesPorCorreoYContrasena(string correoElectronico, string contrasena)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_ValidarCredenciales", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = WebUtility.HtmlEncode(correoElectronico) });
            comando.Parameters.Add(new SqlParameter("@Contrasena", SqlDbType.VarChar, 255) { Value = contrasena });
            using var lector = comando.ExecuteReader();
            if (lector.Read())
            {
                return new Usuario
                {
                    IdUsuario = lector.GetInt32(lector.GetOrdinal("IdUsuario")),
                    NombreCompleto = lector.GetString(lector.GetOrdinal("NombreCompleto")),
                    CorreoElectronico = lector.GetString(lector.GetOrdinal("CorreoElectronico")),
                    RolDelSistema = lector.GetString(lector.GetOrdinal("RolDelSistema")),
                    EstaCuentaActiva = lector.GetBoolean(lector.GetOrdinal("EstaCuentaActiva"))
                };
            }
            return null;
        }

        public int RegistrarNuevoUsuarioEnSistema(Usuario usuario)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_RegistrarConRetornoId", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            comando.Parameters.Add(new SqlParameter("@Nombre", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(usuario.NombreCompleto) });
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = WebUtility.HtmlEncode(usuario.CorreoElectronico) });
            comando.Parameters.Add(new SqlParameter("@Contrasena", SqlDbType.VarChar, 255) { Value = usuario.ContrasenaHasheada });
            comando.Parameters.Add(new SqlParameter("@Rol", SqlDbType.VarChar, 20) { Value = usuario.RolDelSistema });
            var resultado = comando.ExecuteScalar();
            return resultado != null ? Convert.ToInt32(resultado) : 0;
        }

        public int RegistrarUsuarioConMedicoEnTransaccion(Usuario usuario, Medico medico)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_RegistrarMedicoConUsuarioEnTransaccion", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            comando.Parameters.Add(new SqlParameter("@NombreCompleto", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(usuario.NombreCompleto) });
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = WebUtility.HtmlEncode(usuario.CorreoElectronico) });
            comando.Parameters.Add(new SqlParameter("@Contrasena", SqlDbType.VarChar, 255) { Value = usuario.ContrasenaHasheada });
            comando.Parameters.Add(new SqlParameter("@NombreMedico", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(medico.NombreDelMedico) });
            comando.Parameters.Add(new SqlParameter("@ApellidoMedico", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(medico.ApellidoDelMedico) });
            comando.Parameters.Add(new SqlParameter("@Especialidad", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(medico.EspecialidadMedica) });
            comando.Parameters.Add(new SqlParameter("@NumeroColegiatura", SqlDbType.VarChar, 20) { Value = medico.NumeroColegiaturaDelPeru });
            comando.Parameters.Add(new SqlParameter("@Telefono", SqlDbType.VarChar, 20) { Value = (object?)medico.TelefonoDeContacto ?? DBNull.Value });
            var resultado = comando.ExecuteScalar();
            return resultado != null ? Convert.ToInt32(resultado) : 0;
        }

        public void CambiarContrasenaDeUsuario(int idUsuario, string contrasenaActual, string contrasenaNueva)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_CambiarContrasena", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdUsuario", SqlDbType.Int) { Value = idUsuario });
            comando.Parameters.Add(new SqlParameter("@ContrasenaActual", SqlDbType.VarChar, 255) { Value = contrasenaActual });
            comando.Parameters.Add(new SqlParameter("@ContrasenaNueva", SqlDbType.VarChar, 255) { Value = contrasenaNueva });
            comando.ExecuteNonQuery();
        }

        public Usuario? BuscarUsuarioPorCorreoElectronico(string correoElectronico)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_BuscarPorCorreo", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = WebUtility.HtmlEncode(correoElectronico) });
            using var lector = comando.ExecuteReader();
            if (lector.Read())
            {
                return new Usuario
                {
                    IdUsuario = lector.GetInt32(lector.GetOrdinal("IdUsuario")),
                    NombreCompleto = lector.GetString(lector.GetOrdinal("NombreCompleto")),
                    CorreoElectronico = lector.GetString(lector.GetOrdinal("CorreoElectronico")),
                    RolDelSistema = lector.GetString(lector.GetOrdinal("RolDelSistema")),
                    EstaCuentaActiva = lector.GetBoolean(lector.GetOrdinal("EstaCuentaActiva")),
                    FechaRegistroEnSistema = lector.GetDateTime(lector.GetOrdinal("FechaRegistroEnSistema"))
                };
            }
            return null;
        }
    }
}
