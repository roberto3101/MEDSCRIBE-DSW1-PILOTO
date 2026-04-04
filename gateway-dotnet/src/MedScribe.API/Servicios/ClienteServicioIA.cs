namespace MedScribe.API.Servicios
{
    public class ClienteServicioIA
    {
        private readonly HttpClient _clienteHttp;
        private readonly string _urlBaseDelServicioIA;
        private static readonly TimeSpan TiempoMaximoDeEspera = TimeSpan.FromSeconds(120);

        public ClienteServicioIA(HttpClient clienteHttp, IConfiguration configuracion)
        {
            _clienteHttp = clienteHttp;
            _clienteHttp.Timeout = TiempoMaximoDeEspera;
            _urlBaseDelServicioIA = configuracion["Microservicios:ServicioIA"]!;
        }

        public async Task<string> TranscribirAudioATexto(byte[] bytesDelAudio, string formatoDeAudio)
        {
            var contenidoMultiparte = new MultipartFormDataContent();
            contenidoMultiparte.Add(new ByteArrayContent(bytesDelAudio), "archivo", $"audio.{formatoDeAudio}");

            var respuestaHttp = await EjecutarPeticionConReintentos(
                () => _clienteHttp.PostAsync($"{_urlBaseDelServicioIA}/api/ia/transcribir", contenidoMultiparte));

            return await respuestaHttp.Content.ReadAsStringAsync();
        }

        public async Task<string> ProcesarTranscripcionConOrquestador(string transcripcion, string especialidad, string tipoDocumento)
        {
            var cuerpoDelapeticion = new { transcripcion, especialidad, tipo_documento = tipoDocumento };

            var respuestaHttp = await EjecutarPeticionConReintentos(
                () => _clienteHttp.PostAsJsonAsync($"{_urlBaseDelServicioIA}/api/ia/procesar", cuerpoDelapeticion));

            return await respuestaHttp.Content.ReadAsStringAsync();
        }

        public async Task<byte[]> GenerarDocumentoPdf(string notaClinica, string tipoDocumento)
        {
            var cuerpoDelapeticion = new { nota_clinica = notaClinica, tipo_documento = tipoDocumento };

            var respuestaHttp = await EjecutarPeticionConReintentos(
                () => _clienteHttp.PostAsJsonAsync($"{_urlBaseDelServicioIA}/api/ia/generar-pdf", cuerpoDelapeticion));

            return await respuestaHttp.Content.ReadAsByteArrayAsync();
        }

        public async Task<byte[]> GenerarDocumentoWord(string notaClinica, string tipoDocumento)
        {
            var cuerpoDelapeticion = new { nota_clinica = notaClinica, tipo_documento = tipoDocumento };

            var respuestaHttp = await EjecutarPeticionConReintentos(
                () => _clienteHttp.PostAsJsonAsync($"{_urlBaseDelServicioIA}/api/ia/generar-word", cuerpoDelapeticion));

            return await respuestaHttp.Content.ReadAsByteArrayAsync();
        }

        private static async Task<HttpResponseMessage> EjecutarPeticionConReintentos(Func<Task<HttpResponseMessage>> ejecutarPeticion, int maximoDeReintentos = 2)
        {
            for (int intentoActual = 0; intentoActual <= maximoDeReintentos; intentoActual++)
            {
                try
                {
                    var respuesta = await ejecutarPeticion();
                    respuesta.EnsureSuccessStatusCode();
                    return respuesta;
                }
                catch (HttpRequestException) when (intentoActual < maximoDeReintentos)
                {
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, intentoActual)));
                }
            }
            throw new HttpRequestException("El servicio de inteligencia artificial no responde despues de multiples reintentos");
        }
    }
}
