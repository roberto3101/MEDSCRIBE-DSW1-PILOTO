import { Navigate } from 'react-router-dom'
import { useContextoAutenticacion } from '../contextos/ContextoAutenticacion'

export default function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { estaAutenticado } = useContextoAutenticacion()

  if (!estaAutenticado) return <Navigate to="/iniciar-sesion" replace />

  return <>{children}</>
}
