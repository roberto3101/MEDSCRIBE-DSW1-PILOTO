import { useRef, useState, useEffect } from 'react'
import Modal from './Modal'
import { Eraser, Check, X } from 'lucide-react'

interface PropiedadesModalFirma {
  estaAbierto: boolean
  alCerrar: () => void
  alConfirmar: (firmaBase64: string) => void
  titulo: string
}

export default function ModalFirmaDigital({ estaAbierto, alCerrar, alConfirmar, titulo }: PropiedadesModalFirma) {
  const referenciaCanvas = useRef<HTMLCanvasElement>(null)
  const estaEstaDibujando = useRef(false)
  const [tieneTrazos, establecerTieneTrazos] = useState(false)

  useEffect(() => {
    if (estaAbierto) {
      setTimeout(() => {
        const canvas = referenciaCanvas.current
        const contexto = canvas?.getContext('2d')
        if (canvas && contexto) {
          contexto.lineWidth = 2.5
          contexto.lineCap = 'round'
          contexto.lineJoin = 'round'
          contexto.strokeStyle = '#1e293b'
          contexto.clearRect(0, 0, canvas.width, canvas.height)
          establecerTieneTrazos(false)
          estaEstaDibujando.current = false
        }
      }, 50)
    }
  }, [estaAbierto])

  const obtenerPosicion = (evento: any) => {
    const canvas = referenciaCanvas.current
    if (!canvas) return { x: 0, y: 0 }
    const rectangulo = canvas.getBoundingClientRect()
    const escalaX = canvas.width / rectangulo.width
    const escalaY = canvas.height / rectangulo.height
    const clienteX = evento.changedTouches ? evento.changedTouches[0].clientX : evento.clientX
    const clienteY = evento.changedTouches ? evento.changedTouches[0].clientY : evento.clientY
    return { x: (clienteX - rectangulo.left) * escalaX, y: (clienteY - rectangulo.top) * escalaY }
  }

  const iniciarTrazo = (evento: any) => {
    evento.preventDefault()
    estaEstaDibujando.current = true
    const contexto = referenciaCanvas.current?.getContext('2d')
    if (contexto) {
      contexto.beginPath()
      const { x, y } = obtenerPosicion(evento)
      contexto.moveTo(x, y)
      establecerTieneTrazos(true)
    }
  }

  const continuarTrazo = (evento: any) => {
    evento.preventDefault()
    if (!estaEstaDibujando.current) return
    const contexto = referenciaCanvas.current?.getContext('2d')
    if (contexto) {
      const { x, y } = obtenerPosicion(evento)
      contexto.lineTo(x, y)
      contexto.stroke()
    }
  }

  const finalizarTrazo = () => {
    estaEstaDibujando.current = false
    referenciaCanvas.current?.getContext('2d')?.beginPath()
  }

  const limpiarCanvas = () => {
    const canvas = referenciaCanvas.current
    const contexto = canvas?.getContext('2d')
    if (canvas && contexto) {
      contexto.clearRect(0, 0, canvas.width, canvas.height)
      establecerTieneTrazos(false)
      estaEstaDibujando.current = false
    }
  }

  const confirmarFirma = () => {
    if (!tieneTrazos) return
    const datosImagen = referenciaCanvas.current?.toDataURL('image/png')
    if (datosImagen) alConfirmar(datosImagen)
  }

  if (!estaAbierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={alCerrar} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
          <button onClick={alCerrar} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-400 mb-3 text-center">Dibuje su firma en el recuadro</p>
          <canvas
            ref={referenciaCanvas}
            width={400}
            height={180}
            onMouseDown={iniciarTrazo}
            onMouseMove={continuarTrazo}
            onMouseUp={finalizarTrazo}
            onMouseLeave={finalizarTrazo}
            onTouchStart={iniciarTrazo}
            onTouchMove={continuarTrazo}
            onTouchEnd={finalizarTrazo}
            style={{ maxWidth: '100%', height: 'auto' }}
            className="w-full border-2 border-dashed border-slate-300 rounded-lg cursor-crosshair touch-none bg-white block"
          />
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={limpiarCanvas}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Eraser className="w-4 h-4" />
            Limpiar
          </button>
          <button onClick={alCerrar}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={confirmarFirma} disabled={!tieneTrazos}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Check className="w-4 h-4" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
