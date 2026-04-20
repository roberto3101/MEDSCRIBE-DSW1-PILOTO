import { useState, useEffect } from 'react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { pacienteServicio } from '../../servicios/pacienteServicio'
import type { Paciente } from '../../tipos/paciente'
import Modal from '../../componentes/comunes/Modal'
import Cargando from '../../componentes/comunes/Cargando'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'
import { detectarCodigoPaisUsuario } from '../../utilidades/geolocalizacion'
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react'

export default function PaginaPacientes() {
  const { tienePermiso } = useContextoAutenticacion()
  const [pacientes, establecerPacientes] = useState<Paciente[]>([])
  const [estaCargando, establecerEstaCargando] = useState(true)
  const [busqueda, establecerBusqueda] = useState('')
  const [modalAbierto, establecerModalAbierto] = useState(false)
  const [pacienteEnEdicion, establecerPacienteEnEdicion] = useState<Paciente | null>(null)
  const [mensajeExito, establecerMensajeExito] = useState('')
  const [paisDetectado, establecerPaisDetectado] = useState<string>('pe')

  const [formulario, establecerFormulario] = useState({
    nombreDelPaciente: '',
    apellidoDelPaciente: '',
    numeroDocumentoIdentidad: '',
    tipoDocumentoIdentidad: 'DNI' as const,
    fechaDeNacimiento: '',
    sexoBiologico: 'Masculino' as const,
    telefonoDeContacto: '',
    correoElectronico: '',
    direccionDomiciliaria: '',
  })

  const cargarPacientes = async () => {
    establecerEstaCargando(true)
    try {
      const respuesta = await pacienteServicio.listarPacientes()
      establecerPacientes(respuesta.data)
    } catch {
      console.error('Error al cargar pacientes')
    } finally {
      establecerEstaCargando(false)
    }
  }

  useEffect(() => { cargarPacientes() }, [])

  useEffect(() => {
    detectarCodigoPaisUsuario().then(establecerPaisDetectado)
  }, [])

  const pacientesFiltrados = pacientes.filter((p) =>
    `${p.nombreDelPaciente} ${p.apellidoDelPaciente} ${p.numeroDocumentoIdentidad}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  const abrirModalCrear = () => {
    establecerPacienteEnEdicion(null)
    establecerFormulario({
      nombreDelPaciente: '', apellidoDelPaciente: '', numeroDocumentoIdentidad: '',
      tipoDocumentoIdentidad: 'DNI', fechaDeNacimiento: '', sexoBiologico: 'Masculino',
      telefonoDeContacto: '', correoElectronico: '', direccionDomiciliaria: '',
    })
    establecerModalAbierto(true)
  }

  const abrirModalEditar = (paciente: Paciente) => {
    establecerPacienteEnEdicion(paciente)
    establecerFormulario({
      nombreDelPaciente: paciente.nombreDelPaciente,
      apellidoDelPaciente: paciente.apellidoDelPaciente,
      numeroDocumentoIdentidad: paciente.numeroDocumentoIdentidad,
      tipoDocumentoIdentidad: paciente.tipoDocumentoIdentidad as 'DNI',
      fechaDeNacimiento: paciente.fechaDeNacimiento.split('T')[0],
      sexoBiologico: paciente.sexoBiologico as 'Masculino',
      telefonoDeContacto: paciente.telefonoDeContacto,
      correoElectronico: paciente.correoElectronico,
      direccionDomiciliaria: paciente.direccionDomiciliaria,
    })
    establecerModalAbierto(true)
  }

  const guardarPaciente = async (evento: React.FormEvent) => {
    evento.preventDefault()
    try {
      if (pacienteEnEdicion) {
        await pacienteServicio.actualizarPaciente(pacienteEnEdicion.idPaciente, formulario as any)
        establecerMensajeExito('Paciente actualizado correctamente')
      } else {
        await pacienteServicio.crearPaciente(formulario as any)
        establecerMensajeExito('Paciente registrado correctamente')
      }
      establecerModalAbierto(false)
      cargarPacientes()
      setTimeout(() => establecerMensajeExito(''), 3000)
    } catch {
      alert('Error al guardar paciente')
    }
  }

  const desactivarPaciente = async (idPaciente: number) => {
    if (!confirm('Esta seguro de desactivar este paciente?')) return
    try {
      await pacienteServicio.desactivarPaciente(idPaciente)
      cargarPacientes()
    } catch {
      alert('Error al desactivar paciente')
    }
  }

  const actualizarCampo = (campo: string, valor: string) => {
    establecerFormulario((anterior) => ({ ...anterior, [campo]: valor }))
  }

  if (estaCargando) return <Cargando />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="w-7 h-7 text-medico-500" />
            Pacientes
          </h1>
          <p className="text-slate-400 mt-1">{pacientes.length} pacientes registrados</p>
        </div>
        {tienePermiso('pacientes', 'crear') && (
          <button onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-medico-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nuevo Paciente
          </button>
        )}
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100">
          {mensajeExito}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => establecerBusqueda(e.target.value)}
          placeholder="Buscar por nombre, apellido o DNI..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paciente</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sexo</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pacientesFiltrados.map((paciente) => (
              <tr key={paciente.idPaciente} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-medico-50 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-medico-600">{paciente.nombreDelPaciente.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{paciente.nombreDelPaciente} {paciente.apellidoDelPaciente}</p>
                      <p className="text-xs text-slate-400">{paciente.fechaDeNacimiento.split('T')[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{paciente.tipoDocumentoIdentidad}: {paciente.numeroDocumentoIdentidad}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600">{paciente.telefonoDeContacto}</p>
                  <p className="text-xs text-slate-400">{paciente.correoElectronico}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    paciente.sexoBiologico === 'Femenino' ? 'bg-pink-50 text-pink-600' : 'bg-sky-50 text-sky-600'
                  }`}>
                    {paciente.sexoBiologico}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {tienePermiso('pacientes', 'editar') && (
                    <button onClick={() => abrirModalEditar(paciente)} className="p-1.5 rounded-lg hover:bg-medico-50 text-slate-400 hover:text-medico-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {tienePermiso('pacientes', 'eliminar') && (
                    <button onClick={() => desactivarPaciente(paciente.idPaciente)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pacientesFiltrados.length === 0 && (
          <div className="text-center py-12 text-slate-400">No se encontraron pacientes</div>
        )}
      </div>

      <Modal
        estaAbierto={modalAbierto}
        alCerrar={() => establecerModalAbierto(false)}
        titulo={pacienteEnEdicion ? 'Editar Paciente' : 'Nuevo Paciente'}
      >
        <form onSubmit={guardarPaciente} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
              <input type="text" required value={formulario.nombreDelPaciente} onChange={(e) => actualizarCampo('nombreDelPaciente', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Apellido</label>
              <input type="text" required value={formulario.apellidoDelPaciente} onChange={(e) => actualizarCampo('apellidoDelPaciente', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tipo Documento</label>
              <select value={formulario.tipoDocumentoIdentidad} onChange={(e) => actualizarCampo('tipoDocumentoIdentidad', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400">
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Numero Documento</label>
              <input type="text" required minLength={8} value={formulario.numeroDocumentoIdentidad} onChange={(e) => actualizarCampo('numeroDocumentoIdentidad', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Fecha Nacimiento</label>
              <input type="date" required value={formulario.fechaDeNacimiento} onChange={(e) => actualizarCampo('fechaDeNacimiento', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Sexo</label>
              <select value={formulario.sexoBiologico} onChange={(e) => actualizarCampo('sexoBiologico', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400">
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Telefono</label>
            <PhoneInput
              defaultCountry={paisDetectado}
              value={formulario.telefonoDeContacto}
              onChange={(telefono) => actualizarCampo('telefonoDeContacto', telefono)}
              inputClassName="!w-full !px-3 !py-2 !bg-slate-50 !border !border-slate-200 !rounded-r-lg !text-sm focus:!outline-none focus:!ring-2 focus:!ring-medico-500/20 focus:!border-medico-400"
              countrySelectorStyleProps={{
                buttonClassName: '!bg-slate-50 !border !border-slate-200 !rounded-l-lg !px-2',
              }}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Correo</label>
            <input type="email" value={formulario.correoElectronico} onChange={(e) => actualizarCampo('correoElectronico', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Direccion</label>
            <input type="text" value={formulario.direccionDomiciliaria} onChange={(e) => actualizarCampo('direccionDomiciliaria', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => establecerModalAbierto(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
              {pacienteEnEdicion ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
