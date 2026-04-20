import { useState } from 'react'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'
import { validarContrasena } from '../../utilidades/validaciones'
import { UserCircle, Mail, Shield, Lock, Save, CheckCircle, Calendar, Stethoscope } from 'lucide-react'

export default function PaginaPerfil() {
  const { usuario } = useContextoAutenticacion()
  const [contrasenaActual, establecerContrasenaActual] = useState('')
  const [contrasenaNueva, establecerContrasenaNueva] = useState('')
  const [confirmarContrasena, establecerConfirmarContrasena] = useState('')
  const [mensajeExito, establecerMensajeExito] = useState('')
  const [error, establecerError] = useState('')

  const manejarCambioContrasena = async (evento: React.FormEvent) => {
    evento.preventDefault()
    establecerError('')

    if (!contrasenaActual) {
      establecerError('Debes ingresar tu contrasena actual')
      return
    }
    const errorValidacion = validarContrasena(contrasenaNueva)
    if (errorValidacion) {
      establecerError(errorValidacion)
      return
    }
    if (contrasenaNueva === contrasenaActual) {
      establecerError('La nueva contrasena debe ser diferente a la actual')
      return
    }
    if (contrasenaNueva !== confirmarContrasena) {
      establecerError('Las contrasenas no coinciden')
      return
    }
    if (!usuario?.idUsuario) {
      establecerError('No se pudo identificar al usuario')
      return
    }

    try {
      const respuesta = await fetch('/api/autenticacion/cambiar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuario: usuario.idUsuario,
          contrasenaActual,
          contrasenaNueva,
        }),
      })
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}))
        establecerError(datos?.mensaje || 'Error al actualizar la contrasena')
        return
      }
      establecerMensajeExito('Contrasena actualizada correctamente')
      establecerContrasenaActual('')
      establecerContrasenaNueva('')
      establecerConfirmarContrasena('')
      setTimeout(() => establecerMensajeExito(''), 3000)
    } catch {
      establecerError('Error de red al cambiar la contrasena')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <UserCircle className="w-7 h-7 text-medico-500" />
          Mi Perfil
        </h1>
        <p className="text-slate-400 mt-1">Informacion de tu cuenta y datos profesionales</p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {mensajeExito}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-medico-400 to-medico-600 rounded-2xl flex items-center justify-center shadow-lg shadow-medico-200 flex-shrink-0">
            <span className="text-3xl font-bold text-white">
              {usuario?.nombreCompleto?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800">{usuario?.nombreCompleto}</h2>
            <p className="text-sm text-slate-400">{usuario?.correoElectronico}</p>
            <div className="flex gap-2 mt-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                usuario?.rolDelSistema === 'Administrador' ? 'bg-amber-50 text-amber-600' :
                usuario?.rolDelSistema === 'Medico' ? 'bg-medico-50 text-medico-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {usuario?.rolDelSistema}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                Cuenta activa
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-medico-500" />
            Datos de la Cuenta
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">Nombre Completo</span>
              <span className="text-sm text-slate-700 font-medium">{usuario?.nombreCompleto}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">Correo Electronico</span>
              <span className="text-sm text-slate-600">{usuario?.correoElectronico}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">Rol del Sistema</span>
              <span className="text-sm text-slate-600">{usuario?.rolDelSistema}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">ID de Usuario</span>
              <span className="text-sm text-slate-600">{usuario?.idUsuario}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs text-slate-400">Estado</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-emerald-600">Activa</span>
              </div>
            </div>
          </div>
        </div>

        {usuario?.rolDelSistema === 'Medico' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-medico-500" />
              Datos Profesionales
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">Especialidad</span>
                <span className="text-sm text-slate-600">Medicina General</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">Colegiatura</span>
                <span className="text-sm text-slate-600">CMP-12345</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">Telefono</span>
                <span className="text-sm text-slate-600">999888777</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-slate-400">Estado Medico</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-emerald-600">Activo</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-medico-500" />
          Cambiar Contrasena
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">{error}</div>
        )}

        <form onSubmit={manejarCambioContrasena} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Contrasena Actual</label>
            <input type="password" value={contrasenaActual} onChange={(e) => establecerContrasenaActual(e.target.value)}
              required minLength={8} maxLength={50} placeholder="Ingresa tu contrasena actual"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nueva Contrasena</label>
              <input type="password" value={contrasenaNueva} onChange={(e) => establecerContrasenaNueva(e.target.value)}
                required minLength={8} maxLength={50} placeholder="Minimo 8 caracteres"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar Contrasena</label>
              <input type="password" value={confirmarContrasena} onChange={(e) => establecerConfirmarContrasena(e.target.value)}
                required minLength={8} maxLength={50} placeholder="Repite la nueva contrasena"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
              <Save className="w-4 h-4" />
              Actualizar Contrasena
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
