using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Peticiones
{
    public class PeticionCambiarContrasena
    {
        [Range(1, int.MaxValue, ErrorMessage = "El IdUsuario es obligatorio")]
        public int IdUsuario { get; set; }

        [Required(ErrorMessage = "La contrasena actual es obligatoria")]
        [StringLength(255, MinimumLength = 8)]
        public string ContrasenaActual { get; set; } = string.Empty;

        [Required(ErrorMessage = "La nueva contrasena es obligatoria")]
        [StringLength(255, MinimumLength = 8, ErrorMessage = "La nueva contrasena debe tener entre 8 y 255 caracteres")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Debe contener al menos una mayuscula, una minuscula y un numero")]
        public string ContrasenaNueva { get; set; } = string.Empty;
    }
}
