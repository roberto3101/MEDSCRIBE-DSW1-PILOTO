using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Peticiones;
using MedScribe.API.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace MedScribe.API.Controladores
{
    [Route("api/clinicas")]
    [ApiController]
    public class ClinicaControlador : ControllerBase
    {
        private readonly IClinicaDAO _clinicaDAO;
        private readonly ServicioContrasenas _contrasenas;

        public ClinicaControlador(IClinicaDAO clinicaDAO, ServicioContrasenas contrasenas)
        {
            _clinicaDAO = clinicaDAO;
            _contrasenas = contrasenas;
        }

        [AllowAnonymous]
        [HttpPost("registrar")]
        public IActionResult RegistrarClinica([FromBody] PeticionRegistrarClinica peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var slug = Regex.Replace(peticion.NombreComercial.ToLower().Trim(), @"\s+", "-");
            slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");

            var contrasenaHasheada = _contrasenas.Hashear(peticion.ContrasenaAdmin);

            int idClinica = _clinicaDAO.RegistrarClinicaCompleta(
                peticion.RazonSocial,
                peticion.Ruc,
                peticion.NombreComercial,
                slug,
                peticion.CorreoContacto,
                peticion.NombreAdmin,
                peticion.CorreoAdmin,
                contrasenaHasheada
            );

            if (idClinica > 0)
                return Created("", new { mensaje = "Clinica registrada correctamente", idClinica });

            return StatusCode(500, new { mensaje = "Error al registrar la clinica" });
        }
    }
}
