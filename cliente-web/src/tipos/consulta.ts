export interface Consulta {
  idConsulta: number
  idMedicoResponsable: number
  idPacienteAtendido: number
  especialidadMedicaAplicada: string
  tipoDocumentoClinico: 'SOAP' | 'HistoriaClinica' | 'Receta'
  rutaArchivoDeAudio: string
  transcripcionDelAudio: string
  notaClinicaEstructurada: string
  estadoActualDeLaConsulta: 'Grabando' | 'Transcribiendo' | 'Procesando' | 'Borrador' | 'Aprobado' | 'Rechazado'
  duracionEnSegundos: number
  fechaYHoraDeLaConsulta: string
  fechaCreacionEnSistema: string
}

export interface RespuestaCrearConsulta {
  idConsulta: number
  transcripcion: string
  notaClinica: string
  estado: string
}
