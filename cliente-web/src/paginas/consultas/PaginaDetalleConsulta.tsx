import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle, XCircle, Edit3, Save, Download, Clock, User, Stethoscope, Mic, Lock } from 'lucide-react'
import Cargando from '../../componentes/comunes/Cargando'
import EditorNotaClinicaEstructurada from '../../componentes/comunes/EditorNotaClinicaEstructurada'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'

interface ConsultaCompleta {
  idConsulta: number
  idMedicoResponsable: number
  idPacienteAtendido: number
  especialidadMedicaAplicada: string
  tipoDocumentoClinico: string
  rutaArchivoDeAudio: string
  transcripcionDelAudio: string
  notaClinicaEstructurada: string
  estadoActualDeLaConsulta: string
  duracionEnSegundos: number
  fechaYHoraDeLaConsulta: string
  fechaCreacionEnSistema: string
}

interface Paciente {
  idPaciente: number
  nombreDelPaciente: string
  apellidoDelPaciente: string
  numeroDocumentoIdentidad: string
  tipoDocumentoIdentidad: string
  fechaDeNacimiento: string
  sexoBiologico: string
  telefonoDeContacto: string
}

export default function PaginaDetalleConsulta() {
  const { id } = useParams()
  const navegarHacia = useNavigate()
  const { tienePermiso } = useContextoAutenticacion()

  const puedeEditar = tienePermiso('consultas', 'editar')
  const puedeEliminar = tienePermiso('consultas', 'eliminar')
  const [consulta, establecerConsulta] = useState<ConsultaCompleta | null>(null)
  const [paciente, establecerPaciente] = useState<Paciente | null>(null)
  const [estaCargando, establecerEstaCargando] = useState(true)
  const [estaEditando, establecerEstaEditando] = useState(false)
  const [notaEditada, establecerNotaEditada] = useState('')
  const [mensajeAccion, establecerMensajeAccion] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const respConsulta = await fetch(`/api/consultas/${id}`)
        if (!respConsulta.ok) { navegarHacia('/consultas'); return }
        const datosConsulta = await respConsulta.json()
        establecerConsulta(datosConsulta)

        if (datosConsulta.idPacienteAtendido) {
          const respPaciente = await fetch(`/api/pacientes/${datosConsulta.idPacienteAtendido}`)
          if (respPaciente.ok) establecerPaciente(await respPaciente.json())
        }
      } catch { navegarHacia('/consultas') }
      finally { establecerEstaCargando(false) }
    }
    cargar()
  }, [id])

  const aprobarConsulta = async () => {
    await fetch(`/api/consultas/${id}/aprobar`, { method: 'PUT' })
    establecerConsulta(prev => prev ? { ...prev, estadoActualDeLaConsulta: 'Aprobado' } : null)
    establecerMensajeAccion('Consulta aprobada exitosamente')
    setTimeout(() => establecerMensajeAccion(''), 3000)
  }

  const rechazarConsulta = async () => {
    if (!confirm('¿Rechazar esta consulta? La nota clinica no se podra utilizar.')) return
    await fetch(`/api/consultas/${id}/rechazar`, { method: 'PUT' })
    establecerConsulta(prev => prev ? { ...prev, estadoActualDeLaConsulta: 'Rechazado' } : null)
    establecerMensajeAccion('Consulta rechazada')
    setTimeout(() => establecerMensajeAccion(''), 3000)
  }

  const iniciarEdicion = () => {
    establecerNotaEditada(consulta?.notaClinicaEstructurada || '')
    establecerEstaEditando(true)
  }

  const guardarEdicion = () => {
    establecerConsulta(prev => prev ? { ...prev, notaClinicaEstructurada: notaEditada } : null)
    establecerEstaEditando(false)
    establecerMensajeAccion('Nota clinica actualizada')
    setTimeout(() => establecerMensajeAccion(''), 3000)
  }

  const descargarDocumento = async (formato: 'pdf' | 'word') => {
    const endpoint = formato === 'pdf' ? '/api/ia/generar-pdf' : '/api/ia/generar-word'
    const respuesta = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nota_clinica: consulta?.notaClinicaEstructurada, tipo_documento: consulta?.tipoDocumentoClinico }),
    })
    const blob = await respuesta.blob()
    const nombre = respuesta.headers.get('X-Nombre-Archivo') || `consulta_${id}.${formato === 'pdf' ? 'pdf' : 'docx'}`
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(blob)
    enlace.download = nombre
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  if (estaCargando) return <Cargando />
  if (!consulta) return null

  const fecha = consulta.fechaYHoraDeLaConsulta?.split('T')
  const esBorrador = consulta.estadoActualDeLaConsulta === 'Borrador'

  const coloresEstado: Record<string, string> = {
    Borrador: 'bg-amber-50 text-amber-600 border-amber-200',
    Aprobado: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Rechazado: 'bg-red-50 text-red-500 border-red-200',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navegarHacia('/consultas')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Consulta #{consulta.idConsulta}</h1>
          <p className="text-sm text-slate-400">{fecha?.[0]} a las {fecha?.[1]?.substring(0, 5)}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${coloresEstado[consulta.estadoActualDeLaConsulta] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          {consulta.estadoActualDeLaConsulta}
        </span>
      </div>

      {mensajeAccion && (
        <div className="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {mensajeAccion}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-medico-500" /> Paciente
          </h3>
          {paciente ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">{paciente.nombreDelPaciente} {paciente.apellidoDelPaciente}</p>
              <p className="text-xs text-slate-500">{paciente.tipoDocumentoIdentidad}: {paciente.numeroDocumentoIdentidad}</p>
              <p className="text-xs text-slate-500">{paciente.sexoBiologico} — {paciente.fechaDeNacimiento?.split('T')[0]}</p>
              {paciente.telefonoDeContacto && <p className="text-xs text-slate-500">Tel: {paciente.telefonoDeContacto}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sin paciente vinculado</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-medico-500" /> Consulta
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-xs text-slate-400">Tipo</span><span className="text-xs font-medium text-slate-700">{consulta.tipoDocumentoClinico}</span></div>
            <div className="flex justify-between"><span className="text-xs text-slate-400">Especialidad</span><span className="text-xs font-medium text-slate-700">{consulta.especialidadMedicaAplicada}</span></div>
            <div className="flex justify-between"><span className="text-xs text-slate-400">Fecha</span><span className="text-xs font-medium text-slate-700">{fecha?.[0]}</span></div>
            <div className="flex justify-between"><span className="text-xs text-slate-400">Hora</span><span className="text-xs font-medium text-slate-700">{fecha?.[1]?.substring(0, 5)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h3>
          <div className="space-y-2">
            {esBorrador && puedeEditar && (
              <button onClick={aprobarConsulta}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> Aprobar Consulta
              </button>
            )}
            {esBorrador && puedeEliminar && (
              <button onClick={rechazarConsulta}
                className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Rechazar
              </button>
            )}
            <button onClick={() => descargarDocumento('pdf')}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => descargarDocumento('word')}
              className="w-full flex items-center justify-center gap-2 py-2 bg-medico-50 text-medico-600 rounded-lg text-xs font-medium hover:bg-medico-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> Word
            </button>
          </div>
        </div>
      </div>

      {consulta.transcripcionDelAudio && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4 text-medico-500" /> Transcripcion del Audio
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            {consulta.transcripcionDelAudio}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            {estaEditando ? <Edit3 className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4 text-medico-500" />}
            {estaEditando ? 'Editando Nota Clinica' : 'Nota Clinica'}
          </h3>
          {!estaEditando && esBorrador && puedeEditar && (
            <button onClick={iniciarEdicion}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors">
              <Edit3 className="w-3 h-3" /> Editar
            </button>
          )}
          {estaEditando && (
            <div className="flex gap-2">
              <button onClick={() => establecerEstaEditando(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button onClick={guardarEdicion}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
                <Save className="w-3 h-3" /> Guardar
              </button>
            </div>
          )}
        </div>

        {estaEditando ? (
          <EditorNotaClinicaEstructurada
            notaClinicaOriginal={consulta.notaClinicaEstructurada}
            alGuardar={(editada) => { establecerConsulta(prev => prev ? { ...prev, notaClinicaEstructurada: editada } : null); establecerEstaEditando(false); establecerMensajeAccion('Nota actualizada') }}
            alCancelar={() => establecerEstaEditando(false)}
          />
        ) : (
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {consulta.notaClinicaEstructurada || 'Sin nota clinica generada'}
          </div>
        )}
      </div>
    </div>
  )
}
