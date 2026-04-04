using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Entidades
{
    public class Medico
    {
        public int IdMedico { get; set; }

        public int IdUsuarioVinculado { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string NombreDelMedico { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string ApellidoDelMedico { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string EspecialidadMedica { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        [RegularExpression(@"^CMP-\d{4,6}$")]
        public string NumeroColegiaturaDelPeru { get; set; } = string.Empty;

        [StringLength(20)]
        [Phone]
        public string TelefonoDeContacto { get; set; } = string.Empty;

        public bool EstaMedicoActivo { get; set; } = true;
    }
}
