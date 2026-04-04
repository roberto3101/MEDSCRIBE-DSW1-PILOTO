using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Datos.DAO
{
    public class DocumentoDAO : IDocumentoDAO
    {
        private readonly ProveedorContextoClinica _contexto;

        public DocumentoDAO(ProveedorContextoClinica contexto)
        {
            _contexto = contexto;
        }

        private static Documento MapearDocumentoDesdeLector(SqlDataReader lector)
        {
            return new Documento
            {
                IdDocumento = lector.GetInt32(lector.GetOrdinal("IdDocumento")),
                IdConsultaVinculada = lector.GetInt32(lector.GetOrdinal("IdConsultaVinculada")),
                TipoDocumentoClinico = lector.GetString(lector.GetOrdinal("TipoDocumentoClinico")),
                FormatoDeArchivo = lector.GetString(lector.GetOrdinal("FormatoDeArchivo")),
                RutaFisicaDelArchivo = lector.GetString(lector.GetOrdinal("RutaFisicaDelArchivo")),
                EstadoDeAprobacion = lector.GetString(lector.GetOrdinal("EstadoDeAprobacion")),
                NumeroDeVersion = lector.GetInt32(lector.GetOrdinal("NumeroDeVersion")),
                FechaDeGeneracion = lector.GetDateTime(lector.GetOrdinal("FechaDeGeneracion"))
            };
        }

        public IEnumerable<Documento> ListarDocumentosPorIdMedico(int idMedico)
        {
            var lista = new List<Documento>();
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Documentos_Listar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdMedico", SqlDbType.Int) { Value = idMedico });
            using var lector = comando.ExecuteReader();
            while (lector.Read()) lista.Add(MapearDocumentoDesdeLector(lector));
            return lista;
        }

        public Documento? BuscarDocumentoPorId(int idDocumento)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Documentos_Buscar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdDocumento", SqlDbType.Int) { Value = idDocumento });
            using var lector = comando.ExecuteReader();
            return lector.Read() ? MapearDocumentoDesdeLector(lector) : null;
        }

        public IEnumerable<Documento> ListarDocumentosPorIdConsulta(int idConsulta)
        {
            var lista = new List<Documento>();
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Documentos_PorConsulta", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdConsulta", SqlDbType.Int) { Value = idConsulta });
            using var lector = comando.ExecuteReader();
            while (lector.Read()) lista.Add(MapearDocumentoDesdeLector(lector));
            return lista;
        }

        public int InsertarNuevoDocumento(Documento documento)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Documentos_Insertar", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdClinica", SqlDbType.Int) { Value = _contexto.ObtenerIdClinicaActual() });
            comando.Parameters.Add(new SqlParameter("@IdConsulta", SqlDbType.Int) { Value = documento.IdConsultaVinculada });
            comando.Parameters.Add(new SqlParameter("@TipoDocumento", SqlDbType.VarChar, 50) { Value = documento.TipoDocumentoClinico });
            comando.Parameters.Add(new SqlParameter("@Formato", SqlDbType.VarChar, 10) { Value = documento.FormatoDeArchivo });
            comando.Parameters.Add(new SqlParameter("@RutaArchivo", SqlDbType.VarChar, 500) { Value = documento.RutaFisicaDelArchivo });
            return comando.ExecuteNonQuery();
        }

        public int ActualizarEstadoDeAprobacion(int idDocumento, string nuevoEstado)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Documentos_ActualizarEstado", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdDocumento", SqlDbType.Int) { Value = idDocumento });
            comando.Parameters.Add(new SqlParameter("@Estado", SqlDbType.VarChar, 20) { Value = nuevoEstado });
            return comando.ExecuteNonQuery();
        }
    }
}
