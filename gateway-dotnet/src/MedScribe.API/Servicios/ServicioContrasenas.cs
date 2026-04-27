namespace MedScribe.API.Servicios
{
    public class ServicioContrasenas
    {
        private const int FactorDeTrabajo = 12;

        public string Hashear(string contrasenaPlana)
        {
            return BCrypt.Net.BCrypt.HashPassword(contrasenaPlana, FactorDeTrabajo);
        }

        public bool EsHashBCrypt(string contrasenaAlmacenada)
        {
            if (string.IsNullOrEmpty(contrasenaAlmacenada) || contrasenaAlmacenada.Length < 7)
                return false;
            return contrasenaAlmacenada.StartsWith("$2a$") ||
                   contrasenaAlmacenada.StartsWith("$2b$") ||
                   contrasenaAlmacenada.StartsWith("$2y$");
        }

        public bool Verificar(string contrasenaPlana, string contrasenaAlmacenada)
        {
            if (string.IsNullOrEmpty(contrasenaAlmacenada))
                return false;

            if (EsHashBCrypt(contrasenaAlmacenada))
            {
                try
                {
                    return BCrypt.Net.BCrypt.Verify(contrasenaPlana, contrasenaAlmacenada);
                }
                catch
                {
                    return false;
                }
            }

            return string.Equals(contrasenaPlana, contrasenaAlmacenada, StringComparison.Ordinal);
        }
    }
}
