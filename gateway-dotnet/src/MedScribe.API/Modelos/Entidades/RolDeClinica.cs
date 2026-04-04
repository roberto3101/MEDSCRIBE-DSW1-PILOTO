namespace MedScribe.API.Modelos.Entidades
{
    public class RolDeClinica
    {
        public int IdRol { get; set; }
        public int IdClinica { get; set; }
        public string NombreDelRol { get; set; } = string.Empty;
        public string DescripcionDelRol { get; set; } = string.Empty;
        public string PermisosEnFormatoJSON { get; set; } = string.Empty;
        public bool EsRolBase { get; set; }
        public DateTime FechaCreacion { get; set; }
    }
}
