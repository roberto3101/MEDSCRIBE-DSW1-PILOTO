import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Search, Filter, Clock, CheckCircle, XCircle, FileEdit, Eye, ChevronRight } from 'lucide-react'
import Cargando from '../../componentes/comunes/Cargando'

interface ConsultaResumen {
  idConsulta: number
  idPacienteAtendido: number
  especialidadMedicaAplicada: string
  tipoDocumentoClinico: string
  estadoActualDeLaConsulta: string
  fechaYHoraDeLaConsulta: string
  transcripcionDelAudio: string
  notaClinicaEstructurada: string
}

const coloresPorEstado: Record<string, string> = {
  Grabando: 'bg-blue-50 text-blue-600',
  Transcribiendo: 'bg-cyan-50 text-cyan-600',
  Procesando: 'bg-amber-50 text-amber-600',
  Borrador: 'bg-amber-50 text-amber-600',
  Aprobado: 'bg-emerald-50 text-emerald-600',
  Rechazado: 'bg-red-50 text-red-500',
}

const iconosPorEstado: Record<string, any> = {
  Borrador: FileEdit,
  Aprobado: CheckCircle,
  Rechazado: XCircle,
}

export default function PaginaConsultas() {
  const [consultas, establecerConsultas] = useState<ConsultaResumen[]>([])
  const [pacientes, establecerPacientes] = useState<Record<number, string>>({})
  const [estaCargando, establecerEstaCargando] = useState(true)
  const [filtroEstado, establecerFiltroEstado] = useState('')
  const [filtroTipo, establecerFiltroTipo] = useState('')
  const [busqueda, establecerBusqueda] = useState('')
  const navegarHacia = useNavigate()

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [respConsultas, respPacientes] = await Promise.all([
          fetch('/api/consultas/medico/1').then(r => r.json()),
          fetch('/api/pacientes').then(r => r.json()),
        ])
        establecerConsultas(respConsultas || [])
        const mapaPacientes: Record<number, string> = {}
        for (const p of (respPacientes || [])) {
          mapaPacientes[p.idPaciente] = `${p.nombreDelPaciente} ${p.apellidoDelPaciente}`
        }
        establecerPacientes(mapaPacientes)
      } catch { /* silenciar */ }
      finally { establecerEstaCargando(false) }
    }
    cargarDatos()
  }, [])

  const consultasFiltradas = consultas.filter(c => {
    if (filtroEstado && c.estadoActualDeLaConsulta !== filtroEstado) return false
    if (filtroTipo && c.tipoDocumentoClinico !== filtroTipo) return false
    if (busqueda) {
      const nombrePaciente = pacientes[c.idPacienteAtendido]?.toLowerCase() || ''
      const textoBusqueda = busqueda.toLowerCase()
      if (!nombrePaciente.includes(textoBusqueda) && !c.especialidadMedicaAplicada.toLowerCase().includes(textoBusqueda)) return false
    }
    return true
  })

  const contadores = {
    total: consultas.length,
    borrador: consultas.filter(c => c.estadoActualDeLaConsulta === 'Borrador').length,
    aprobado: consultas.filter(c => c.estadoActualDeLaConsulta === 'Aprobado').length,
    rechazado: consultas.filter(c => c.estadoActualDeLaConsulta === 'Rechazado').length,
  }

  if (estaCargando) return <Cargando />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Activity className="w-7 h-7 text-medico-500" />
          Consultas
        </h1>
        <p className="text-slate-400 mt-1">{contadores.total} consultas registradas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { etiqueta: 'Todas', valor: contadores.total, filtro: '', color: 'bg-slate-50 text-slate-600 border-slate-200' },
          { etiqueta: 'Borrador', valor: contadores.borrador, filtro: 'Borrador', color: 'bg-amber-50 text-amber-600 border-amber-200' },
          { etiqueta: 'Aprobadas', valor: contadores.aprobado, filtro: 'Aprobado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
          { etiqueta: 'Rechazadas', valor: contadores.rechazado, filtro: 'Rechazado', color: 'bg-red-50 text-red-500 border-red-200' },
        ].map(({ etiqueta, valor, filtro, color }) => (
          <button key={etiqueta} onClick={() => establecerFiltroEstado(filtro === filtroEstado ? '' : filtro)}
            className={`p-3 rounded-xl border text-left transition-all ${filtroEstado === filtro ? `${color} shadow-sm ring-2 ring-offset-1 ring-current/20` : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <p className="text-xl font-bold">{valor}</p>
            <p className="text-xs">{etiqueta}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input type="text" value={busqueda} onChange={(e) => establecerBusqueda(e.target.value)}
            placeholder="Buscar por paciente o especialidad..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
        </div>
        <select value={filtroTipo} onChange={(e) => establecerFiltroTipo(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
          <option value="">Todos los tipos</option>
          <option value="SOAP">Nota SOAP</option>
          <option value="HistoriaClinica">Historia Clinica</option>
          <option value="Receta">Receta</option>
        </select>
        {(filtroEstado || filtroTipo || busqueda) && (
          <button onClick={() => { establecerFiltroEstado(''); establecerFiltroTipo(''); establecerBusqueda('') }}
            className="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {consultasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-16 text-center">
          <Activity className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No hay consultas{filtroEstado || filtroTipo || busqueda ? ' con esos filtros' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {consultasFiltradas.map(consulta => {
            const IconoEstado = iconosPorEstado[consulta.estadoActualDeLaConsulta] || Clock
            const nombrePaciente = pacientes[consulta.idPacienteAtendido] || 'Paciente no identificado'
            const fecha = consulta.fechaYHoraDeLaConsulta?.split('T')
            const preview = consulta.notaClinicaEstructurada?.substring(0, 120).replace(/[#*]/g, '') || 'Sin nota clinica'

            return (
              <button key={consulta.idConsulta}
                onClick={() => navegarHacia(`/consultas/${consulta.idConsulta}`)}
                className="w-full bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-medico-200 transition-all text-left group">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${coloresPorEstado[consulta.estadoActualDeLaConsulta] || 'bg-slate-100 text-slate-500'}`}>
                    <IconoEstado className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{nombrePaciente}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${coloresPorEstado[consulta.estadoActualDeLaConsulta] || 'bg-slate-100 text-slate-500'}`}>
                        {consulta.estadoActualDeLaConsulta}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                      <span>{consulta.tipoDocumentoClinico}</span>
                      <span>&bull;</span>
                      <span>{consulta.especialidadMedicaAplicada}</span>
                      <span>&bull;</span>
                      <span>{fecha?.[0]} {fecha?.[1]?.substring(0, 5)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{preview}...</p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-medico-500 transition-colors flex-shrink-0 mt-2" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
