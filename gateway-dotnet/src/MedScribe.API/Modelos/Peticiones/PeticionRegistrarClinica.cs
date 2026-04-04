using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Peticiones
{
    public class PeticionRegistrarClinica
    {
        [Required(ErrorMessage = "La razon social es obligatoria")]
        [StringLength(200, MinimumLength = 2)]
        public string RazonSocial { get; set; } = string.Empty;

        [Required(ErrorMessage = "El RUC es obligatorio")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "El RUC debe tener exactamente 11 digitos")]
        public string Ruc { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre comercial es obligatorio")]
        [StringLength(200, MinimumLength = 2)]
        public string NombreComercial { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo de contacto es obligatorio")]
        [EmailAddress(ErrorMessage = "El formato del correo de contacto no es valido")]
        [StringLength(150)]
        public string CorreoContacto { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre del administrador es obligatorio")]
        [StringLength(100, MinimumLength = 2)]
        public string NombreAdmin { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo del administrador es obligatorio")]
        [EmailAddress(ErrorMessage = "El formato del correo del administrador no es valido")]
        [StringLength(150)]
        public string CorreoAdmin { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contrasena del administrador es obligatoria")]
        [StringLength(255, MinimumLength = 8, ErrorMessage = "La contrasena debe tener entre 8 y 255 caracteres")]
        public string ContrasenaAdmin { get; set; } = string.Empty;
    }
}
