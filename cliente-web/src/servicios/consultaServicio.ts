import clienteApi from './clienteApi'
import type { Consulta, RespuestaCrearConsulta } from '../tipos/consulta'

export const listarConsultasPorMedico = async (idMedico: number): Promise<Consulta[]> => {
  const respuesta = await clienteApi.get<Consulta[]>(`/consultas/medico/${idMedico}`)
  return respuesta.data
}

export const buscarConsultaPorId = async (id: number): Promise<Consulta> => {
  const respuesta = await clienteApi.get<Consulta>(`/consultas/${id}`)
  return respuesta.data
}

export const crearConsulta = async (datosFormulario: FormData): Promise<RespuestaCrearConsulta> => {
  const respuesta = await clienteApi.post<RespuestaCrearConsulta>('/consultas', datosFormulario, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return respuesta.data
}

export const aprobarConsulta = async (id: number): Promise<Consulta> => {
  const respuesta = await clienteApi.put<Consulta>(`/consultas/${id}/aprobar`)
  return respuesta.data
}

export const rechazarConsulta = async (id: number): Promise<Consulta> => {
  const respuesta = await clienteApi.put<Consulta>(`/consultas/${id}/rechazar`)
  return respuesta.data
}
