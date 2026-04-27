using MedScribe.API.Contratos;
using MedScribe.API.Modelos.Entidades;
using MedScribe.API.Modelos.Peticiones;
using MedScribe.API.Servicios;
using Microsoft.AspNetCore.Authorization;
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
        private readonly ServicioContrasenas _contrasenas;
        private readonly ServicioJwt _jwt;
        private readonly string _cadenaDeConexion;

        public AutenticacionControlador(IUsuarioDAO usuarioDAO, ProveedorContextoClinica contexto, ServicioContrasenas contrasenas, ServicioJwt jwt, IConfiguration configuracion)
        {
            _usuarioDAO = usuarioDAO;
            _contexto = contexto;
            _contrasenas = contrasenas;
            _jwt = jwt;
            _cadenaDeConexion = configuracion.GetConnectionString("sql")!;
        }

        [AllowAnonymous]
        [HttpPost("iniciar-sesion")]
        public IActionResult IniciarSesionConCredenciales([FromBody] PeticionIniciarSesion peticion)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using var conexion = new SqlConnection(_cadenaDeConexion);
            conexion.Open();
            using var comando = new SqlCommand("usp_Usuarios_ValidarCredenciales", conexion) { CommandType = CommandType.StoredProcedure };
            comando.Parameters.Add(new SqlParameter("@Correo", SqlDbType.VarChar, 150) { Value = peticion.CorreoElectronico });
            using var lector = comando.ExecuteReader();

            if (!lector.Read())
                return Unauthorized(new { mensaje = "Credenciales incorrectas" });

            var idUsuario = lector.GetInt32(lector.GetOrdinal("IdUsuario"));
            var idClinica = lector.GetInt32(lector.GetOrdinal("IdClinica"));
            var idRol = lector.IsDBNull(lector.GetOrdinal("IdRol")) ? 0 : lector.GetInt32(lector.GetOrdinal("IdRol"));
            var estaCuentaActiva = lector.GetBoolean(lector.GetOrdinal("EstaCuentaActiva"));
            var contrasenaAlmacenada = lector.GetString(lector.GetOrdinal("ContrasenaHasheada"));

            if (!_contrasenas.Verificar(peticion.Contrasena, contrasenaAlmacenada))
                return Unauthorized(new { mensaje = "Credenciales incorrectas" });

            if (!estaCuentaActiva)
                return Unauthorized(new { mensaje = "La cuenta se encuentra desactivada" });

            var permisosDelRol = lector.IsDBNull(lector.GetOrdinal("PermisosEnFormatoJSON")) ? "{}" : lector.GetString(lector.GetOrdinal("PermisosEnFormatoJSON"));
            var permisosPersonalizados = lector.IsDBNull(lector.GetOrdinal("PermisosPersonalizadosJSON")) ? "" : lector.GetString(lector.GetOrdinal("PermisosPersonalizadosJSON"));
            var nombreClinica = lector.IsDBNull(lector.GetOrdinal("NombreClinica")) ? "" : lector.GetString(lector.GetOrdinal("NombreClinica"));
            var nombreRol = lector.IsDBNull(lector.GetOrdinal("NombreDelRol")) ? "" : lector.GetString(lector.GetOrdinal("NombreDelRol"));
            var nombreCompleto = lector.GetString(lector.GetOrdinal("NombreCompleto"));
            var correoElectronico = lector.GetString(lector.GetOrdinal("CorreoElectronico"));
            var rolDelSistema = lector.GetString(lector.GetOrdinal("RolDelSistema"));

            lector.Close();

            if (!_contrasenas.EsHashBCrypt(contrasenaAlmacenada))
            {
                try
                {
                    var hashNuevo = _contrasenas.Hashear(peticion.Contrasena);
                    using var comandoRehash = new SqlCommand("usp_Usuarios_ActualizarHashContrasena", conexion) { CommandType = CommandType.StoredProcedure };
                    comandoRehash.Parameters.Add(new SqlParameter("@IdUsuario", SqlDbType.Int) { Value = idUsuario });
                    comandoRehash.Parameters.Add(new SqlParameter("@ContrasenaHasheada", SqlDbType.VarChar, 255) { Value = hashNuevo });
                    comandoRehash.Parameters.Add(new SqlParameter("@LimpiarBanderaDeCambio", SqlDbType.Bit) { Value = 0 });
                    comandoRehash.ExecuteNonQuery();
                }
                catch
                {
                    // Si la migracion perezosa falla, no bloqueamos el login del usuario.
                }
            }

            _contexto.EstablecerClinicaActual(idClinica);

            var token = _jwt.EmitirToken(idUsuario, idClinica, rolDelSistema, idRol, correoElectronico);

            return Ok(new
            {
                mensaje = "Inicio de sesion exitoso",
                token,
                usuario = new
                {
                    idUsuario,
                    idClinica,
                    nombreCompleto,
                    correoElectronico,
                    rolDelSistema,
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
                using var conexion = new SqlConnection(_cadenaDeConexion);
                conexion.Open();

                string? hashAlmacenado;
                using (var comandoBuscar = new SqlCommand("SELECT ContrasenaHasheada FROM Usuarios WHERE IdUsuario = @IdUsuario", conexion))
                {
                    comandoBuscar.Parameters.Add(new SqlParameter("@IdUsuario", SqlDbType.Int) { Value = peticion.IdUsuario });
                    hashAlmacenado = comandoBuscar.ExecuteScalar() as string;
                }

                if (hashAlmacenado == null)
                    return NotFound(new { mensaje = "Usuario no encontrado" });

                if (!_contrasenas.Verificar(peticion.ContrasenaActual, hashAlmacenado))
                    return BadRequest(new { mensaje = "Contrasena actual incorrecta" });

                var hashNuevo = _contrasenas.Hashear(peticion.ContrasenaNueva);
                using var comandoCambiar = new SqlCommand("usp_Usuarios_CambiarContrasena", conexion) { CommandType = CommandType.StoredProcedure };
                comandoCambiar.Parameters.Add(new SqlParameter("@IdUsuario", SqlDbType.Int) { Value = peticion.IdUsuario });
                comandoCambiar.Parameters.Add(new SqlParameter("@ContrasenaHasheadaNueva", SqlDbType.VarChar, 255) { Value = hashNuevo });
                comandoCambiar.ExecuteNonQuery();

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

            var contrasenaHasheada = _contrasenas.Hashear(peticion.Contrasena);

            if (peticion.RolDelSistema == "Medico")
            {
                if (string.IsNullOrWhiteSpace(peticion.EspecialidadMedica) || string.IsNullOrWhiteSpace(peticion.NumeroColegiaturaDelPeru))
                    return BadRequest(new { mensaje = "La especialidad y numero de colegiatura son obligatorios para el rol Medico" });

                var nuevoUsuario = new Usuario
                {
                    NombreCompleto = peticion.NombreCompleto,
                    CorreoElectronico = peticion.CorreoElectronico,
                    ContrasenaHasheada = contrasenaHasheada,
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
                ContrasenaHasheada = contrasenaHasheada,
                RolDelSistema = peticion.RolDelSistema
            };

            int resultado = _usuarioDAO.RegistrarNuevoUsuarioEnSistema(usuario);
            if (resultado > 0)
                return Created("", new { mensaje = "Usuario registrado correctamente" });

            return StatusCode(500, new { mensaje = "Error al registrar el usuario" });
        }
    }
}
