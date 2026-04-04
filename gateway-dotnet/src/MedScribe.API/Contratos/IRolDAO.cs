using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface IRolDAO
    {
        IEnumerable<RolDeClinica> ListarRolesPorClinica();
        int CrearRol(string nombre, string descripcion, string permisosJson);
        int ActualizarRol(int idRol, string nombre, string descripcion, string permisosJson);
    }
}
