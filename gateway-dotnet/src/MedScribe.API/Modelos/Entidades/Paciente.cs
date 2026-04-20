using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Entidades
{
    public class Paciente
    {
        public int IdPaciente { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string NombreDelPaciente { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string ApellidoDelPaciente { get; set; } = string.Empty;

        [Required]
        [StringLength(20, MinimumLength = 8)]
        [RegularExpression(@"^[A-Z0-9]{8,20}$")]
        public string NumeroDocumentoIdentidad { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(DNI|CE|Pasaporte)$")]
        public string TipoDocumentoIdentidad { get; set; } = "DNI";

        [Required]
        public DateTime FechaDeNacimiento { get; set; }

        [Required]
        [RegularExpression("^(Masculino|Femenino)$")]
        public string SexoBiologico { get; set; } = string.Empty;

        [StringLength(20)]
        public string TelefonoDeContacto { get; set; } = string.Empty;

        [StringLength(150)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [StringLength(300)]
        public string DireccionDomiciliaria { get; set; } = string.Empty;

        public bool EstaPacienteActivo { get; set; } = true;

        public DateTime FechaRegistroEnSistema { get; set; } = DateTime.Now;
    }
}
