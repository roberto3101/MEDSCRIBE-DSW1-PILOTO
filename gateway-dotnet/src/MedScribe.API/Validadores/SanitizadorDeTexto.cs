using System.Net;
using System.Text.RegularExpressions;

namespace MedScribe.API.Validadores
{
    public static partial class SanitizadorDeTexto
    {
        public static string LimpiarEntradaDeUsuario(string textoSinProcesar)
        {
            if (string.IsNullOrWhiteSpace(textoSinProcesar))
                return string.Empty;

            string textoSinEtiquetasHtml = EliminarEtiquetasHtml().Replace(textoSinProcesar, string.Empty);
            string textoSinScripts = EliminarPatronesDeScript().Replace(textoSinEtiquetasHtml, string.Empty);
            string textoCodeado = WebUtility.HtmlEncode(textoSinScripts);

            return textoCodeado.Trim();
        }

        public static string LimpiarRutaDeArchivo(string rutaSinValidar)
        {
            if (string.IsNullOrWhiteSpace(rutaSinValidar))
                return string.Empty;

            return rutaSinValidar
                .Replace("..", string.Empty)
                .Replace("~", string.Empty)
                .Trim();
        }

        [GeneratedRegex(@"<[^>]*>")]
        private static partial Regex EliminarEtiquetasHtml();

        [GeneratedRegex(@"(javascript|vbscript|expression|onload|onerror|onclick|onmouseover)[\s]*[:=]", RegexOptions.IgnoreCase)]
        private static partial Regex EliminarPatronesDeScript();
    }
}
