using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Servicios;
using MedScribe.API.Validadores;
using Microsoft.AspNetCore.Mvc;

namespace MedScribe.API.Controladores
{
    [Route("api/consultas")]
    [ApiController]
    public class ConsultaControlador : ControllerBase
    {
        private readonly IConsultaDAO _consultaDAO;
        private readonly ClienteServicioIA _servicioIA;

        private static readonly string[] FormatosDeAudioPermitidos = [".wav", ".mp3", ".m4a", ".ogg", ".webm"];
        private const long TamanoMaximoDeAudioEnBytes = 50 * 1024 * 1024;

        public ConsultaControlador(IConsultaDAO consultaDAO, ClienteServicioIA servicioIA)
        {
            _consultaDAO = consultaDAO;
            _servicioIA = servicioIA;
        }

        [HttpGet("medico/{idMedico:int}")]
        public IActionResult ListarConsultasPorIdMedico(int idMedico)
        {
            var consultas = _consultaDAO.ListarConsultasPorIdMedico(idMedico);
            return Ok(consultas);
        }

        [HttpGet("{idConsulta:int}")]
        public IActionResult BuscarConsultaPorId(int idConsulta)
        {
            var consulta = _consultaDAO.BuscarConsultaPorId(idConsulta);
            if (consulta == null)
                return NotFound(new { mensaje = "Consulta no encontrada" });
            return Ok(consulta);
        }

        [HttpPost]
        public async Task<IActionResult> CrearConsultaDesdeAudioMedico(
            [FromForm] IFormFile archivoDeAudio,
            [FromForm] int idMedicoResponsable,
            [FromForm] int idPacienteAtendido,
            [FromForm] string especialidadMedicaAplicada,
            [FromForm] string tipoDocumentoClinico)
        {
            if (archivoDeAudio == null || archivoDeAudio.Length == 0)
                return BadRequest(new { mensaje = "El archivo de audio es obligatorio" });

            if (archivoDeAudio.Length > TamanoMaximoDeAudioEnBytes)
                return BadRequest(new { mensaje = "El archivo de audio no debe superar los 50 MB" });

            var extensionDelArchivo = Path.GetExtension(archivoDeAudio.FileName).ToLowerInvariant();
            if (!FormatosDeAudioPermitidos.Contains(extensionDelArchivo))
                return BadRequest(new { mensaje = "Formato de audio no permitido. Use: wav, mp3, m4a, ogg, webm" });

            using var flujoDeMemoria = new MemoryStream();
            await archivoDeAudio.CopyToAsync(flujoDeMemoria);
            var bytesDelAudio = flujoDeMemoria.ToArray();

            var transcripcionDelAudio = await _servicioIA.TranscribirAudioATexto(bytesDelAudio, extensionDelArchivo.TrimStart('.'));

            var notaClinicaGenerada = await _servicioIA.ProcesarTranscripcionConOrquestador(
                transcripcionDelAudio,
                SanitizadorDeTexto.LimpiarEntradaDeUsuario(especialidadMedicaAplicada),
                tipoDocumentoClinico);

            var nuevaConsulta = new Consulta
            {
                IdMedicoResponsable = idMedicoResponsable,
                IdPacienteAtendido = idPacienteAtendido,
                EspecialidadMedicaAplicada = SanitizadorDeTexto.LimpiarEntradaDeUsuario(especialidadMedicaAplicada),
                TipoDocumentoClinico = tipoDocumentoClinico,
                RutaArchivoDeAudio = $"audios/{Guid.NewGuid()}{extensionDelArchivo}",
                TranscripcionDelAudio = transcripcionDelAudio,
                NotaClinicaEstructurada = notaClinicaGenerada,
                FechaYHoraDeLaConsulta = DateTime.Now,
                EstadoActualDeLaConsulta = "Borrador"
            };

            var nuevoDocumento = new Documento
            {
                TipoDocumentoClinico = tipoDocumentoClinico,
                FormatoDeArchivo = "PDF",
                RutaFisicaDelArchivo = $"documentos/{Guid.NewGuid()}.pdf"
            };

            int idConsultaGenerado = _consultaDAO.InsertarConsultaConDocumentoEnTransaccion(nuevaConsulta, nuevoDocumento);

            return Created("", new
            {
                idConsulta = idConsultaGenerado,
                transcripcion = transcripcionDelAudio,
                notaClinica = notaClinicaGenerada,
                estado = "Borrador"
            });
        }

