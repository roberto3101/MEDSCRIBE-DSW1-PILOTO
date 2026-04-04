using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Entidades
{
    public class Consulta
    {
        public int IdConsulta { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int IdMedicoResponsable { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int IdPacienteAtendido { get; set; }

        [Required]
        [StringLength(100)]
        public string EspecialidadMedicaAplicada { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(SOAP|HistoriaClinica|Receta)$")]
        public string TipoDocumentoClinico { get; set; } = "SOAP";

        [StringLength(500)]
        public string RutaArchivoDeAudio { get; set; } = string.Empty;

        public string TranscripcionDelAudio { get; set; } = string.Empty;

        public string NotaClinicaEstructurada { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Grabando|Transcribiendo|Procesando|Borrador|Aprobado|Rechazado)$")]
        public string EstadoActualDeLaConsulta { get; set; } = "Grabando";

        [Range(0, 7200)]
        public int DuracionEnSegundos { get; set; }

        public DateTime FechaYHoraDeLaConsulta { get; set; }

        public DateTime FechaCreacionEnSistema { get; set; } = DateTime.Now;
    }
}
