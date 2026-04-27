using MedScribe.API.Servicios;

namespace MedScribe.API.Intermediarios
{
    public class MiddlewareTenancyDeClinica
    {
        private readonly RequestDelegate _siguiente;

        public MiddlewareTenancyDeClinica(RequestDelegate siguiente)
        {
            _siguiente = siguiente;
        }

        public async Task InvokeAsync(HttpContext contexto, ProveedorContextoClinica proveedor)
        {
            var afirmacionDeClinica = contexto.User?.FindFirst(ServicioJwt.ClaimIdClinica);
            if (afirmacionDeClinica != null
                && int.TryParse(afirmacionDeClinica.Value, out var idClinica)
                && idClinica > 0)
            {
                proveedor.EstablecerClinicaActual(idClinica);
            }
            await _siguiente(contexto);
        }
    }
}
