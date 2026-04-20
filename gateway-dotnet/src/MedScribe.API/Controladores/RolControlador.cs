using MedScribe.API.Contratos;
using Microsoft.AspNetCore.Mvc;

namespace MedScribe.API.Controladores
{
    [Route("api/roles")]
    [ApiController]
    public class RolControlador : ControllerBase
    {
        private readonly IRolDAO _rolDAO;

        public RolControlador(IRolDAO rolDAO)
        {
            _rolDAO = rolDAO;
        }

        [HttpGet]
        public IActionResult ListarRolesPorClinica()
        {
            var roles = _rolDAO.ListarRolesPorClinica();
            return Ok(roles);
        }

        [HttpPost]
        public IActionResult CrearRol([FromBody] PeticionRol peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int idRol = _rolDAO.CrearRol(peticion.Nombre, peticion.Descripcion, peticion.PermisosJson);
            if (idRol > 0)
                return Created("", new { mensaje = "Rol creado correctamente", idRol });
            return StatusCode(500, new { mensaje = "Error al crear el rol" });
        }

        [HttpPut("{idRol:int}")]
        public IActionResult ActualizarRol(int idRol, [FromBody] PeticionRol peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _rolDAO.ActualizarRol(idRol, peticion.Nombre, peticion.Descripcion, peticion.PermisosJson);
            return Ok(new { mensaje = "Rol actualizado correctamente" });
        }

        [HttpPut("{idRol:int}/estado")]
        public IActionResult CambiarEstadoDelRol(int idRol, [FromBody] PeticionCambiarEstadoRol peticion)
        {
            _rolDAO.CambiarEstadoDelRol(idRol, peticion.EstaActivo);
            return Ok(new { mensaje = peticion.EstaActivo ? "Rol reactivado correctamente" : "Rol desactivado correctamente" });
        }
    }

    public class PeticionRol
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "El nombre del rol es obligatorio")]
        [System.ComponentModel.DataAnnotations.StringLength(100, MinimumLength = 2)]
        public string Nombre { get; set; } = string.Empty;

        public string Descripcion { get; set; } = string.Empty;

        public string PermisosJson { get; set; } = string.Empty;
    }

    public class PeticionCambiarEstadoRol
    {
        public bool EstaActivo { get; set; }
    }
}
