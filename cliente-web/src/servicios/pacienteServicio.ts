import clienteApi from './clienteApi'
import type { Paciente } from '../tipos/paciente'

export const listarPacientes = async (): Promise<Paciente[]> => {
  const respuesta = await clienteApi.get<Paciente[]>('/pacientes')
  return respuesta.data
}

export const buscarPacientePorId = async (id: number): Promise<Paciente> => {
  const respuesta = await clienteApi.get<Paciente>(`/pacientes/${id}`)
  return respuesta.data
}

export const buscarPacientePorDocumento = async (dni: string): Promise<Paciente> => {
  const respuesta = await clienteApi.get<Paciente>(`/pacientes/documento/${dni}`)
  return respuesta.data
}

export const crearPaciente = async (paciente: Partial<Paciente>): Promise<Paciente> => {
  const respuesta = await clienteApi.post<Paciente>('/pacientes', paciente)
  return respuesta.data
}

export const actualizarPaciente = async (id: number, paciente: Partial<Paciente>): Promise<Paciente> => {
  const respuesta = await clienteApi.put<Paciente>(`/pacientes/${id}`, paciente)
  return respuesta.data
}

export const desactivarPaciente = async (id: number): Promise<void> => {
  await clienteApi.delete(`/pacientes/${id}`)
}

export const pacienteServicio = {
  listarPacientes: () => clienteApi.get<Paciente[]>('/pacientes'),
  buscarPacientePorId: (id: number) => clienteApi.get<Paciente>(`/pacientes/${id}`),
  buscarPacientePorDocumento: (dni: string) => clienteApi.get<Paciente>(`/pacientes/documento/${dni}`),
  crearPaciente: (paciente: Partial<Paciente>) => clienteApi.post('/pacientes', paciente),
  actualizarPaciente: (id: number, paciente: Partial<Paciente>) => clienteApi.put(`/pacientes/${id}`, paciente),
  desactivarPaciente: (id: number) => clienteApi.delete(`/pacientes/${id}`),
}
