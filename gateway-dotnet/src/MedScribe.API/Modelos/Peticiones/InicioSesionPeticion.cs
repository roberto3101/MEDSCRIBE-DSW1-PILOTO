using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Peticiones
{
    public class PeticionIniciarSesion
    {
        [Required(ErrorMessage = "El correo electronico es obligatorio")]
        [EmailAddress(ErrorMessage = "El formato del correo electronico no es valido")]
        [StringLength(150)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contrasena es obligatoria")]
        [StringLength(255, MinimumLength = 8, ErrorMessage = "La contrasena debe tener entre 8 y 255 caracteres")]
        public string Contrasena { get; set; } = string.Empty;
    }
}
