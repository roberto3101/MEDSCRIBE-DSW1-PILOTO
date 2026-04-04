using MedScribe.API.Modelos.Entidades;

namespace MedScribe.API.Contratos
{
    public interface IPacienteDAO
    {
        IEnumerable<Paciente> ListarTodosLosPacientesActivos();
        Paciente? BuscarPacientePorId(int idPaciente);
        Paciente? BuscarPacientePorNumeroDocumento(string numeroDocumento);
        int InsertarNuevoPaciente(Paciente paciente);
        int ActualizarDatosDelPaciente(Paciente paciente);
        int DesactivarPacientePorId(int idPaciente);
    }
}
