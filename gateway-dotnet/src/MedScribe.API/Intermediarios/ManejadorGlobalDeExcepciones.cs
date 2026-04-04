using System.Net;
using System.Text.Json;

namespace MedScribe.API.Intermediarios
{
    public class ManejadorGlobalDeExcepciones
    {
        private readonly RequestDelegate _siguienteEnCadena;
        private readonly ILogger<ManejadorGlobalDeExcepciones> _registroDeEventos;

        public ManejadorGlobalDeExcepciones(RequestDelegate siguienteEnCadena, ILogger<ManejadorGlobalDeExcepciones> registroDeEventos)
        {
            _siguienteEnCadena = siguienteEnCadena;
            _registroDeEventos = registroDeEventos;
        }

        public async Task InvokeAsync(HttpContext contextoHttp)
        {
            try
            {
                await _siguienteEnCadena(contextoHttp);
            }
            catch (Exception excepcion)
            {
                _registroDeEventos.LogError(excepcion, "Error no controlado en {Ruta}", contextoHttp.Request.Path);

                contextoHttp.Response.ContentType = "application/json";
                contextoHttp.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

                var respuestaDeError = new
                {
                    codigo = contextoHttp.Response.StatusCode,
                    mensaje = "Ocurrio un error interno en el servidor"
                };

                await contextoHttp.Response.WriteAsync(JsonSerializer.Serialize(respuestaDeError));
            }
        }
    }
}
