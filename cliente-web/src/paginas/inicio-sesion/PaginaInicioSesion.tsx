import { Suspense, lazy } from 'react'
import FormularioLogin from './FormularioLogin'
import { Stethoscope, Shield, Zap, FileCheck } from 'lucide-react'

const ParticulasSigueCursor = lazy(() => import('../../componentes/tres-dimensiones/ParticulasSigueCursor'))

const caracteristicasDelProducto = [
  { icono: Zap, titulo: 'Transcripcion Instantanea', descripcion: 'Audio a texto en segundos con IA' },
  { icono: FileCheck, titulo: 'Notas SOAP Automaticas', descripcion: 'Estructuracion clinica profesional' },
  { icono: Shield, titulo: 'Datos Seguros', descripcion: 'Encriptacion y cumplimiento normativo' },
]

export default function PaginaInicioSesion() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-medico-400 to-medico-600 rounded-xl flex items-center justify-center shadow-lg shadow-medico-200">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">MedScribe AI</h1>
              <p className="text-sm text-slate-400">Documentacion medica automatizada</p>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-1">Iniciar Sesion</h2>
            <p className="text-sm text-slate-400 mb-6">Ingresa tus credenciales para continuar</p>
            <FormularioLogin />
          </div>

          <p className="text-center text-xs text-slate-300 mt-6">
            MedScribe AI v1.0 &middot; Lima, Peru &middot; 2026
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-medico-600 via-medico-700 to-cyan-700 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <ParticulasSigueCursor />
          </Suspense>
        </div>

        <div className="relative z-10 px-12 max-w-lg">
          <h2 className="text-3xl font-bold text-white mb-3">
            Documenta consultas en segundos
          </h2>
          <p className="text-medico-200 text-base leading-relaxed mb-10">
            Graba tu consulta por voz y recibe un documento clinico estructurado listo para revision y aprobacion.
          </p>

          <div className="space-y-5">
            {caracteristicasDelProducto.map(({ icono: Icono, titulo, descripcion }) => (
              <div key={titulo} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Icono className="w-5 h-5 text-medico-200" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{titulo}</h3>
                  <p className="text-sm text-medico-300">{descripcion}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
            <div>
              <p className="text-2xl font-bold text-white">2-4h</p>
              <p className="text-xs text-medico-300">Ahorro diario</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">95%</p>
              <p className="text-xs text-medico-300">Precision</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt;30s</p>
              <p className="text-xs text-medico-300">Por consulta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
