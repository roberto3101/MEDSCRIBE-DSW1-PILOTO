using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface IUsuarioDAO
    {
        Usuario? ValidarCredencialesPorCorreoYContrasena(string correoElectronico, string contrasena);
        int RegistrarNuevoUsuarioEnSistema(Usuario usuario);
        int RegistrarUsuarioConMedicoEnTransaccion(Usuario usuario, Medico medico);
        Usuario? BuscarUsuarioPorCorreoElectronico(string correoElectronico);
        void CambiarContrasenaDeUsuario(int idUsuario, string contrasenaActual, string contrasenaNueva);
    }
}
