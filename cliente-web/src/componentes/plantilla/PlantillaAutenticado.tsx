import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Mic,
  FileText,
  CreditCard,
  UserCircle,
  LogOut,
  Stethoscope,
  Settings,
  Activity,
  Menu,
  X,
} from 'lucide-react'

const todosLosEnlaces = [
  { ruta: '/panel', etiqueta: 'Panel', icono: LayoutDashboard, modulo: '' },
  { ruta: '/consultas/nueva', etiqueta: 'Nueva Consulta', icono: Mic, modulo: 'consultas' },
  { ruta: '/consultas', etiqueta: 'Consultas', icono: Activity, modulo: 'consultas' },
  { ruta: '/pacientes', etiqueta: 'Pacientes', icono: Users, modulo: 'pacientes' },
  { ruta: '/documentos', etiqueta: 'Documentos', icono: FileText, modulo: 'documentos' },
  { ruta: '/configuracion-documentos', etiqueta: 'Config. Documentos', icono: Settings, modulo: 'configuracion' },
  { ruta: '/usuarios-clinica', etiqueta: 'Usuarios', icono: Users, modulo: 'usuarios' },
  { ruta: '/roles', etiqueta: 'Roles', icono: Settings, modulo: 'roles' },
  { ruta: '/perfil', etiqueta: 'Perfil', icono: UserCircle, modulo: '' },
]

export default function PlantillaAutenticado() {
  const { usuario, cerrarSesion, tienePermiso } = useContextoAutenticacion()
  const navegarHacia = useNavigate()

  const [menuMovilAbierto, establecerMenuMovil] = useState(false)

  const enlacesDelMenu = todosLosEnlaces.filter(enlace =>
    !enlace.modulo || tienePermiso(enlace.modulo, 'ver')
  )

  const manejarCerrarSesion = () => {
    cerrarSesion()
    navegarHacia('/iniciar-sesion')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {menuMovilAbierto && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => establecerMenuMovil(false)} />
      )}
      <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50 transition-transform duration-200 ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-medico-400 to-medico-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">MedScribe</h1>
              <p className="text-xs text-medico-500 font-medium">AI</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {enlacesDelMenu.map(({ ruta, etiqueta, icono: Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              onClick={() => establecerMenuMovil(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-medico-50 text-medico-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }
            >
              <Icono className="w-5 h-5" />
              {etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-medico-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-medico-600">
                {usuario?.nombreCompleto?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{usuario?.nombreCompleto}</p>
              <p className="text-xs text-slate-400">{usuario?.nombreRol || usuario?.rolDelSistema}</p>
            </div>
          </div>
          <button
            onClick={manejarCerrarSesion}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => establecerMenuMovil(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-500" />
            </button>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-exito animate-pulse" />
              Servicios activos
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
