using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Entidades
{
    public class PlanSuscripcion
    {
        public int IdPlan { get; set; }

        [Required]
        [RegularExpression("^(Basico|Profesional|Clinica)$")]
        public string NombreDelPlan { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 99999.99)]
        public decimal PrecioMensualEnSoles { get; set; }

        [Required]
        [Range(1, 99999)]
        public int LimiteDeConsultasPorMes { get; set; }

        [StringLength(500)]
        public string DescripcionDeCaracteristicas { get; set; } = string.Empty;

        public bool EstaPlanActivo { get; set; } = true;
    }
}
