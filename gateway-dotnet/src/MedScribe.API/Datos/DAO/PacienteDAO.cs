using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Net;

namespace MedScribe.API.Datos.DAO
{
    public class PacienteDAO : IPacienteDAO
    {
        private readonly ProveedorContextoClinica _contexto;

        public PacienteDAO(ProveedorContextoClinica contexto)
        {
            _contexto = contexto;
        }

        private static Paciente MapearPacienteDesdeLector(SqlDataReader lector)
        {
            return new Paciente
            {
                IdPaciente = lector.GetInt32(lector.GetOrdinal("IdPaciente")),
                NombreDelPaciente = lector.GetString(lector.GetOrdinal("NombreDelPaciente")),
                ApellidoDelPaciente = lector.GetString(lector.GetOrdinal("ApellidoDelPaciente")),
                NumeroDocumentoIdentidad = lector.GetString(lector.GetOrdinal("NumeroDocumentoIdentidad")),
                TipoDocumentoIdentidad = lector.GetString(lector.GetOrdinal("TipoDocumentoIdentidad")),
                FechaDeNacimiento = lector.GetDateTime(lector.GetOrdinal("FechaDeNacimiento")),
                SexoBiologico = lector.GetString(lector.GetOrdinal("SexoBiologico")),
                TelefonoDeContacto = lector.IsDBNull(lector.GetOrdinal("TelefonoDeContacto")) ? string.Empty : lector.GetString(lector.GetOrdinal("TelefonoDeContacto")),
                CorreoElectronico = lector.IsDBNull(lector.GetOrdinal("CorreoElectronico")) ? string.Empty : lector.GetString(lector.GetOrdinal("CorreoElectronico")),
                DireccionDomiciliaria = lector.IsDBNull(lector.GetOrdinal("DireccionDomiciliaria")) ? string.Empty : lector.GetString(lector.GetOrdinal("DireccionDomiciliaria")),
                EstaPacienteActivo = lector.GetBoolean(lector.GetOrdinal("EstaPacienteActivo")),
                FechaRegistroEnSistema = lector.GetDateTime(lector.GetOrdinal("FechaRegistroEnSistema"))
            };
        }

        private static void AgregarParametrosDePaciente(SqlCommand comando, Paciente paciente)
        {
            comando.Parameters.Add(new SqlParameter("@Nombre", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(paciente.NombreDelPaciente) });
            comando.Parameters.Add(new SqlParameter("@Apellido", SqlDbType.VarChar, 100) { Value = WebUtility.HtmlEncode(paciente.ApellidoDelPaciente) });
            comando.Parameters.Add(new SqlParameter("@NumeroDocumento", SqlDbType.VarChar, 20) { Value = paciente.NumeroDocumentoIdentidad });
            comando.Parameters.Add(new SqlParameter("@TipoDocumento", SqlDbType.VarChar, 20) { Value = paciente.TipoDocumentoIdentidad });
            comando.Parameters.Add(new SqlParameter("@FechaNacimiento", SqlDbType.Date) { Value = paciente.FechaDeNacimiento });
            comando.Parameters.Add(new SqlParameter("@Sexo", SqlDbType.VarChar, 10) { Value = paciente.SexoBiologico });
            comando.Parameters.Add(new SqlParameter("@Telefono", SqlDbType.VarChar, 20) { Value = (object?)paciente.TelefonoDeContacto ?? DBNull.Value });
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = (object?)paciente.CorreoElectronico ?? DBNull.Value });
            comando.Parameters.Add(new SqlParameter("@Direccion", SqlDbType.VarChar, 300) { Value = (object?)paciente.DireccionDomiciliaria ?? DBNull.Value });
        }

        public IEnumerable<Paciente> ListarTodosLosPacientesActivos()
        {
            var lista = new List<Paciente>();
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Pacientes_Listar", conexion) { CommandType = CommandType.StoredProcedure };
            using var lector = comando.ExecuteReader();
            while (lector.Read()) lista.Add(MapearPacienteDesdeLector(lector));
            return lista;
        }

        public Paciente? BuscarPacientePorId(int idPaciente)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Pacientes_Buscar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdPaciente", SqlDbType.Int) { Value = idPaciente });
            using var lector = comando.ExecuteReader();
            return lector.Read() ? MapearPacienteDesdeLector(lector) : null;
        }

        public Paciente? BuscarPacientePorNumeroDocumento(string numeroDocumento)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Pacientes_BuscarPorDocumento", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@NumeroDocumento", SqlDbType.VarChar, 20) { Value = numeroDocumento });
            using var lector = comando.ExecuteReader();
            return lector.Read() ? MapearPacienteDesdeLector(lector) : null;
        }

        public int InsertarNuevoPaciente(Paciente paciente)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Pacientes_Insertar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            AgregarParametrosDePaciente(comando, paciente);
            var resultado = comando.ExecuteScalar();
            return resultado != null ? Convert.ToInt32(resultado) : 0;
        }

        public int ActualizarDatosDelPaciente(Paciente paciente)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Pacientes_Actualizar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdPaciente", SqlDbType.Int) { Value = paciente.IdPaciente });
            AgregarParametrosDePaciente(comando, paciente);
            return comando.ExecuteNonQuery();
        }

        public int DesactivarPacientePorId(int idPaciente)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Pacientes_Eliminar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdPaciente", SqlDbType.Int) { Value = idPaciente });
            return comando.ExecuteNonQuery();
        }
    }
}