        [HttpPost("registrar")]
        public IActionResult RegistrarConsultaYaProcesadaEnBaseDeDatos([FromBody] PeticionRegistrarConsulta peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                using var conexion = new Microsoft.Data.SqlClient.SqlConnection(
                    HttpContext.RequestServices.GetRequiredService<IConfiguration>().GetConnectionString("sql")!);
                conexion.Open();
                using var cmdCtx = new Microsoft.Data.SqlClient.SqlCommand(
                    "EXEC sp_set_session_context @key=N'IdClinica', @value=@Id", conexion);
                cmdCtx.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@Id", System.Data.SqlDbType.Int) { Value = 1 });
                cmdCtx.ExecuteNonQuery();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand("usp_Consultas_RegistrarCompleta", conexion)
                { CommandType = System.Data.CommandType.StoredProcedure };
                cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@IdClinica", System.Data.SqlDbType.Int) { Value = 1 });
                cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@IdMedico", System.Data.SqlDbType.Int) { Value = peticion.IdMedicoResponsable });
                cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@IdPaciente", System.Data.SqlDbType.Int) { Value = peticion.IdPacienteAtendido });
                cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@Especialidad", System.Data.SqlDbType.VarChar, 100) { Value = peticion.Especialidad });
                cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@TipoDocumento", System.Data.SqlDbType.VarChar, 50) { Value = peticion.TipoDocumento });
                cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@Transcripcion", System.Data.SqlDbType.NVarChar) { Value = (object?)peticion.Transcripcion ?? DBNull.Value });
                cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@NotaClinica", System.Data.SqlDbType.NVarChar) { Value = (object?)peticion.NotaClinica ?? DBNull.Value });
                var resultado = cmd.ExecuteScalar();
                int idConsulta = resultado != null ? Convert.ToInt32(resultado) : 0;

                if (idConsulta > 0)
                    return Created("", new { mensaje = "Consulta registrada", idConsulta });
                return StatusCode(500, new { mensaje = "Error al registrar la consulta" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        [HttpPut("{idConsulta:int}/aprobar")]
        public IActionResult AprobarConsultaYDocumentosVinculados(int idConsulta)
        {
            var consultaExistente = _consultaDAO.BuscarConsultaPorId(idConsulta);
            if (consultaExistente == null)
                return NotFound(new { mensaje = "Consulta no encontrada" });

            if (consultaExistente.EstadoActualDeLaConsulta != "Borrador")
                return BadRequest(new { mensaje = "Solo se pueden aprobar consultas en estado Borrador" });

            int resultado = _consultaDAO.AprobarConsultaYDocumentosEnTransaccion(idConsulta);
            if (resultado > 0)
                return Ok(new { mensaje = "Consulta y documentos aprobados correctamente" });
            return StatusCode(500, new { mensaje = "Error al aprobar la consulta" });
        }

        [HttpPut("{idConsulta:int}/rechazar")]
        public IActionResult RechazarConsultaPorId(int idConsulta)
        {
            var consultaExistente = _consultaDAO.BuscarConsultaPorId(idConsulta);
            if (consultaExistente == null)
                return NotFound(new { mensaje = "Consulta no encontrada" });

            if (consultaExistente.EstadoActualDeLaConsulta != "Borrador")
                return BadRequest(new { mensaje = "Solo se pueden rechazar consultas en estado Borrador" });

            int resultado = _consultaDAO.ActualizarEstadoDeLaConsulta(idConsulta, "Rechazado");
            if (resultado > 0)
                return Ok(new { mensaje = "Consulta rechazada correctamente" });
            return StatusCode(500, new { mensaje = "Error al rechazar la consulta" });
        }
    }

    public class PeticionRegistrarConsulta
    {
        public int IdMedicoResponsable { get; set; }
        public int IdPacienteAtendido { get; set; }
        public string Especialidad { get; set; } = string.Empty;
        public string TipoDocumento { get; set; } = "SOAP";
        public string Transcripcion { get; set; } = string.Empty;
        public string NotaClinica { get; set; } = string.Empty;
    }
}
