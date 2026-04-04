using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Entidades
{
    public class Documento
    {
        public int IdDocumento { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int IdConsultaVinculada { get; set; }

        [Required]
        [RegularExpression("^(SOAP|HistoriaClinica|Receta)$")]
        public string TipoDocumentoClinico { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(PDF|Word)$")]
        public string FormatoDeArchivo { get; set; } = "PDF";

        [Required]
        [StringLength(500)]
        public string RutaFisicaDelArchivo { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Borrador|Aprobado|Rechazado)$")]
        public string EstadoDeAprobacion { get; set; } = "Borrador";

        [Range(1, 100)]
        public int NumeroDeVersion { get; set; } = 1;

        public DateTime FechaDeGeneracion { get; set; } = DateTime.Now;
    }
}
