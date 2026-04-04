import axios from 'axios'

const clienteApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

clienteApi.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/iniciar-sesion'
    }
    return Promise.reject(error)
  }
)

export default clienteApi
