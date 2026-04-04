using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Peticiones;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace MedScribe.API.Controladores
{
    [Route("api/clinicas")]
    [ApiController]
    public class ClinicaControlador : ControllerBase
    {
        private readonly IClinicaDAO _clinicaDAO;

        public ClinicaControlador(IClinicaDAO clinicaDAO)
        {
            _clinicaDAO = clinicaDAO;
        }

        [HttpPost("registrar")]
        public IActionResult RegistrarClinica([FromBody] PeticionRegistrarClinica peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var slug = Regex.Replace(peticion.NombreComercial.ToLower().Trim(), @"\s+", "-");
            slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");

            int idClinica = _clinicaDAO.RegistrarClinicaCompleta(
                peticion.RazonSocial,
                peticion.Ruc,
                peticion.NombreComercial,
                slug,
                peticion.CorreoContacto,
                peticion.NombreAdmin,
                peticion.CorreoAdmin,
                peticion.ContrasenaAdmin
            );

            if (idClinica > 0)
                return Created("", new { mensaje = "Clinica registrada correctamente", idClinica });

            return StatusCode(500, new { mensaje = "Error al registrar la clinica" });
        }
    }
}
