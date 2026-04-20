using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Modelos.Peticiones;
using MedScribe.API.Servicios;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace MedScribe.API.Controladores
{
    [Route("api/autenticacion")]
    [ApiController]
    public class AutenticacionControlador : ControllerBase
    {
        private readonly IUsuarioDAO _usuarioDAO;
        private readonly ProveedorContextoClinica _contexto;
        private readonly string _cadenaDeConexion;

        public AutenticacionControlador(IUsuarioDAO usuarioDAO, ProveedorContextoClinica contexto, IConfiguration configuracion)
        {
            _usuarioDAO = usuarioDAO;
            _contexto = contexto;
            _cadenaDeConexion = configuracion.GetConnectionString("sql")!;
        }

        [HttpPost("iniciar-sesion")]
        public IActionResult IniciarSesionConCredenciales([FromBody] PeticionIniciarSesion peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using var conexion = new SqlConnection(_cadenaDeConexion);
            conexion.Open();
            using var comando = new SqlCommand("usp_Usuarios_ValidarCredenciales", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = peticion.CorreoElectronico });
            comando.Parameters.Add(new SqlParameter("@Contrasena", SqlDbType.VarChar, 255) { Value = peticion.Contrasena });
            using var lector = comando.ExecuteReader();

            if (!lector.Read())
                return Unauthorized(new { mensaje = "Credenciales incorrectas" });

            var idClinica = lector.GetInt32(lector.GetOrdinal("IdClinica"));
            var estaCuentaActiva = lector.GetBoolean(lector.GetOrdinal("EstaCuentaActiva"));

            if (!estaCuentaActiva)
                return Unauthorized(new { mensaje = "La cuenta se encuentra desactivada" });

            _contexto.EstablecerClinicaActual(idClinica);

            var permisosDelRol = lector.IsDBNull(lector.GetOrdinal("PermisosEnFormatoJSON")) ? "{}" : lector.GetString(lector.GetOrdinal("PermisosEnFormatoJSON"));
            var permisosPersonalizados = lector.IsDBNull(lector.GetOrdinal("PermisosPersonalizadosJSON")) ? "" : lector.GetString(lector.GetOrdinal("PermisosPersonalizadosJSON"));
            var nombreClinica = lector.IsDBNull(lector.GetOrdinal("NombreClinica")) ? "" : lector.GetString(lector.GetOrdinal("NombreClinica"));
            var nombreRol = lector.IsDBNull(lector.GetOrdinal("NombreDelRol")) ? "" : lector.GetString(lector.GetOrdinal("NombreDelRol"));

            return Ok(new
            {
                mensaje = "Inicio de sesion exitoso",
                usuario = new
                {
                    idUsuario = lector.GetInt32(lector.GetOrdinal("IdUsuario")),
                    idClinica,
                    nombreCompleto = lector.GetString(lector.GetOrdinal("NombreCompleto")),
                    correoElectronico = lector.GetString(lector.GetOrdinal("CorreoElectronico")),
                    rolDelSistema = lector.GetString(lector.GetOrdinal("RolDelSistema")),
                    nombreRol,
                    nombreClinica,
                    permisosDelRol,
                    permisosPersonalizados,
                }
            });
        }

        [HttpPost("cambiar-contrasena")]
        public IActionResult CambiarContrasenaDeUsuario([FromBody] PeticionCambiarContrasena peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                _usuarioDAO.CambiarContrasenaDeUsuario(peticion.IdUsuario, peticion.ContrasenaActual, peticion.ContrasenaNueva);
                return Ok(new { mensaje = "Contrasena actualizada correctamente" });
            }
            catch (SqlException error) when (error.Number == 50000)
            {
                return BadRequest(new { mensaje = error.Message });
            }
        }

        [HttpPost("registro")]
        public IActionResult RegistrarNuevoUsuarioEnSistema([FromBody] PeticionRegistrarUsuario peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var usuarioExistente = _usuarioDAO.BuscarUsuarioPorCorreoElectronico(peticion.CorreoElectronico);
            if (usuarioExistente != null)
                return Conflict(new { mensaje = "El correo electronico ya esta registrado en el sistema" });

            if (peticion.RolDelSistema == "Medico")
            {
                if (string.IsNullOrWhiteSpace(peticion.EspecialidadMedica) || string.IsNullOrWhiteSpace(peticion.NumeroColegiaturaDelPeru))
                    return BadRequest(new { mensaje = "La especialidad y numero de colegiatura son obligatorios para el rol Medico" });

                var nuevoUsuario = new Usuario
                {
                    NombreCompleto = peticion.NombreCompleto,
                    CorreoElectronico = peticion.CorreoElectronico,
                    ContrasenaHasheada = peticion.Contrasena,
                    RolDelSistema = peticion.RolDelSistema
                };

                var nuevoMedico = new Medico
                {
                    NombreDelMedico = peticion.NombreCompleto.Split(' ')[0],
                    ApellidoDelMedico = string.Join(' ', peticion.NombreCompleto.Split(' ').Skip(1)),
                    EspecialidadMedica = peticion.EspecialidadMedica,
                    NumeroColegiaturaDelPeru = peticion.NumeroColegiaturaDelPeru
                };

                int idGenerado = _usuarioDAO.RegistrarUsuarioConMedicoEnTransaccion(nuevoUsuario, nuevoMedico);
                return Created("", new { mensaje = "Usuario y medico registrados correctamente", idUsuario = idGenerado });
            }

            var usuario = new Usuario
            {
                NombreCompleto = peticion.NombreCompleto,
                CorreoElectronico = peticion.CorreoElectronico,
                ContrasenaHasheada = peticion.Contrasena,
                RolDelSistema = peticion.RolDelSistema
            };

            int resultado = _usuarioDAO.RegistrarNuevoUsuarioEnSistema(usuario);
            if (resultado > 0)
                return Created("", new { mensaje = "Usuario registrado correctamente" });

            return StatusCode(500, new { mensaje = "Error al registrar el usuario" });
        }
    }
}
