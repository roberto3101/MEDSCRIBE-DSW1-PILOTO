import { useState, useEffect } from 'react'
import { Shield, Plus, Edit2, Save, AlertTriangle, Power } from 'lucide-react'
import Cargando from '../../componentes/comunes/Cargando'
import Modal from '../../componentes/comunes/Modal'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'

interface Rol {
  idRol: number
  nombreDelRol: string
  descripcionDelRol: string
  permisosEnFormatoJSON: string
  esRolBase: boolean
  estaActivo: boolean
}

const MODULOS_DISPONIBLES = ['pacientes', 'consultas', 'documentos', 'configuracion', 'usuarios', 'roles']
const ACCIONES_DISPONIBLES = ['ver', 'crear', 'editar', 'eliminar']

export default function PaginaRoles() {
  const { usuario } = useContextoAutenticacion()
  const [roles, establecerRoles] = useState<Rol[]>([])
  const [estaCargando, establecerEstaCargando] = useState(true)
  const [modalAbierto, establecerModalAbierto] = useState(false)
  const [rolEnEdicion, establecerRolEnEdicion] = useState<Rol | null>(null)
  const [nombre, establecerNombre] = useState('')
  const [descripcion, establecerDescripcion] = useState('')
  const [permisos, establecerPermisos] = useState<Record<string, Record<string, boolean>>>({})

  const cargarRoles = async () => {
    try {
      const respuesta = await fetch('/api/roles')
      const datos = await respuesta.json()
      establecerRoles(datos)
    } catch { /* */ } finally { establecerEstaCargando(false) }
  }

  useEffect(() => { cargarRoles() }, [])

  const abrirModalCrear = () => {
    establecerRolEnEdicion(null)
    establecerNombre('')
    establecerDescripcion('')
    const permisosBase: Record<string, Record<string, boolean>> = {}
    MODULOS_DISPONIBLES.forEach(m => { permisosBase[m] = { ver: false, crear: false, editar: false, eliminar: false } })
    establecerPermisos(permisosBase)
    establecerModalAbierto(true)
  }

  const abrirModalEditar = (rol: Rol) => {
    establecerRolEnEdicion(rol)
    establecerNombre(rol.nombreDelRol)
    establecerDescripcion(rol.descripcionDelRol || '')
    try { establecerPermisos(JSON.parse(rol.permisosEnFormatoJSON)) } catch { /* */ }
    establecerModalAbierto(true)
  }

  const esRolDelUsuarioActual = rolEnEdicion?.idRol === (usuario as any)?.idRol ||
    (rolEnEdicion?.nombreDelRol === usuario?.rolDelSistema)

  const togglePermiso = (modulo: string, accion: string) => {
    establecerPermisos((prev: Record<string, Record<string, boolean>>) => {
      const nuevo = JSON.parse(JSON.stringify(prev))
      if (!nuevo[modulo]) nuevo[modulo] = { ver: false, crear: false, editar: false, eliminar: false }

      const nuevoValor = !nuevo[modulo][accion]

      if (accion === 'ver' && !nuevoValor) {
        nuevo[modulo] = { ver: false, crear: false, editar: false, eliminar: false }
      } else {
        nuevo[modulo][accion] = nuevoValor
        if (nuevoValor && accion !== 'ver') {
          nuevo[modulo].ver = true
        }
      }

      return nuevo
    })
  }

  const darTodosLosPermisos = () => {
    const todos: Record<string, Record<string, boolean>> = {}
    MODULOS_DISPONIBLES.forEach(m => { todos[m] = { ver: true, crear: true, editar: true, eliminar: true } })
    establecerPermisos(todos)
  }

  const quitarTodosLosPermisos = () => {
    const ninguno: Record<string, Record<string, boolean>> = {}
    MODULOS_DISPONIBLES.forEach(m => { ninguno[m] = { ver: false, crear: false, editar: false, eliminar: false } })
    establecerPermisos(ninguno)
  }

  const guardarRol = async () => {
    if (esRolDelUsuarioActual) {
      const tieneAccesoUsuarios = permisos['usuarios']?.ver && permisos['roles']?.ver
      if (!tieneAccesoUsuarios) {
        alert('No puedes quitarte el acceso a Usuarios y Roles de tu propio rol. Perderias acceso a esta pagina.')
        return
      }
    }

    const metodo = rolEnEdicion ? 'PUT' : 'POST'
    const url = rolEnEdicion ? `/api/roles/${rolEnEdicion.idRol}` : '/api/roles'
    await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion, permisosJson: JSON.stringify(permisos) }),
    })
    establecerModalAbierto(false)
    cargarRoles()
  }

  if (estaCargando) return <Cargando />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="w-7 h-7 text-medico-500" />
            Roles y Permisos
          </h1>
          <p className="text-slate-400 mt-1">{roles.length} roles configurados</p>
        </div>
        <button onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-medico-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(rol => {
          let permisosObj: Record<string, Record<string, boolean>> = {}
          try { permisosObj = JSON.parse(rol.permisosEnFormatoJSON) } catch { /* */ }
          const totalPermisos = Object.values(permisosObj).reduce((acc, m) => acc + Object.values(m).filter(Boolean).length, 0)

          const estaInactivo = rol.estaActivo === false
          return (
            <div key={rol.idRol} className={`bg-white rounded-xl border p-5 ${estaInactivo ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{rol.nombreDelRol}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{rol.descripcionDelRol}</p>
                </div>
                <div className="flex gap-1">
                  {rol.esRolBase && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Base</span>}
                  {estaInactivo && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactivo</span>}
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3">{totalPermisos} permisos activos</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {MODULOS_DISPONIBLES.map(modulo => {
                  const tieneAcceso = permisosObj[modulo]?.ver
                  return (
                    <span key={modulo} className={`text-[10px] px-1.5 py-0.5 rounded ${tieneAcceso ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                      {modulo}
                    </span>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={() => abrirModalEditar(rol)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-medico-50 hover:text-medico-600 transition-colors">
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
                {!rol.esRolBase && rol.nombreDelRol !== usuario?.rolDelSistema && (
                  <button onClick={async () => {
                    const accion = estaInactivo ? 'reactivar' : 'desactivar'
                    if (!confirm(`${accion[0].toUpperCase() + accion.slice(1)} este rol?`)) return
                    await fetch(`/api/roles/${rol.idRol}/estado`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estaActivo: estaInactivo }),
                    })
                    cargarRoles()
                  }}
                    className={`flex items-center justify-center gap-1 py-2 px-3 border rounded-lg text-xs transition-colors ${
                      estaInactivo
                        ? 'border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600'
                        : 'border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600'
                    }`}>
                    <Power className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal estaAbierto={modalAbierto} alCerrar={() => establecerModalAbierto(false)} titulo={rolEnEdicion ? 'Editar Rol' : 'Nuevo Rol'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del Rol</label>
            <input type="text" value={nombre} onChange={(e) => establecerNombre(e.target.value)} maxLength={50}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descripcion</label>
            <input type="text" value={descripcion} onChange={(e) => establecerDescripcion(e.target.value)} maxLength={200}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-500">Permisos por Modulo</label>
              <div className="flex gap-2">
                <button type="button" onClick={darTodosLosPermisos}
                  className="text-[10px] font-medium px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                  Dar todos los permisos
                </button>
                <button type="button" onClick={quitarTodosLosPermisos}
                  className="text-[10px] font-medium px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                  Quitar todos
                </button>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Modulo</th>
                    {ACCIONES_DISPONIBLES.map(a => (
                      <th key={a} className="text-center px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODULOS_DISPONIBLES.map(modulo => (
                    <tr key={modulo}>
                      <td className="px-3 py-2 text-sm text-slate-700 capitalize">{modulo}</td>
                      {ACCIONES_DISPONIBLES.map(accion => (
                        <td key={accion} className="text-center px-2 py-2">
                          <input type="checkbox" checked={permisos[modulo]?.[accion] || false}
                            onChange={() => togglePermiso(modulo, accion)}
                            className="w-4 h-4 rounded border-slate-300 text-medico-500 focus:ring-medico-500/20" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button onClick={guardarRol}
            className="w-full flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
            <Save className="w-4 h-4" /> {rolEnEdicion ? 'Actualizar Rol' : 'Crear Rol'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
