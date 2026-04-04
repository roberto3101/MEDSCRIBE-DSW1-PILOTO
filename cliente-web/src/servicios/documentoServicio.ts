import clienteApi from './clienteApi'
import type { Documento } from '../tipos/documento'

export const listarDocumentosPorMedico = async (idMedico: number): Promise<Documento[]> => {
  const respuesta = await clienteApi.get<Documento[]>(`/documentos/medico/${idMedico}`)
  return respuesta.data
}

export const buscarDocumentoPorId = async (id: number): Promise<Documento> => {
  const respuesta = await clienteApi.get<Documento>(`/documentos/${id}`)
  return respuesta.data
}

export const descargarDocumento = async (id: number): Promise<Blob> => {
  const respuesta = await clienteApi.get(`/documentos/${id}/descargar`, {
    responseType: 'blob',
  })
  return respuesta.data
}

export const aprobarDocumento = async (id: number): Promise<Documento> => {
  const respuesta = await clienteApi.put<Documento>(`/documentos/${id}/aprobar`)
  return respuesta.data
}
