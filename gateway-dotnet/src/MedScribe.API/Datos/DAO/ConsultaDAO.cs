using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Datos.DAO
{
    public class ConsultaDAO : IConsultaDAO
    {
        private readonly ProveedorContextoClinica _contexto;

        public ConsultaDAO(ProveedorContextoClinica contexto)
        {
            _contexto = contexto;
        }

        private static Consulta MapearConsultaDesdeLector(SqlDataReader lector)
        {
            return new Consulta
            {
                IdConsulta = lector.GetInt32(lector.GetOrdinal("IdConsulta")),
                IdMedicoResponsable = lector.GetInt32(lector.GetOrdinal("IdMedicoResponsable")),
                IdPacienteAtendido = lector.GetInt32(lector.GetOrdinal("IdPacienteAtendido")),
                EspecialidadMedicaAplicada = lector.GetString(lector.GetOrdinal("EspecialidadMedicaAplicada")),
                TipoDocumentoClinico = lector.GetString(lector.GetOrdinal("TipoDocumentoClinico")),
                RutaArchivoDeAudio = lector.IsDBNull(lector.GetOrdinal("RutaArchivoDeAudio")) ? string.Empty : lector.GetString(lector.GetOrdinal("RutaArchivoDeAudio")),
                TranscripcionDelAudio = lector.IsDBNull(lector.GetOrdinal("TranscripcionDelAudio")) ? string.Empty : lector.GetString(lector.GetOrdinal("TranscripcionDelAudio")),
                NotaClinicaEstructurada = lector.IsDBNull(lector.GetOrdinal("NotaClinicaEstructurada")) ? string.Empty : lector.GetString(lector.GetOrdinal("NotaClinicaEstructurada")),
                EstadoActualDeLaConsulta = lector.GetString(lector.GetOrdinal("EstadoActualDeLaConsulta")),
                DuracionEnSegundos = lector.IsDBNull(lector.GetOrdinal("DuracionEnSegundos")) ? 0 : lector.GetInt32(lector.GetOrdinal("DuracionEnSegundos")),
                FechaYHoraDeLaConsulta = lector.GetDateTime(lector.GetOrdinal("FechaYHoraDeLaConsulta")),
                FechaCreacionEnSistema = lector.GetDateTime(lector.GetOrdinal("FechaCreacionEnSistema"))
            };
        }

        public IEnumerable<Consulta> ListarConsultasPorIdMedico(int idMedico)
        {
            var lista = new List<Consulta>();
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Consultas_Listar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdMedico", SqlDbType.Int) { Value = idMedico });
            using var lector = comando.ExecuteReader();
            while (lector.Read()) lista.Add(MapearConsultaDesdeLector(lector));
            return lista;
        }

        public Consulta? BuscarConsultaPorId(int idConsulta)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Consultas_Buscar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdConsulta", SqlDbType.Int) { Value = idConsulta });
            using var lector = comando.ExecuteReader();
            return lector.Read() ? MapearConsultaDesdeLector(lector) : null;
        }

        public int InsertarNuevaConsulta(Consulta consulta)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Consultas_Insertar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            comando.Parameters.Add(new SqlParameter("@IdMedico", SqlDbType.Int) { Value = consulta.IdMedicoResponsable });
            comando.Parameters.Add(new SqlParameter("@IdPaciente", SqlDbType.Int) { Value = consulta.IdPacienteAtendido });
            comando.Parameters.Add(new SqlParameter("@Especialidad", SqlDbType.VarChar, 100) { Value = consulta.EspecialidadMedicaAplicada });
            comando.Parameters.Add(new SqlParameter("@TipoDocumento", SqlDbType.VarChar, 50) { Value = consulta.TipoDocumentoClinico });
            comando.Parameters.Add(new SqlParameter("@RutaAudio", SqlDbType.VarChar, 500) { Value = (object?)consulta.RutaArchivoDeAudio ?? DBNull.Value });
            comando.Parameters.Add(new SqlParameter("@FechaConsulta", SqlDbType.DateTime) { Value = consulta.FechaYHoraDeLaConsulta });
            return Convert.ToInt32(comando.ExecuteScalar());
        }

        public int ActualizarEstadoDeLaConsulta(int idConsulta, string nuevoEstado)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Consultas_ActualizarEstado", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdConsulta", SqlDbType.Int) { Value = idConsulta });
            comando.Parameters.Add(new SqlParameter("@Estado", SqlDbType.VarChar, 30) { Value = nuevoEstado });
            return comando.ExecuteNonQuery();
        }

        public int InsertarConsultaConDocumentoEnTransaccion(Consulta consulta, Documento documento)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Consultas_CrearConsultaConDocumentoEnTransaccion", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            comando.Parameters.Add(new SqlParameter("@IdMedico", SqlDbType.Int) { Value = consulta.IdMedicoResponsable });
            comando.Parameters.Add(new SqlParameter("@IdPaciente", SqlDbType.Int) { Value = consulta.IdPacienteAtendido });
            comando.Parameters.Add(new SqlParameter("@Especialidad", SqlDbType.VarChar, 100) { Value = consulta.EspecialidadMedicaAplicada });
            comando.Parameters.Add(new SqlParameter("@TipoDocumento", SqlDbType.VarChar, 50) { Value = consulta.TipoDocumentoClinico });
            comando.Parameters.Add(new SqlParameter("@RutaAudio", SqlDbType.VarChar, 500) { Value = (object?)consulta.RutaArchivoDeAudio ?? DBNull.Value });
            comando.Parameters.Add(new SqlParameter("@FechaConsulta", SqlDbType.DateTime) { Value = consulta.FechaYHoraDeLaConsulta });
            comando.Parameters.Add(new SqlParameter("@FormatoArchivo", SqlDbType.VarChar, 10) { Value = documento.FormatoDeArchivo });
            comando.Parameters.Add(new SqlParameter("@RutaArchivo", SqlDbType.VarChar, 500) { Value = documento.RutaFisicaDelArchivo });
            var resultado = comando.ExecuteScalar();
            return resultado != null ? Convert.ToInt32(resultado) : 0;
        }

        public int AprobarConsultaYDocumentosEnTransaccion(int idConsulta)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Consultas_AprobarConsultaYDocumentosEnTransaccion", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdConsulta", SqlDbType.Int) { Value = idConsulta });
            return comando.ExecuteNonQuery();
        }
    }
}
