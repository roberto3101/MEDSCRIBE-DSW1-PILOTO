using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface IDocumentoDAO
    {
        IEnumerable<Documento> ListarDocumentosPorIdMedico(int idMedico);
        Documento? BuscarDocumentoPorId(int idDocumento);
        IEnumerable<Documento> ListarDocumentosPorIdConsulta(int idConsulta);
        int InsertarNuevoDocumento(Documento documento);
        int ActualizarEstadoDeAprobacion(int idDocumento, string nuevoEstado);
    }
}
