using MedScribe.API.Contratos;
using MedScribe.API.Servicios;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Controladores
{
    [Route("api/usuarios-clinica")]
    [ApiController]
    public class UsuarioDeClinicaControlador : ControllerBase
    {
        private readonly IUsuarioDeClinicaDAO _usuarioDeClinicaDAO;
        private readonly IRolDAO _rolDAO;
        private readonly ProveedorContextoClinica _contexto;
        private readonly ServicioContrasenas _contrasenas;

        public UsuarioDeClinicaControlador(IUsuarioDeClinicaDAO usuarioDeClinicaDAO, IRolDAO rolDAO, ProveedorContextoClinica contexto, ServicioContrasenas contrasenas)
        {
            _usuarioDeClinicaDAO = usuarioDeClinicaDAO;
            _rolDAO = rolDAO;
            _contexto = contexto;
            _contrasenas = contrasenas;
        }

        [HttpGet]
        public IActionResult ListarUsuariosPorClinica()
        {
            var usuarios = _usuarioDeClinicaDAO.ListarUsuariosPorClinica();
            return Ok(usuarios);
        }

        [HttpPost]
        public IActionResult CrearUsuarioEnClinica([FromBody] PeticionCrearUsuarioEnClinica peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var rolElegido = _rolDAO.ListarRolesPorClinica().FirstOrDefault(r => r.IdRol == peticion.IdRol);
            if (rolElegido == null)
                return BadRequest(new { mensaje = "El rol indicado no existe en esta clinica" });

            var rolDelSistema = MapearRolBaseDelSistema(rolElegido.NombreDelRol);

            var contrasenaHasheada = _contrasenas.Hashear(peticion.Contrasena);

            int idUsuario = _usuarioDeClinicaDAO.CrearUsuarioEnClinica(
                peticion.NombreCompleto,
                peticion.CorreoElectronico,
                contrasenaHasheada,
                rolDelSistema,
                peticion.IdRol
            );

            if (idUsuario > 0)
                return Created("", new { mensaje = "Usuario creado correctamente", idUsuario });
            return StatusCode(500, new { mensaje = "Error al crear el usuario" });
        }

        [HttpPut("{idUsuario:int}/cambiar-rol")]
        public IActionResult CambiarRolDeUsuario(int idUsuario, [FromBody] PeticionCambiarRol peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int resultado = _usuarioDeClinicaDAO.CambiarRolDeUsuario(idUsuario, peticion.IdRol);
            if (resultado > 0)
                return Ok(new { mensaje = "Rol actualizado correctamente" });
            return NotFound(new { mensaje = "Usuario no encontrado" });
        }

        [HttpGet("{idUsuario:int}/permisos")]
        public IActionResult ObtenerPermisosDeUsuario(int idUsuario)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_ObtenerPermisosCompletos", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdUsuario", SqlDbType.Int) { Value = idUsuario });
            using var lector = comando.ExecuteReader();
            if (!lector.Read())
                return NotFound(new { mensaje = "Usuario no encontrado" });
            return Ok(new
            {
                idUsuario = lector.GetInt32(lector.GetOrdinal("IdUsuario")),
                nombreCompleto = lector.GetString(lector.GetOrdinal("NombreCompleto")),
                rolDelSistema = lector.GetString(lector.GetOrdinal("RolDelSistema")),
                nombreDelRol = lector.IsDBNull(lector.GetOrdinal("NombreDelRol")) ? "" : lector.GetString(lector.GetOrdinal("NombreDelRol")),
                permisosDelRolBase = lector.IsDBNull(lector.GetOrdinal("PermisosDelRolBase")) ? "{}" : lector.GetString(lector.GetOrdinal("PermisosDelRolBase")),
                permisosPersonalizados = lector.IsDBNull(lector.GetOrdinal("PermisosPersonalizadosJSON")) ? "" : lector.GetString(lector.GetOrdinal("PermisosPersonalizadosJSON")),
            });
        }

        [HttpPut("{idUsuario:int}/permisos")]
        public IActionResult GuardarPermisosPersonalizadosDeUsuario(int idUsuario, [FromBody] PeticionPermisosPersonalizados peticion)
        {
            using var conexion = _contexto.AbrirConexionConContextoDeClinica();
            using var comando = new SqlCommand("usp_Usuarios_ActualizarPermisosPersonalizados", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@IdUsuario", SqlDbType.Int) { Value = idUsuario });
            comando.Parameters.Add(new SqlParameter("@PermisosPersonalizadosJSON", SqlDbType.VarChar, -1) { Value = peticion.PermisosPersonalizadosJSON ?? "{}" });
            comando.ExecuteNonQuery();
            return Ok(new { mensaje = "Permisos personalizados guardados" });
        }

        private static string MapearRolBaseDelSistema(string nombreDelRol)
        {
            if (string.Equals(nombreDelRol, "Administrador", StringComparison.OrdinalIgnoreCase)) return "Administrador";
            if (string.Equals(nombreDelRol, "Recepcionista", StringComparison.OrdinalIgnoreCase)) return "Recepcionista";
            return "Medico";
        }
    }

    public class PeticionPermisosPersonalizados
    {
        public string PermisosPersonalizadosJSON { get; set; } = "{}";
    }

    public class PeticionCrearUsuarioEnClinica
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "El nombre completo es obligatorio")]
        [System.ComponentModel.DataAnnotations.StringLength(100, MinimumLength = 2)]
        public string NombreCompleto { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "El correo electronico es obligatorio")]
        [System.ComponentModel.DataAnnotations.EmailAddress(ErrorMessage = "El formato del correo no es valido")]
        [System.ComponentModel.DataAnnotations.StringLength(150)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "La contrasena es obligatoria")]
        [System.ComponentModel.DataAnnotations.StringLength(255, MinimumLength = 8)]
        public string Contrasena { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un rol")]
        public int IdRol { get; set; }
    }

    public class PeticionCambiarRol
    {
        [System.ComponentModel.DataAnnotations.Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un rol valido")]
        public int IdRol { get; set; }
    }
}
