using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface IUsuarioDeClinicaDAO
    {
        IEnumerable<Usuario> ListarUsuariosPorClinica();
        int CrearUsuarioEnClinica(string nombreCompleto, string correoElectronico, string contrasena, string rolDelSistema, int idRol);
        int CambiarRolDeUsuario(int idUsuario, int idRol);
    }
}
