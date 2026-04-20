import { isValidPhoneNumber } from 'libphonenumber-js'

const SOLO_LETRAS_Y_ESPACIOS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type ResultadoValidacion = string | null

export function validarNombre(valor: string, etiqueta = 'El nombre'): ResultadoValidacion {
  const v = valor.trim()
  if (!v) return `${etiqueta} es obligatorio`
  if (v.length < 2) return `${etiqueta} debe tener al menos 2 caracteres`
  if (v.length > 100) return `${etiqueta} no puede exceder 100 caracteres`
  if (!SOLO_LETRAS_Y_ESPACIOS.test(v)) return `${etiqueta} solo puede contener letras y espacios`
  return null
}

export function sanitizarNombre(valor: string): string {
  return valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, '').slice(0, 100)
}

export function validarDocumentoIdentidad(tipo: string, numero: string): ResultadoValidacion {
  const v = numero.trim().toUpperCase()
  if (!v) return 'El numero de documento es obligatorio'

  if (tipo === 'DNI') {
    if (!/^\d{8}$/.test(v)) return 'El DNI debe tener exactamente 8 digitos'
    return null
  }
  if (tipo === 'CE') {
    if (!/^\d{9,12}$/.test(v)) return 'El CE debe tener entre 9 y 12 digitos'
    return null
  }
  if (tipo === 'Pasaporte') {
    if (!/^[A-Z0-9]{6,12}$/.test(v)) return 'El pasaporte debe tener 6-12 caracteres alfanumericos'
    return null
  }
  return 'Tipo de documento invalido'
}

export function sanitizarDocumento(tipo: string, valor: string): string {
  if (tipo === 'DNI') return valor.replace(/\D/g, '').slice(0, 8)
  if (tipo === 'CE') return valor.replace(/\D/g, '').slice(0, 12)
  if (tipo === 'Pasaporte') return valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12)
  return valor
}

export function obtenerMaxLengthDocumento(tipo: string): number {
  if (tipo === 'DNI') return 8
  if (tipo === 'CE') return 12
  if (tipo === 'Pasaporte') return 12
  return 20
}

export function obtenerPlaceholderDocumento(tipo: string): string {
  if (tipo === 'DNI') return '8 digitos'
  if (tipo === 'CE') return '9-12 digitos'
  if (tipo === 'Pasaporte') return 'Alfanumerico 6-12'
  return ''
}

export function validarFechaNacimiento(valor: string): ResultadoValidacion {
  if (!valor) return 'La fecha de nacimiento es obligatoria'
  const fecha = new Date(valor)
  if (isNaN(fecha.getTime())) return 'Fecha invalida'
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)
  if (fecha > hoy) return 'La fecha no puede ser futura'
  const hace120 = new Date()
  hace120.setFullYear(hace120.getFullYear() - 120)
  if (fecha < hace120) return 'La fecha es demasiado antigua'
  return null
}

export function validarTelefono(valor: string): ResultadoValidacion {
  const v = (valor || '').trim()
  if (!v) return null
  if (v.length < 5) return null
  if (!isValidPhoneNumber(v)) return 'Numero de telefono invalido para el pais seleccionado'
  return null
}

export function validarCorreo(valor: string, obligatorio = false): ResultadoValidacion {
  const v = valor.trim()
  if (!v) return obligatorio ? 'El correo es obligatorio' : null
  if (v.length > 150) return 'El correo no puede exceder 150 caracteres'
  if (!CORREO_VALIDO.test(v)) return 'Correo electronico invalido'
  return null
}

export function validarDireccion(valor: string): ResultadoValidacion {
  const v = valor.trim()
  if (!v) return null
  if (v.length < 5) return 'La direccion debe tener al menos 5 caracteres'
  if (v.length > 300) return 'La direccion no puede exceder 300 caracteres'
  return null
}

export function validarContrasena(valor: string): ResultadoValidacion {
  if (!valor) return 'La contrasena es obligatoria'
  if (valor.length < 8) return 'La contrasena debe tener al menos 8 caracteres'
  if (valor.length > 50) return 'La contrasena no puede exceder 50 caracteres'
  if (!/[a-z]/.test(valor)) return 'Debe contener al menos una minuscula'
  if (!/[A-Z]/.test(valor)) return 'Debe contener al menos una mayuscula'
  if (!/\d/.test(valor)) return 'Debe contener al menos un numero'
  return null
}
