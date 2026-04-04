namespace MedScribe.API.Contratos
{
    public interface IClinicaDAO
    {
        int RegistrarClinicaCompleta(string razonSocial, string ruc, string nombreComercial, string slug, string correoContacto, string nombreAdmin, string correoAdmin, string contrasenaAdmin);
    }
}
