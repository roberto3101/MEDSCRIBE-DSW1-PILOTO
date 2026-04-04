import { useState, useEffect } from 'react'
import { Save, X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

interface SeccionNota {
  titulo: string
  contenido: string
  expandida: boolean
}

interface PropiedadesEditor {
  notaClinicaOriginal: string
  alGuardar: (notaEditada: string) => void
  alCancelar: () => void
}

function parsearNotaASecciones(nota: string): SeccionNota[] {
  const secciones: SeccionNota[] = []
  let seccionActual: SeccionNota | null = null

  for (const linea of nota.split('\n')) {
    const texto = linea.trim()

    let esTitulo = false
    let tituloLimpio = ''

    if (texto.startsWith('## ')) {
      tituloLimpio = texto.substring(3).trim().replace(/\*/g, '')
      esTitulo = true
    } else if (texto.startsWith('# ')) {
      tituloLimpio = texto.substring(2).trim().replace(/\*/g, '')
      esTitulo = true
    } else if (texto.startsWith('**') && texto.endsWith('**')) {
      tituloLimpio = texto.replace(/\*/g, '').trim()
      esTitulo = true
    } else if (texto.startsWith('### ')) {
      tituloLimpio = texto.substring(4).trim().replace(/\*/g, '')
      esTitulo = true
    }

    if (esTitulo && tituloLimpio) {
      seccionActual = { titulo: tituloLimpio, contenido: '', expandida: true }
      secciones.push(seccionActual)
    } else if (seccionActual) {
      seccionActual.contenido += (seccionActual.contenido ? '\n' : '') + linea
    } else if (texto) {
      seccionActual = { titulo: 'Informacion General', contenido: linea, expandida: true }
      secciones.push(seccionActual)
    }
  }

  for (const s of secciones) {
    s.contenido = s.contenido.trim()
  }

  return secciones.filter(s => s.contenido || s.titulo)
}

function seccionesANotaClinica(secciones: SeccionNota[]): string {
  return secciones
    .filter(s => s.contenido.trim())
    .map(s => `## ${s.titulo}\n${s.contenido}`)
    .join('\n\n')
}

const SECCIONES_SUGERIDAS = [
  'Datos del Paciente', 'Motivo de Consulta', 'Enfermedad Actual', 'Antecedentes',
  'Examen Fisico', 'Diagnostico', 'Plan de Tratamiento', 'Indicaciones Generales',
  'Proxima Cita', 'S - Subjetivo', 'O - Objetivo', 'A - Analisis', 'P - Plan',
  'Prescripcion', 'Notas de Verificacion',
]

export default function EditorNotaClinicaEstructurada({ notaClinicaOriginal, alGuardar, alCancelar }: PropiedadesEditor) {
  const [secciones, establecerSecciones] = useState<SeccionNota[]>([])
  const [mostrarSugerencias, establecerMostrarSugerencias] = useState(false)

  useEffect(() => {
    establecerSecciones(parsearNotaASecciones(notaClinicaOriginal))
  }, [notaClinicaOriginal])

  const actualizarContenidoDeSeccion = (indice: number, nuevoContenido: string) => {
    establecerSecciones(prev => {
      const copia = [...prev]
      copia[indice] = { ...copia[indice], contenido: nuevoContenido }
      return copia
    })
  }

  const actualizarTituloDeSeccion = (indice: number, nuevoTitulo: string) => {
    establecerSecciones(prev => {
      const copia = [...prev]
      copia[indice] = { ...copia[indice], titulo: nuevoTitulo }
      return copia
    })
  }

  const toggleExpandirSeccion = (indice: number) => {
    establecerSecciones(prev => {
      const copia = [...prev]
      copia[indice] = { ...copia[indice], expandida: !copia[indice].expandida }
      return copia
    })
  }

  const eliminarSeccion = (indice: number) => {
    if (!confirm('¿Eliminar esta seccion del documento?')) return
    establecerSecciones(prev => prev.filter((_, i) => i !== indice))
  }

  const agregarSeccion = (titulo: string) => {
    establecerSecciones(prev => [...prev, { titulo, contenido: '', expandida: true }])
    establecerMostrarSugerencias(false)
  }

  const moverSeccion = (indice: number, direccion: 'arriba' | 'abajo') => {
    const nuevoIndice = direccion === 'arriba' ? indice - 1 : indice + 1
    if (nuevoIndice < 0 || nuevoIndice >= secciones.length) return
    establecerSecciones(prev => {
      const copia = [...prev]
      const temp = copia[indice]
      copia[indice] = copia[nuevoIndice]
      copia[nuevoIndice] = temp
      return copia
    })
  }

  const seccionesExistentes = new Set(secciones.map(s => s.titulo))
  const seccionesDisponibles = SECCIONES_SUGERIDAS.filter(s => !seccionesExistentes.has(s))

  const tieneContenidoVacio = (contenido: string) => {
    const lower = contenido.toLowerCase()
    return lower.includes('no disponible') || lower.includes('no se proporcion') ||
      lower.includes('no se tiene') || lower.includes('no se mencion') ||
      lower.includes('no se registr') || lower.includes('no se realiz')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Edite cada seccion individualmente. Las secciones vacias no apareceran en el documento.</p>
        <div className="flex gap-2">
          <button onClick={alCancelar}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X className="w-3 h-3" /> Cancelar
          </button>
          <button onClick={() => alGuardar(seccionesANotaClinica(secciones))}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
            <Save className="w-3 h-3" /> Guardar cambios
          </button>
        </div>
      </div>

      {secciones.map((seccion, indice) => (
        <div key={indice} className={`border rounded-lg overflow-hidden transition-all ${
          tieneContenidoVacio(seccion.contenido) ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moverSeccion(indice, 'arriba')} disabled={indice === 0}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={() => moverSeccion(indice, 'abajo')} disabled={indice === secciones.length - 1}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
            </div>

            <input type="text" value={seccion.titulo} onChange={(e) => actualizarTituloDeSeccion(indice, e.target.value)}
              className="flex-1 text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none" />

            {tieneContenidoVacio(seccion.contenido) && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">Requiere edicion</span>
            )}

            <button onClick={() => toggleExpandirSeccion(indice)}
              className="p-1 rounded hover:bg-slate-200 text-slate-400">
              {seccion.expandida ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => eliminarSeccion(indice)}
              className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {seccion.expandida && (
            <div className="p-3">
              <textarea value={seccion.contenido} onChange={(e) => actualizarContenidoDeSeccion(indice, e.target.value)}
                rows={Math.max(2, seccion.contenido.split('\n').length + 1)}
                placeholder="Escriba el contenido de esta seccion..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400 resize-y" />
            </div>
          )}
        </div>
      ))}

      <div className="relative">
        <button onClick={() => establecerMostrarSugerencias(!mostrarSugerencias)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-medico-300 hover:text-medico-500 transition-colors">
          <Plus className="w-4 h-4" /> Agregar seccion
        </button>

        {mostrarSugerencias && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {seccionesDisponibles.map(titulo => (
              <button key={titulo} onClick={() => agregarSeccion(titulo)}
                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-medico-50 hover:text-medico-600 transition-colors">
                {titulo}
              </button>
            ))}
            <button onClick={() => agregarSeccion('Nueva Seccion')}
              className="w-full text-left px-4 py-2 text-sm text-medico-600 font-medium hover:bg-medico-50 border-t border-slate-100">
              + Seccion personalizada
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
