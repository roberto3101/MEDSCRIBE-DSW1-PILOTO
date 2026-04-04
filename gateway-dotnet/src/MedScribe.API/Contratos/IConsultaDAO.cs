using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface IConsultaDAO
    {
        IEnumerable<Consulta> ListarConsultasPorIdMedico(int idMedico);
        Consulta? BuscarConsultaPorId(int idConsulta);
        int InsertarNuevaConsulta(Consulta consulta);
        int ActualizarEstadoDeLaConsulta(int idConsulta, string nuevoEstado);
        int InsertarConsultaConDocumentoEnTransaccion(Consulta consulta, Documento documento);
        int AprobarConsultaYDocumentosEnTransaccion(int idConsulta);
    }
}
