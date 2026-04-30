import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function FormularioLogin() {
  const [correo, establecerCorreo] = useState('')
  const [contrasena, establecerContrasena] = useState('')
  const [mostrarContrasena, establecerMostrarContrasena] = useState(false)
  const [error, establecerError] = useState('')
  const [estaCargando, establecerEstaCargando] = useState(false)
  const { iniciarSesion } = useContextoAutenticacion()
  const navegarHacia = useNavigate()

  const manejarEnvioDeFormulario = async (evento: React.FormEvent) => {
    evento.preventDefault()
    establecerError('')
    establecerEstaCargando(true)

    try {
      await iniciarSesion({ correoElectronico: correo, contrasena })
      navegarHacia('/panel')
    } catch {
      establecerError('Credenciales incorrectas')
    } finally {
      establecerEstaCargando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvioDeFormulario} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Correo Electronico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input
            type="email"
            value={correo}
            onChange={(e) => establecerCorreo(e.target.value)}
            placeholder="medico@clinica.pe"
            required
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Contrasena</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input
            type={mostrarContrasena ? 'text' : 'password'}
            value={contrasena}
            onChange={(e) => establecerContrasena(e.target.value)}
            placeholder="Minimo 8 caracteres"
            required
            minLength={8}
            className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400 transition-all"
          />
          <button
            type="button"
            onClick={() => establecerMostrarContrasena((valor) => !valor)}
            aria-label={mostrarContrasena ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {mostrarContrasena ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={estaCargando}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-medico-500 to-medico-600 text-white py-2.5 rounded-lg text-sm font-medium hover:from-medico-600 hover:to-medico-700 transition-all duration-200 shadow-sm shadow-medico-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {estaCargando ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Iniciar Sesion
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400 mt-4">
        ¿No tienes cuenta?{' '}
        <a href="/registrar-clinica" className="text-medico-500 hover:text-medico-600 font-medium">Registrar clinica</a>
      </p>
    </form>
  )
}
