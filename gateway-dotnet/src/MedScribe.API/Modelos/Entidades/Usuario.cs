using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Entidades
{
    public class Usuario
    {
        public int IdUsuario { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string NombreCompleto { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        [EmailAddress]
        public string CorreoElectronico { get; set; } = string.Empty;

        [Required]
        [StringLength(255, MinimumLength = 8)]
        public string ContrasenaHasheada { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Administrador|Medico|Recepcionista)$")]
        public string RolDelSistema { get; set; } = "Medico";

        public bool EstaCuentaActiva { get; set; } = true;

        public DateTime FechaRegistroEnSistema { get; set; } = DateTime.Now;
    }
}
