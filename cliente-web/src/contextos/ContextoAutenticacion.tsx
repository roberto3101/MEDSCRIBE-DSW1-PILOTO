import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface Usuario {
  idUsuario: number
  idClinica: number
  nombreCompleto: string
  correoElectronico: string
  rolDelSistema: string
  nombreRol: string
  nombreClinica: string
  permisosDelRol: string
  permisosPersonalizados: string
}

interface PermisosModulo {
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

interface PermisosParsed {
  pacientes: PermisosModulo
  consultas: PermisosModulo
  documentos: PermisosModulo
  configuracion: PermisosModulo
  usuarios: PermisosModulo
  roles: PermisosModulo
  [key: string]: PermisosModulo
}

interface PeticionLogin {
  correoElectronico: string
  contrasena: string
}

interface ContextoAutenticacionTipo {
  usuario: Usuario | null
  estaAutenticado: boolean
  permisosDelUsuario: PermisosParsed | null
  iniciarSesion: (peticion: PeticionLogin) => Promise<void>
  cerrarSesion: () => void
  tienePermiso: (modulo: string, accion: string) => boolean
}

const ContextoAutenticacion = createContext<ContextoAutenticacionTipo | undefined>(undefined)
const CLAVE_ALMACENAMIENTO = 'medscribe_sesion'
const CLAVE_TOKEN = 'medscribe_token'

const PERMISOS_VACIOS: PermisosModulo = { ver: false, crear: false, editar: false, eliminar: false }

function parsearPermisos(permisosJson: string): PermisosParsed | null {
  try {
    return JSON.parse(permisosJson)
  } catch {
    return null
  }
}

export const ProveedorAutenticacion = ({ children }: { children: ReactNode }) => {
  const [usuario, establecerUsuario] = useState<Usuario | null>(() => {
    const almacenado = localStorage.getItem(CLAVE_ALMACENAMIENTO)
    return almacenado ? JSON.parse(almacenado) : null
  })

  const estaAutenticado = usuario !== null
  const permisosDelUsuario = (() => {
    if (!usuario?.permisosDelRol) return null
    const base = parsearPermisos(usuario.permisosDelRol)
    if (!base) return null
    const personalizados = usuario.permisosPersonalizados ? parsearPermisos(usuario.permisosPersonalizados) : null
    if (!personalizados) return base
    const mergeado = { ...base }
    for (const modulo of Object.keys(personalizados)) {
      if (!mergeado[modulo]) mergeado[modulo] = { ver: false, crear: false, editar: false, eliminar: false }
      for (const accion of Object.keys(personalizados[modulo])) {
        (mergeado[modulo] as any)[accion] = (personalizados[modulo] as any)[accion]
      }
    }
    return mergeado
  })()

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(usuario))
    } else {
      localStorage.removeItem(CLAVE_ALMACENAMIENTO)
    }
  }, [usuario])

  const iniciarSesion = async (peticion: PeticionLogin): Promise<void> => {
    const respuesta = await fetch('/api/autenticacion/iniciar-sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(peticion),
    })
    if (!respuesta.ok) {
      const error = await respuesta.json()
      throw new Error(error.mensaje || 'Error al iniciar sesion')
    }
    const datos = await respuesta.json()
    if (datos.token) {
      localStorage.setItem(CLAVE_TOKEN, datos.token)
    }
    establecerUsuario(datos.usuario)
  }

  const cerrarSesion = () => {
    establecerUsuario(null)
    localStorage.removeItem(CLAVE_ALMACENAMIENTO)
    localStorage.removeItem(CLAVE_TOKEN)
    window.location.href = '/iniciar-sesion'
  }

  const tienePermiso = (modulo: string, accion: string): boolean => {
    if (!permisosDelUsuario) return false
    const permisoModulo = permisosDelUsuario[modulo]
    if (!permisoModulo) return false
    return (permisoModulo as any)[accion] === true
  }

  return (
    <ContextoAutenticacion.Provider value={{ usuario, estaAutenticado, permisosDelUsuario, iniciarSesion, cerrarSesion, tienePermiso }}>
      {children}
    </ContextoAutenticacion.Provider>
  )
}

export const useContextoAutenticacion = (): ContextoAutenticacionTipo => {
  const contexto = useContext(ContextoAutenticacion)
  if (!contexto) throw new Error('useContextoAutenticacion debe usarse dentro de ProveedorAutenticacion')
  return contexto
}
