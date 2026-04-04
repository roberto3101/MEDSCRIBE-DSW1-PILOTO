import clienteApi from './clienteApi'
import type { PeticionIniciarSesion, PeticionRegistrarUsuario, RespuestaInicioSesion } from '../tipos/usuario'

export const iniciarSesion = async (peticion: PeticionIniciarSesion): Promise<RespuestaInicioSesion> => {
  const respuesta = await clienteApi.post<RespuestaInicioSesion>('/autenticacion/iniciar-sesion', peticion)
  return respuesta.data
}

export const registrarUsuario = async (peticion: PeticionRegistrarUsuario): Promise<RespuestaInicioSesion> => {
  const respuesta = await clienteApi.post<RespuestaInicioSesion>('/autenticacion/registro', peticion)
  return respuesta.data
}
