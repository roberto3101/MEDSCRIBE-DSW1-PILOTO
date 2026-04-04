import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, User, ArrowRight, Stethoscope, CheckCircle } from 'lucide-react'

export default function PaginaRegistroClinica() {
  const [paso, establecerPaso] = useState(1)
  const [estaCargando, establecerEstaCargando] = useState(false)
  const [error, establecerError] = useState('')
  const navegarHacia = useNavigate()

  const [formulario, establecerFormulario] = useState({
    razonSocial: '',
    ruc: '',
    nombreComercial: '',
    correoContacto: '',
    nombreAdmin: '',
    correoAdmin: '',
    contrasenaAdmin: '',
    confirmarContrasena: '',
  })

  const actualizarCampo = (campo: string, valor: string) => {
    if (campo === 'ruc' && !/^\d*$/.test(valor)) return
    if (campo === 'ruc' && valor.length > 11) return
    establecerFormulario(prev => ({ ...prev, [campo]: valor }))
  }

  const validarPaso1 = () => {
    if (!formulario.razonSocial.trim()) return 'La razon social es obligatoria'
    if (formulario.ruc.length !== 11) return 'El RUC debe tener 11 digitos'
    if (!formulario.correoContacto.includes('@')) return 'Correo de contacto invalido'
    return ''
  }

  const validarPaso2 = () => {
    if (!formulario.nombreAdmin.trim()) return 'El nombre del administrador es obligatorio'
    if (!formulario.correoAdmin.includes('@')) return 'Correo del administrador invalido'
    if (formulario.contrasenaAdmin.length < 8) return 'La contrasena debe tener al menos 8 caracteres'
    if (formulario.contrasenaAdmin !== formulario.confirmarContrasena) return 'Las contrasenas no coinciden'
    return ''
  }

  const avanzarPaso = () => {
    const errorValidacion = validarPaso1()
    if (errorValidacion) { establecerError(errorValidacion); return }
    establecerError('')
    establecerPaso(2)
  }

  const registrarClinica = async (evento: React.FormEvent) => {
    evento.preventDefault()
    const errorValidacion = validarPaso2()
    if (errorValidacion) { establecerError(errorValidacion); return }

    establecerEstaCargando(true)
    establecerError('')

    try {
      const respuesta = await fetch('/api/clinicas/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razonSocial: formulario.razonSocial,
          ruc: formulario.ruc,
          nombreComercial: formulario.nombreComercial || formulario.razonSocial,
          correoContacto: formulario.correoContacto,
          nombreAdmin: formulario.nombreAdmin,
          correoAdmin: formulario.correoAdmin,
          contrasenaAdmin: formulario.contrasenaAdmin,
        }),
      })

      if (!respuesta.ok) {
        const datos = await respuesta.json()
        throw new Error(datos.mensaje || 'Error al registrar')
      }

      establecerPaso(3)
    } catch (err) {
      establecerError(err instanceof Error ? err.message : 'Error al registrar la clinica')
    } finally {
      establecerEstaCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-medico-400 to-medico-600 rounded-xl flex items-center justify-center shadow-lg shadow-medico-200">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">MedScribe AI</h1>
            <p className="text-xs text-slate-400">Registrar nueva clinica</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 justify-center">
          {[1, 2, 3].map(p => (
            <div key={p} className={`h-1.5 w-16 rounded-full transition-colors ${paso >= p ? 'bg-medico-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">{error}</div>
          )}

          {paso === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-medico-500" />
                Datos de la Clinica
              </h2>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Razon Social *</label>
                <input type="text" value={formulario.razonSocial} onChange={(e) => actualizarCampo('razonSocial', e.target.value)}
                  placeholder="Clinica San Pablo SAC" maxLength={200}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">RUC *</label>
                <input type="text" value={formulario.ruc} onChange={(e) => actualizarCampo('ruc', e.target.value)}
                  placeholder="20123456789" maxLength={11}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
                <p className="text-[10px] text-slate-300 mt-0.5">{formulario.ruc.length}/11 digitos</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Comercial</label>
                <input type="text" value={formulario.nombreComercial} onChange={(e) => actualizarCampo('nombreComercial', e.target.value)}
                  placeholder="MedScribe Demo" maxLength={200}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Correo de Contacto *</label>
                <input type="email" value={formulario.correoContacto} onChange={(e) => actualizarCampo('correoContacto', e.target.value)}
                  placeholder="admin@clinica.pe" maxLength={150}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <button onClick={avanzarPaso}
                className="w-full flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {paso === 2 && (
            <form onSubmit={registrarClinica} className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-medico-500" />
                Cuenta del Administrador
              </h2>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo *</label>
                <input type="text" value={formulario.nombreAdmin} onChange={(e) => actualizarCampo('nombreAdmin', e.target.value)}
                  placeholder="Dr. Jose Roberto" maxLength={100} required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Correo del Administrador *</label>
                <input type="email" value={formulario.correoAdmin} onChange={(e) => actualizarCampo('correoAdmin', e.target.value)}
                  placeholder="admin@clinica.pe" maxLength={150} required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contrasena *</label>
                <input type="password" value={formulario.contrasenaAdmin} onChange={(e) => actualizarCampo('contrasenaAdmin', e.target.value)}
                  placeholder="Minimo 8 caracteres" minLength={8} maxLength={50} required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar Contrasena *</label>
                <input type="password" value={formulario.confirmarContrasena} onChange={(e) => actualizarCampo('confirmarContrasena', e.target.value)}
                  placeholder="Repite la contrasena" minLength={8} maxLength={50} required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => establecerPaso(1)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Atras
                </button>
                <button type="submit" disabled={estaCargando}
                  className="flex-1 flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:opacity-50">
                  {estaCargando ? 'Registrando...' : 'Crear Clinica'}
                </button>
              </div>
            </form>
          )}

          {paso === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Clinica registrada exitosamente</h2>
              <p className="text-sm text-slate-400 mb-6">
                Tu clinica tiene 30 dias de prueba gratuita. Inicia sesion con las credenciales que registraste.
              </p>
              <button onClick={() => navegarHacia('/iniciar-sesion')}
                className="w-full bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
                Ir a Iniciar Sesion
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          ¿Ya tienes cuenta? <Link to="/iniciar-sesion" className="text-medico-500 hover:text-medico-600 font-medium">Iniciar Sesion</Link>
        </p>
      </div>
    </div>
  )
}
