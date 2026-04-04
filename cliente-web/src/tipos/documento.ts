export interface Documento {
  idDocumento: number
  idConsultaVinculada: number
  tipoDocumentoClinico: string
  formatoDeArchivo: 'PDF' | 'Word'
  rutaFisicaDelArchivo: string
  estadoDeAprobacion: 'Borrador' | 'Aprobado' | 'Rechazado'
  numeroDeVersion: number
  fechaDeGeneracion: string
}
