using System.ComponentModel.DataAnnotations;

namespace MedScribe.API.Modelos.Peticiones
{
    public class PeticionRegistrarUsuario
    {
        [Required(ErrorMessage = "El nombre completo es obligatorio")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
        [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$", ErrorMessage = "El nombre solo puede contener letras")]
        public string NombreCompleto { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo electronico es obligatorio")]
        [EmailAddress(ErrorMessage = "El formato del correo electronico no es valido")]
        [StringLength(150)]
        public string CorreoElectronico { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contrasena es obligatoria")]
        [StringLength(255, MinimumLength = 8, ErrorMessage = "La contrasena debe tener entre 8 y 255 caracteres")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$", ErrorMessage = "La contrasena debe contener al menos una mayuscula, una minuscula y un numero")]
        public string Contrasena { get; set; } = string.Empty;

        [Required(ErrorMessage = "El rol es obligatorio")]
        [RegularExpression("^(Administrador|Medico|Recepcionista)$", ErrorMessage = "El rol debe ser Administrador, Medico o Recepcionista")]
        public string RolDelSistema { get; set; } = "Medico";

        [StringLength(100)]
        public string EspecialidadMedica { get; set; } = string.Empty;

        [StringLength(20)]
        [RegularExpression(@"^CMP-\d{4,6}$", ErrorMessage = "El numero de colegiatura debe tener formato CMP-XXXXX")]
        public string NumeroColegiaturaDelPeru { get; set; } = string.Empty;
    }
}
