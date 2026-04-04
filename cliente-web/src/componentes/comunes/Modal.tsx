import { X } from 'lucide-react'

interface PropiedadesModal {
  estaAbierto: boolean
  alCerrar: () => void
  titulo: string
  children: React.ReactNode
}

export default function Modal({ estaAbierto, alCerrar, titulo, children }: PropiedadesModal) {
  if (!estaAbierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={alCerrar} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{titulo}</h2>
          <button onClick={alCerrar} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
