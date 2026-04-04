export const formatearFecha = (fecha: string): string => {
  const objetoFecha = new Date(fecha)
  const dia = objetoFecha.getDate().toString().padStart(2, '0')
  const mes = (objetoFecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = objetoFecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

export const formatearFechaHora = (fecha: string): string => {
  const objetoFecha = new Date(fecha)
  const dia = objetoFecha.getDate().toString().padStart(2, '0')
  const mes = (objetoFecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = objetoFecha.getFullYear()
  const horas = objetoFecha.getHours().toString().padStart(2, '0')
  const minutos = objetoFecha.getMinutes().toString().padStart(2, '0')
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`
}
