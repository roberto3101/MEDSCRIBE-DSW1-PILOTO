export const CLAVE_TOKEN = 'medscribe_token'

const RUTAS_PUBLICAS = [
  '/api/autenticacion/iniciar-sesion',
  '/api/clinicas/registrar',
]

function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN)
}

function urlEsGatewayPrivado(url: string): boolean {
  if (!url.startsWith('/api/')) return false
  return !RUTAS_PUBLICAS.some((ruta) => url.startsWith(ruta))
}

function manejar401() {
  if (window.location.pathname !== '/iniciar-sesion') {
    localStorage.removeItem('medscribe_sesion')
    localStorage.removeItem(CLAVE_TOKEN)
    window.location.href = '/iniciar-sesion'
  }
}

export function instalarTenanciaGlobal() {
  const fetchOriginal = window.fetch.bind(window)
  window.fetch = async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
    const url =
      typeof entrada === 'string'
        ? entrada
        : entrada instanceof URL
          ? entrada.href
          : entrada.url

    const esPrivado = urlEsGatewayPrivado(url)
    if (esPrivado) {
      const token = obtenerToken()
      if (token) {
        const cabeceras = new Headers(opciones?.headers ?? {})
        if (!cabeceras.has('Authorization')) {
          cabeceras.set('Authorization', `Bearer ${token}`)
          opciones = { ...(opciones ?? {}), headers: cabeceras }
        }
      }
    }

    const respuesta = await fetchOriginal(entrada, opciones)
    if (esPrivado && respuesta.status === 401) {
      manejar401()
    }
    return respuesta
  }
}
