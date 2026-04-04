using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using Microsoft.AspNetCore.Mvc;

namespace MedScribe.API.Controladores
{
    [Route("api/pacientes")]
    [ApiController]
    public class PacienteControlador : ControllerBase
    {
        private readonly IPacienteDAO _pacienteDAO;

        public PacienteControlador(IPacienteDAO pacienteDAO)
        {
            _pacienteDAO = pacienteDAO;
        }

        [HttpGet]
        public IActionResult ListarTodosLosPacientesActivos()
        {
            var pacientes = _pacienteDAO.ListarTodosLosPacientesActivos();
            return Ok(pacientes);
        }

        [HttpGet("{idPaciente:int}")]
        public IActionResult BuscarPacientePorId(int idPaciente)
        {
            var paciente = _pacienteDAO.BuscarPacientePorId(idPaciente);
            if (paciente == null)
                return NotFound(new { mensaje = "Paciente no encontrado" });
            return Ok(paciente);
        }

        [HttpGet("documento/{numeroDocumento}")]
        public IActionResult BuscarPacientePorNumeroDocumento(string numeroDocumento)
        {
            if (string.IsNullOrWhiteSpace(numeroDocumento) || numeroDocumento.Length < 8)
                return BadRequest(new { mensaje = "El numero de documento debe tener al menos 8 caracteres" });

            var paciente = _pacienteDAO.BuscarPacientePorNumeroDocumento(numeroDocumento);
            if (paciente == null)
                return NotFound(new { mensaje = "Paciente no encontrado con ese numero de documento" });
            return Ok(paciente);
        }

        [HttpPost]
        public IActionResult InsertarNuevoPaciente([FromBody] Paciente paciente)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var pacienteExistente = _pacienteDAO.BuscarPacientePorNumeroDocumento(paciente.NumeroDocumentoIdentidad);
            if (pacienteExistente != null)
                return Conflict(new { mensaje = "Ya existe un paciente con ese numero de documento" });

            int idPacienteCreado = _pacienteDAO.InsertarNuevoPaciente(paciente);
            if (idPacienteCreado > 0)
                return Created("", new { mensaje = "Paciente registrado correctamente", idPaciente = idPacienteCreado });
            return StatusCode(500, new { mensaje = "Error al registrar el paciente" });
        }

        [HttpPut("{idPaciente:int}")]
        public IActionResult ActualizarDatosDelPaciente(int idPaciente, [FromBody] Paciente paciente)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            paciente.IdPaciente = idPaciente;
            int resultado = _pacienteDAO.ActualizarDatosDelPaciente(paciente);
            if (resultado > 0)
                return Ok(new { mensaje = "Paciente actualizado correctamente" });
            return NotFound(new { mensaje = "Paciente no encontrado" });
        }

        [HttpDelete("{idPaciente:int}")]
        public IActionResult DesactivarPacientePorId(int idPaciente)
        {
            int resultado = _pacienteDAO.DesactivarPacientePorId(idPaciente);
            if (resultado > 0)
                return Ok(new { mensaje = "Paciente desactivado correctamente" });
            return NotFound(new { mensaje = "Paciente no encontrado" });
        }
    }
}
