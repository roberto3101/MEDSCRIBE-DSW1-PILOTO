using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace MedScribe.API.Servicios
{
    public class OpcionesJwt
    {
        public string Secreto { get; set; } = string.Empty;
        public string Emisor { get; set; } = string.Empty;
        public string Audiencia { get; set; } = string.Empty;
        public int DuracionMinutos { get; set; } = 480;
    }

    public class ServicioJwt
    {
        public const string ClaimIdClinica = "id_clinica";
        public const string ClaimIdRol = "id_rol";

        private readonly OpcionesJwt _opciones;
        private readonly SymmetricSecurityKey _llaveDeFirma;

        public ServicioJwt(IConfiguration configuracion)
        {
            _opciones = new OpcionesJwt();
            configuracion.GetSection("Jwt").Bind(_opciones);
            if (string.IsNullOrWhiteSpace(_opciones.Secreto))
                throw new InvalidOperationException("Falta la configuracion Jwt:Secreto");
            _llaveDeFirma = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.Secreto));
        }

        public string Emisor => _opciones.Emisor;
        public string Audiencia => _opciones.Audiencia;
        public SecurityKey LlaveDeFirma => _llaveDeFirma;

        public string EmitirToken(int idUsuario, int idClinica, string rolDelSistema, int idRol, string correoElectronico)
        {
            var afirmaciones = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, idUsuario.ToString()),
                new(JwtRegisteredClaimNames.Email, correoElectronico),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(ClaimTypes.Role, rolDelSistema),
                new(ClaimIdClinica, idClinica.ToString()),
                new(ClaimIdRol, idRol.ToString())
            };

            var credenciales = new SigningCredentials(_llaveDeFirma, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _opciones.Emisor,
                audience: _opciones.Audiencia,
                claims: afirmaciones,
                expires: DateTime.UtcNow.AddMinutes(_opciones.DuracionMinutos),
                signingCredentials: credenciales
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
