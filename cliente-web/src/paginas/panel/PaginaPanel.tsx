import { useState, useEffect } from 'react'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'
import { useNavigate } from 'react-router-dom'
import { Mic, FileText, Users, Activity } from 'lucide-react'

interface EstadisticasDelPanel {
  totalDocumentos: number
  totalConsultas: number
  totalPacientes: number
}

export default function PaginaPanel() {
  const { usuario } = useContextoAutenticacion()
  const navegarHacia = useNavigate()
  const [estadisticas, establecerEstadisticas] = useState<EstadisticasDelPanel>({ totalDocumentos: 0, totalConsultas: 0, totalPacientes: 0 })

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const [respDocumentos, respConsultas, respPacientes] = await Promise.all([
          fetch('http://localhost:8000/api/ia/documentos/listar').then(r => r.json()).catch(() => ({ total: 0 })),
          fetch(`/api/consultas/medico/${usuario?.idUsuario || 1}`).then(r => r.json()).catch(() => []),
          fetch('/api/pacientes').then(r => r.json()).catch(() => []),
        ])
        establecerEstadisticas({
          totalDocumentos: respDocumentos.total || 0,
          totalConsultas: Array.isArray(respConsultas) ? respConsultas.length : 0,
          totalPacientes: Array.isArray(respPacientes) ? respPacientes.length : 0,
        })
      } catch { /* silenciar */ }
    }
    cargarEstadisticas()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Buen dia, {usuario?.nombreCompleto?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1">
          {usuario?.nombreClinica ? `${usuario.nombreClinica} — ` : ''}Panel de control de MedScribe AI
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-medico-50 text-medico-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{estadisticas.totalConsultas}</p>
          <p className="text-sm text-slate-400 mt-0.5">Consultas Registradas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{estadisticas.totalPacientes}</p>
          <p className="text-sm text-slate-400 mt-0.5">Pacientes Registrados</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{estadisticas.totalDocumentos}</p>
          <p className="text-sm text-slate-400 mt-0.5">Documentos Generados</p>
        </div>
      </div>

      <button
        onClick={() => navegarHacia('/consultas/nueva')}
        className="w-full bg-gradient-to-br from-medico-500 to-medico-600 rounded-xl p-6 text-white hover:from-medico-600 hover:to-medico-700 transition-all shadow-lg shadow-medico-200 group text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mic className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Nueva Consulta</h3>
            <p className="text-medico-100 text-sm mt-0.5">Grabar y transcribir una consulta medica</p>
          </div>
        </div>
      </button>
    </div>
  )
}
