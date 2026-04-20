using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Entidades
{
    public class Paciente : IValidatableObject
    {
        public int IdPaciente { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
        [RegularExpression(@"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$", ErrorMessage = "El nombre solo puede contener letras y espacios")]
        public string NombreDelPaciente { get; set; } = string.Empty;

        [Required(ErrorMessage = "El apellido es obligatorio")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El apellido debe tener entre 2 y 100 caracteres")]
        [RegularExpression(@"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$", ErrorMessage = "El apellido solo puede contener letras y espacios")]
        public string ApellidoDelPaciente { get; set; } = string.Empty;

        [Required(ErrorMessage = "El numero de documento es obligatorio")]
        [StringLength(20, MinimumLength = 6)]
        public string NumeroDocumentoIdentidad { get; set; } = string.Empty;

        [Required(ErrorMessage = "El tipo de documento es obligatorio")]
        [RegularExpression("^(DNI|CE|Pasaporte)$", ErrorMessage = "Tipo de documento invalido")]
        public string TipoDocumentoIdentidad { get; set; } = "DNI";

        [Required(ErrorMessage = "La fecha de nacimiento es obligatoria")]
        public DateTime FechaDeNacimiento { get; set; }

        [Required(ErrorMessage = "El sexo biologico es obligatorio")]
        [RegularExpression("^(Masculino|Femenino)$", ErrorMessage = "Sexo biologico invalido")]
        public string SexoBiologico { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "El telefono no puede exceder 20 caracteres")]
        public string TelefonoDeContacto { get; set; } = string.Empty;

        [StringLength(150, ErrorMessage = "El correo no puede exceder 150 caracteres")]
        [RegularExpression(@"^(|[^\s@]+@[^\s@]+\.[^\s@]{2,})$", ErrorMessage = "Correo electronico invalido")]
        public string CorreoElectronico { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "La direccion no puede exceder 300 caracteres")]
        public string DireccionDomiciliaria { get; set; } = string.Empty;

        public bool EstaPacienteActivo { get; set; } = true;

        public DateTime FechaRegistroEnSistema { get; set; } = DateTime.Now;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var numero = (NumeroDocumentoIdentidad ?? string.Empty).Trim().ToUpperInvariant();

            if (TipoDocumentoIdentidad == "DNI" && !System.Text.RegularExpressions.Regex.IsMatch(numero, @"^\d{8}$"))
            {
                yield return new ValidationResult("El DNI debe tener exactamente 8 digitos", new[] { nameof(NumeroDocumentoIdentidad) });
            }
            else if (TipoDocumentoIdentidad == "CE" && !System.Text.RegularExpressions.Regex.IsMatch(numero, @"^\d{9,12}$"))
            {
                yield return new ValidationResult("El CE debe tener entre 9 y 12 digitos", new[] { nameof(NumeroDocumentoIdentidad) });
            }
            else if (TipoDocumentoIdentidad == "Pasaporte" && !System.Text.RegularExpressions.Regex.IsMatch(numero, @"^[A-Z0-9]{6,12}$"))
            {
                yield return new ValidationResult("El pasaporte debe tener 6-12 caracteres alfanumericos", new[] { nameof(NumeroDocumentoIdentidad) });
            }

            if (FechaDeNacimiento > DateTime.Now)
            {
                yield return new ValidationResult("La fecha de nacimiento no puede ser futura", new[] { nameof(FechaDeNacimiento) });
            }
            if (FechaDeNacimiento < DateTime.Now.AddYears(-120))
            {
                yield return new ValidationResult("La fecha de nacimiento es demasiado antigua", new[] { nameof(FechaDeNacimiento) });
            }
        }
    }
}
