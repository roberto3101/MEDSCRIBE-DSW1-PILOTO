using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface IUsuarioDAO
    {
        int RegistrarNuevoUsuarioEnSistema(Usuario usuario);
        int RegistrarUsuarioConMedicoEnTransaccion(Usuario usuario, Medico medico);
        Usuario? BuscarUsuarioPorCorreoElectronico(string correoElectronico);
    }
}
