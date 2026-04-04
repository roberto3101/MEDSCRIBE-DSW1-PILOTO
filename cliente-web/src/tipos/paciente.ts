export interface Paciente {
  idPaciente: number
  nombreDelPaciente: string
  apellidoDelPaciente: string
  numeroDocumentoIdentidad: string
  tipoDocumentoIdentidad: 'DNI' | 'CE' | 'Pasaporte'
  fechaDeNacimiento: string
  sexoBiologico: 'Masculino' | 'Femenino'
  telefonoDeContacto: string
  correoElectronico: string
  direccionDomiciliaria: string
  estaPacienteActivo: boolean
  fechaRegistroEnSistema: string
}
