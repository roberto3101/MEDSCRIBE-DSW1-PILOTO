export interface Usuario {
  idUsuario: number
  nombreCompleto: string
  correoElectronico: string
  rolDelSistema: 'Administrador' | 'Medico' | 'Recepcionista'
  estaCuentaActiva: boolean
}

export interface PeticionIniciarSesion {
  correoElectronico: string
  contrasena: string
}

export interface PeticionRegistrarUsuario {
  nombreCompleto: string
  correoElectronico: string
  contrasena: string
  rolDelSistema: string
  especialidadMedica?: string
  numeroColegiaturaDelPeru?: string
}

export interface RespuestaInicioSesion {
  mensaje: string
  usuario: Usuario
}
