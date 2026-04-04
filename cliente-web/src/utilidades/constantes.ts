export const URL_BASE_API = '/api'

export const ROLES_DEL_SISTEMA = {
  ADMINISTRADOR: 'Administrador',
  MEDICO: 'Medico',
  RECEPCIONISTA: 'Recepcionista',
} as const

export const ESTADOS_DE_CONSULTA = {
  GRABANDO: 'Grabando',
  TRANSCRIBIENDO: 'Transcribiendo',
  PROCESANDO: 'Procesando',
  BORRADOR: 'Borrador',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
} as const

export const ESTADOS_DE_APROBACION = {
  BORRADOR: 'Borrador',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
} as const

export const TIPOS_DOCUMENTO_CLINICO = {
  SOAP: 'SOAP',
  HISTORIA_CLINICA: 'HistoriaClinica',
  RECETA: 'Receta',
} as const

export const TIPOS_DOCUMENTO_IDENTIDAD = {
  DNI: 'DNI',
  CE: 'CE',
  PASAPORTE: 'Pasaporte',
} as const

export const FORMATOS_DE_ARCHIVO = {
  PDF: 'PDF',
  WORD: 'Word',
} as const

export const SEXO_BIOLOGICO = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
} as const
