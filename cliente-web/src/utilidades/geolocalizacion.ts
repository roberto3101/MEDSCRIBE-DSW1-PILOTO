const PAIS_POR_DEFECTO = 'pe'
const URL_IPAPI = 'https://ipapi.co/json/'
const TIEMPO_ESPERA_MS = 4000
const CLAVE_CACHE = 'medscribe_pais_detectado'

export async function detectarCodigoPaisUsuario(): Promise<string> {
  const cacheado = sessionStorage.getItem(CLAVE_CACHE)
  if (cacheado) return cacheado

  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_ESPERA_MS)

  try {
    const respuesta = await fetch(URL_IPAPI, { signal: controlador.signal })
    if (!respuesta.ok) return PAIS_POR_DEFECTO
    const datos = await respuesta.json()
    const codigo = (datos?.country_code || datos?.country || '').toString().toLowerCase()
    const codigoFinal = codigo.length === 2 ? codigo : PAIS_POR_DEFECTO
    sessionStorage.setItem(CLAVE_CACHE, codigoFinal)
    return codigoFinal
  } catch {
    return PAIS_POR_DEFECTO
  } finally {
    clearTimeout(temporizador)
  }
}
