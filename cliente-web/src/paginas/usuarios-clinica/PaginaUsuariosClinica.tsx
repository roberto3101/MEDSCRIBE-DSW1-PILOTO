import { useState, useEffect, useMemo } from 'react'
import { Users, Plus, Shield, UserCheck, Lock, Check, X, Minus, AlertCircle } from 'lucide-react'
import Cargando from '../../componentes/comunes/Cargando'
import Modal from '../../componentes/comunes/Modal'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'
import { sanitizarNombre, validarNombre, validarCorreo, validarContrasena } from '../../utilidades/validaciones'

interface UsuarioDeClinica {
  idUsuario: number
  nombreCompleto: string
  correoElectronico: string
  rolDelSistema: string
  nombreDelRol: string
  estaCuentaActiva: boolean
  fechaRegistroEnSistema: string
  idRol: number
}

interface Rol {
  idRol: number
  nombreDelRol: string
}

export default function PaginaUsuariosClinica() {
  const { usuario: usuarioLogueado } = useContextoAutenticacion()
  const [usuarios, establecerUsuarios] = useState<UsuarioDeClinica[]>([])
  const [roles, establecerRoles] = useState<Rol[]>([])
  const [estaCargando, establecerEstaCargando] = useState(true)
  const [modalCrear, establecerModalCrear] = useState(false)
  const [modalCambiarRol, establecerModalCambiarRol] = useState(false)
  const [usuarioSeleccionado, establecerUsuarioSeleccionado] = useState<UsuarioDeClinica | null>(null)
  const [rolSeleccionado, establecerRolSeleccionado] = useState(0)

  const [modalPermisos, establecerModalPermisos] = useState(false)
  const [usuarioPermisos, establecerUsuarioPermisos] = useState<any>(null)
  const [permisosDelRolBase, establecerPermisosBase] = useState<any>({})
  const [permisosPersonalizados, establecerPermisosPersonalizados] = useState<any>({})

  const [nuevoUsuario, establecerNuevoUsuario] = useState({
    nombreCompleto: '', correoElectronico: '', contrasena: '', idRol: 0,
  })
  const [camposTocados, establecerCamposTocados] = useState<Record<string, boolean>>({})
  const [intentoCrear, establecerIntentoCrear] = useState(false)
  const [errorCrear, establecerErrorCrear] = useState('')

  const erroresNuevoUsuario = useMemo(() => ({
    nombreCompleto: validarNombre(nuevoUsuario.nombreCompleto, 'El nombre completo'),
    correoElectronico: validarCorreo(nuevoUsuario.correoElectronico, true),
    contrasena: validarContrasena(nuevoUsuario.contrasena),
    idRol: nuevoUsuario.idRol > 0 ? null : 'Debes seleccionar un rol',
  }), [nuevoUsuario])

  const nuevoUsuarioEsValido = Object.values(erroresNuevoUsuario).every((e) => !e)

  const debeMostrarErrorUsuario = (campo: string) => {
    return (camposTocados[campo] || intentoCrear) && !!(erroresNuevoUsuario as any)[campo]
  }

  const MODULOS = ['pacientes', 'consultas', 'documentos', 'configuracion', 'usuarios', 'roles']
  const ACCIONES = ['ver', 'crear', 'editar', 'eliminar']

  const cargarDatos = async () => {
    try {
      const [respUsuarios, respRoles] = await Promise.all([
        fetch('/api/usuarios-clinica'),
        fetch('/api/roles'),
      ])
      const datosUsuarios = await respUsuarios.json()
      const datosRoles = await respRoles.json()
      establecerUsuarios(datosUsuarios)
      establecerRoles(datosRoles)
    } catch { /* */ } finally { establecerEstaCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const crearUsuario = async () => {
    establecerIntentoCrear(true)
    establecerErrorCrear('')
    if (!nuevoUsuarioEsValido) return
    const rolElegido = roles.find(r => r.idRol === nuevoUsuario.idRol)
    const payload = {
      nombreCompleto: nuevoUsuario.nombreCompleto.trim(),
      correoElectronico: nuevoUsuario.correoElectronico.trim(),
      contrasena: nuevoUsuario.contrasena,
      idRol: nuevoUsuario.idRol,
      rolDelSistema: rolElegido?.nombreDelRol || 'Medico',
    }
    try {
      const respuesta = await fetch('/api/usuarios-clinica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}))
        establecerErrorCrear(datos?.mensaje || 'No se pudo crear el usuario')
        return
      }
      establecerModalCrear(false)
      establecerNuevoUsuario({ nombreCompleto: '', correoElectronico: '', contrasena: '', idRol: 0 })
      establecerCamposTocados({})
      establecerIntentoCrear(false)
      cargarDatos()
    } catch {
      establecerErrorCrear('Error de red al crear usuario')
    }
  }

  const abrirModalCrear = () => {
    establecerNuevoUsuario({ nombreCompleto: '', correoElectronico: '', contrasena: '', idRol: 0 })
    establecerCamposTocados({})
    establecerIntentoCrear(false)
    establecerErrorCrear('')
    establecerModalCrear(true)
  }

  const abrirCambiarRol = (usuario: UsuarioDeClinica) => {
    establecerUsuarioSeleccionado(usuario)
    establecerRolSeleccionado(usuario.idRol)
    establecerModalCambiarRol(true)
  }

  const abrirPermisos = async (usuario: UsuarioDeClinica) => {
    try {
      const resp = await fetch(`/api/usuarios-clinica/${usuario.idUsuario}/permisos`)
      const datos = await resp.json()
      establecerUsuarioPermisos(datos)
      try { establecerPermisosBase(JSON.parse(datos.permisosDelRolBase || '{}')) } catch { establecerPermisosBase({}) }
      try { establecerPermisosPersonalizados(JSON.parse(datos.permisosPersonalizados || '{}')) } catch { establecerPermisosPersonalizados({}) }
      establecerModalPermisos(true)
    } catch { alert('Error al cargar permisos') }
  }

  const obtenerEstadoPermiso = (modulo: string, accion: string): 'base' | 'concedido' | 'revocado' | 'sin_permiso' => {
    const tienePersonalizado = permisosPersonalizados[modulo]?.[accion] !== undefined
    if (tienePersonalizado) {
      return permisosPersonalizados[modulo][accion] ? 'concedido' : 'revocado'
    }
    return permisosDelRolBase[modulo]?.[accion] ? 'base' : 'sin_permiso'
  }

  const esElMismoUsuario = usuarioPermisos?.idUsuario === usuarioLogueado?.idUsuario

  const togglePermisoPersonalizado = (modulo: string, accion: string) => {
    if (esElMismoUsuario && (modulo === 'usuarios' || modulo === 'roles')) {
      alert('No puedes modificar tus propios permisos de Usuarios y Roles')
      return
    }

    const estadoActual = obtenerEstadoPermiso(modulo, accion)
    establecerPermisosPersonalizados((prev: any) => {
      const nuevo = { ...prev }
      if (!nuevo[modulo]) nuevo[modulo] = {}

      if (accion === 'ver') {
        if (estadoActual === 'base' || estadoActual === 'concedido') {
          nuevo[modulo] = { ver: false, crear: false, editar: false, eliminar: false }
        } else {
          delete nuevo[modulo]
          if (Object.keys(nuevo).length === 0) return {}
        }
      } else {
        if (estadoActual === 'base') {
          nuevo[modulo][accion] = false
        } else if (estadoActual === 'sin_permiso') {
          nuevo[modulo][accion] = true
          const verBase = permisosDelRolBase[modulo]?.ver
          if (!verBase && !nuevo[modulo]?.ver) {
            nuevo[modulo].ver = true
          }
        } else if (estadoActual === 'concedido' || estadoActual === 'revocado') {
          delete nuevo[modulo][accion]
          if (Object.keys(nuevo[modulo]).length === 0) delete nuevo[modulo]
        }
      }

      return { ...nuevo }
    })
  }

  const guardarPermisosPersonalizados = async () => {
    if (!usuarioPermisos) return

    if (esElMismoUsuario) {
      alert('No puedes guardar permisos personalizados sobre tu propia cuenta')
      return
    }

    await fetch(`/api/usuarios-clinica/${usuarioPermisos.idUsuario}/permisos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permisosPersonalizadosJSON: JSON.stringify(permisosPersonalizados) }),
    })
    establecerModalPermisos(false)
    cargarDatos()
  }

  const limpiarPermisosPersonalizados = () => {
    establecerPermisosPersonalizados({})
  }

  const cambiarRolDeUsuario = async () => {
    if (!usuarioSeleccionado || !rolSeleccionado) return
    await fetch(`/api/usuarios-clinica/${usuarioSeleccionado.idUsuario}/cambiar-rol`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idRol: rolSeleccionado }),
    })
    establecerModalCambiarRol(false)
    cargarDatos()
  }

  if (estaCargando) return <Cargando />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="w-7 h-7 text-medico-500" />
            Usuarios de la Clinica
          </h1>
          <p className="text-slate-400 mt-1">{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-medico-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Correo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map(usuario => (
              <tr key={usuario.idUsuario} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-medico-50 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-medico-600">{usuario.nombreCompleto.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{usuario.nombreCompleto}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{usuario.correoElectronico}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    usuario.rolDelSistema === 'Administrador' ? 'bg-amber-50 text-amber-600' :
                    usuario.rolDelSistema === 'Medico' ? 'bg-medico-50 text-medico-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>{usuario.nombreDelRol || usuario.rolDelSistema}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${usuario.estaCuentaActiva ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-500">{usuario.estaCuentaActiva ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => abrirPermisos(usuario)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors">
                      <Lock className="w-3 h-3 inline mr-1" /> Permisos
                    </button>
                    <button onClick={() => abrirCambiarRol(usuario)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-medico-50 hover:text-medico-600 hover:border-medico-200 transition-colors">
                      <Shield className="w-3 h-3 inline mr-1" /> Rol
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal estaAbierto={modalCrear} alCerrar={() => establecerModalCrear(false)} titulo="Nuevo Usuario">
        <div className="space-y-4">
          {errorCrear && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorCrear}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={nuevoUsuario.nombreCompleto}
              onChange={(e) => establecerNuevoUsuario(p => ({ ...p, nombreCompleto: sanitizarNombre(e.target.value) }))}
              onBlur={() => establecerCamposTocados(p => ({ ...p, nombreCompleto: true }))}
              maxLength={100}
              placeholder="Ej. Juan Perez"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                debeMostrarErrorUsuario('nombreCompleto')
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                  : 'border-slate-200 focus:ring-medico-500/20 focus:border-medico-400'
              }`}
            />
            {debeMostrarErrorUsuario('nombreCompleto') && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {erroresNuevoUsuario.nombreCompleto}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Correo Electronico</label>
            <input
              type="email"
              value={nuevoUsuario.correoElectronico}
              onChange={(e) => establecerNuevoUsuario(p => ({ ...p, correoElectronico: e.target.value }))}
              onBlur={() => establecerCamposTocados(p => ({ ...p, correoElectronico: true }))}
              maxLength={150}
              placeholder="correo@clinica.com"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                debeMostrarErrorUsuario('correoElectronico')
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                  : 'border-slate-200 focus:ring-medico-500/20 focus:border-medico-400'
              }`}
            />
            {debeMostrarErrorUsuario('correoElectronico') && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {erroresNuevoUsuario.correoElectronico}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Contrasena</label>
            <input
              type="password"
              value={nuevoUsuario.contrasena}
              onChange={(e) => establecerNuevoUsuario(p => ({ ...p, contrasena: e.target.value }))}
              onBlur={() => establecerCamposTocados(p => ({ ...p, contrasena: true }))}
              maxLength={50}
              placeholder="Min 8 chars, mayus, minus y numero"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                debeMostrarErrorUsuario('contrasena')
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                  : 'border-slate-200 focus:ring-medico-500/20 focus:border-medico-400'
              }`}
            />
            {debeMostrarErrorUsuario('contrasena') && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {erroresNuevoUsuario.contrasena}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
            <select
              value={nuevoUsuario.idRol}
              onChange={(e) => establecerNuevoUsuario(p => ({ ...p, idRol: Number(e.target.value) }))}
              onBlur={() => establecerCamposTocados(p => ({ ...p, idRol: true }))}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                debeMostrarErrorUsuario('idRol')
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                  : 'border-slate-200 focus:ring-medico-500/20 focus:border-medico-400'
              }`}
            >
              <option value={0}>Seleccionar rol</option>
              {roles.map(r => <option key={r.idRol} value={r.idRol}>{r.nombreDelRol}</option>)}
            </select>
            {debeMostrarErrorUsuario('idRol') && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {erroresNuevoUsuario.idRol}
              </p>
            )}
          </div>
          <button
            onClick={crearUsuario}
            disabled={intentoCrear && !nuevoUsuarioEsValido}
            className="w-full bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Crear Usuario
          </button>
        </div>
      </Modal>

      <Modal estaAbierto={modalCambiarRol} alCerrar={() => establecerModalCambiarRol(false)} titulo="Cambiar Rol">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Cambiar rol de <strong>{usuarioSeleccionado?.nombreCompleto}</strong></p>
          <select value={rolSeleccionado} onChange={(e) => establecerRolSeleccionado(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
            {roles.map(r => <option key={r.idRol} value={r.idRol}>{r.nombreDelRol}</option>)}
          </select>
          <button onClick={cambiarRolDeUsuario}
            className="w-full flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
            <UserCheck className="w-4 h-4" /> Confirmar Cambio
          </button>
        </div>
      </Modal>

      {modalPermisos && usuarioPermisos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => establecerModalPermisos(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Gestion de Permisos</h2>
                  <p className="text-sm text-slate-400">Usuario: {usuarioPermisos.nombreCompleto} ({usuarioPermisos.nombreDelRol})</p>
                </div>
                <button onClick={() => establecerModalPermisos(false)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-slate-600 mb-1">Rol base: {usuarioPermisos.nombreDelRol}</p>
                <p className="text-[10px] text-slate-400">Haz clic en cada celda para conceder, revocar o resetear permisos</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 text-[10px]">
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600"><div className="w-2 h-2 rounded-full bg-blue-500" /> Permitido por rol base</span>
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600"><Check className="w-3 h-3" /> Concedido especificamente</span>
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600"><X className="w-3 h-3" /> Revocado especificamente</span>
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-400"><Minus className="w-3 h-3" /> Sin permiso</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Modulo</th>
                      {ACCIONES.map(a => (
                        <th key={a} className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase w-20">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MODULOS.map(modulo => (
                      <tr key={modulo} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-700 capitalize">{modulo}</span>
                        </td>
                        {ACCIONES.map(accion => {
                          const estado = obtenerEstadoPermiso(modulo, accion)
                          const estilos: Record<string, string> = {
                            base: 'bg-blue-50 hover:bg-blue-100',
                            concedido: 'bg-emerald-100 hover:bg-emerald-200',
                            revocado: 'bg-red-100 hover:bg-red-200',
                            sin_permiso: 'bg-slate-50 hover:bg-slate-100',
                          }
                          return (
                            <td key={accion} className="text-center px-3 py-3">
                              <button
                                onClick={() => togglePermisoPersonalizado(modulo, accion)}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${estilos[estado]}`}
                              >
                                {estado === 'base' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                                {estado === 'concedido' && <Check className="w-4 h-4 text-emerald-600" />}
                                {estado === 'revocado' && <X className="w-4 h-4 text-red-500" />}
                                {estado === 'sin_permiso' && <Minus className="w-4 h-4 text-slate-300" />}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button onClick={limpiarPermisosPersonalizados}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                Limpiar personalizados
              </button>
              <div className="flex-1" />
              <button onClick={() => establecerModalPermisos(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardarPermisosPersonalizados}
                className="flex items-center gap-2 px-5 py-2 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
                <Check className="w-4 h-4" /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
