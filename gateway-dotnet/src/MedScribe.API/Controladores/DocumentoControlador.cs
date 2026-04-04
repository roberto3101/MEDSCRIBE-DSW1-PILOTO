using MedScribe.API.Contratos;
using MedScribe.API.Validadores;
using Microsoft.AspNetCore.Mvc;

namespace MedScribe.API.Controladores
{
    [Route("api/documentos")]
    [ApiController]
    public class DocumentoControlador : ControllerBase
    {
        private readonly IDocumentoDAO _documentoDAO;

        public DocumentoControlador(IDocumentoDAO documentoDAO)
        {
            _documentoDAO = documentoDAO;
        }

        [HttpGet("medico/{idMedico:int}")]
        public IActionResult ListarDocumentosPorIdMedico(int idMedico)
        {
            var documentos = _documentoDAO.ListarDocumentosPorIdMedico(idMedico);
            return Ok(documentos);
        }

        [HttpGet("{idDocumento:int}")]
        public IActionResult BuscarDocumentoPorId(int idDocumento)
        {
            var documento = _documentoDAO.BuscarDocumentoPorId(idDocumento);
            if (documento == null)
                return NotFound(new { mensaje = "Documento no encontrado" });
            return Ok(documento);
        }

        [HttpGet("consulta/{idConsulta:int}")]
        public IActionResult ListarDocumentosPorIdConsulta(int idConsulta)
        {
            var documentos = _documentoDAO.ListarDocumentosPorIdConsulta(idConsulta);
            return Ok(documentos);
        }

        [HttpGet("{idDocumento:int}/descargar")]
        public IActionResult DescargarArchivoPorIdDocumento(int idDocumento)
        {
            var documento = _documentoDAO.BuscarDocumentoPorId(idDocumento);
            if (documento == null)
                return NotFound(new { mensaje = "Documento no encontrado" });

            var rutaSegura = SanitizadorDeTexto.LimpiarRutaDeArchivo(documento.RutaFisicaDelArchivo);
            if (!System.IO.File.Exists(rutaSegura))
                return NotFound(new { mensaje = "El archivo fisico no existe en el servidor" });

            var tipoDeContenidoMime = documento.FormatoDeArchivo == "PDF"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            var nombreDelArchivoParaDescarga = $"MedScribe_{documento.TipoDocumentoClinico}_{documento.IdDocumento}.{documento.FormatoDeArchivo.ToLowerInvariant()}";

            return PhysicalFile(rutaSegura, tipoDeContenidoMime, nombreDelArchivoParaDescarga);
        }

        [HttpPut("{idDocumento:int}/aprobar")]
        public IActionResult AprobarDocumentoPorId(int idDocumento)
        {
            var documentoExistente = _documentoDAO.BuscarDocumentoPorId(idDocumento);
            if (documentoExistente == null)
                return NotFound(new { mensaje = "Documento no encontrado" });

            if (documentoExistente.EstadoDeAprobacion != "Borrador")
                return BadRequest(new { mensaje = "Solo se pueden aprobar documentos en estado Borrador" });

            int resultado = _documentoDAO.ActualizarEstadoDeAprobacion(idDocumento, "Aprobado");
            if (resultado > 0)
                return Ok(new { mensaje = "Documento aprobado correctamente" });
            return StatusCode(500, new { mensaje = "Error al aprobar el documento" });
        }
    }
}
