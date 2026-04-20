import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, Search, Filter, File, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react'
import Cargando from '../../componentes/comunes/Cargando'

interface DocumentoGenerado {
  nombre_archivo: string
  tipo_documento: string
  formato: string
  tamano_legible: string
  fecha_legible: string
  nombre_paciente?: string
  especialidad?: string
}

interface RespuestaPaginada {
  documentos: DocumentoGenerado[]
  total: number
  pagina: number
  por_pagina: number
  total_paginas: number
}

export default function PaginaDocumentos() {
  const [documentos, establecerDocumentos] = useState<DocumentoGenerado[]>([])
  const [estaCargando, establecerEstaCargando] = useState(true)
  const [busqueda, establecerBusqueda] = useState('')
  const [filtroTipo, establecerFiltroTipo] = useState('')
  const [filtroFormato, establecerFiltroFormato] = useState('')
  const [paginaActual, establecerPaginaActual] = useState(1)
  const [totalPaginas, establecerTotalPaginas] = useState(1)
  const [totalDocumentos, establecerTotalDocumentos] = useState(0)
  const POR_PAGINA = 12

  const cargarDocumentos = useCallback(async (pagina: number) => {
    establecerEstaCargando(true)
    try {
      const parametros = new URLSearchParams()
      if (filtroTipo) parametros.set('tipo', filtroTipo)
      if (filtroFormato) parametros.set('formato', filtroFormato)
      if (busqueda) parametros.set('busqueda', busqueda)
      parametros.set('pagina', String(pagina))
      parametros.set('por_pagina', String(POR_PAGINA))

      const respuesta = await fetch(`http://localhost:8000/api/ia/documentos/listar?${parametros}`)
      const datos: RespuestaPaginada = await respuesta.json()
      establecerDocumentos(datos.documentos || [])
      establecerTotalDocumentos(datos.total || 0)
      establecerTotalPaginas(datos.total_paginas || 1)
      establecerPaginaActual(datos.pagina || 1)
    } catch {
      establecerDocumentos([])
    } finally {
      establecerEstaCargando(false)
    }
  }, [filtroTipo, filtroFormato, busqueda])

  useEffect(() => { cargarDocumentos(1) }, [filtroTipo, filtroFormato])

  const cambiarPagina = (nueva: number) => {
    if (nueva < 1 || nueva > totalPaginas) return
    cargarDocumentos(nueva)
  }

  const buscarConEnter = (evento: React.KeyboardEvent) => {
    if (evento.key === 'Enter') { establecerPaginaActual(1); cargarDocumentos(1) }
  }

  const limpiarFiltros = () => {
    establecerBusqueda('')
    establecerFiltroTipo('')
    establecerFiltroFormato('')
    establecerPaginaActual(1)
  }

  const descargarDocumento = async (nombreArchivo: string) => {
    const respuesta = await fetch(`http://localhost:8000/api/ia/documentos/descargar/${nombreArchivo}`)
    const blob = await respuesta.blob()
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(blob)
    enlace.download = nombreArchivo
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="w-7 h-7 text-medico-500" />
            Documentos
          </h1>
          <p className="text-slate-400 mt-1">{totalDocumentos} documentos generados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" value={busqueda} onChange={(e) => establecerBusqueda(e.target.value)}
              onKeyDown={buscarConEnter} placeholder="Buscar por paciente o archivo... (Enter)"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <select value={filtroTipo} onChange={(e) => establecerFiltroTipo(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
            <option value="">Todos los tipos</option>
            <option value="SOAP">Nota SOAP</option>
            <option value="HistoriaClinica">Historia Clinica</option>
            <option value="Receta">Receta</option>
          </select>
          <select value={filtroFormato} onChange={(e) => establecerFiltroFormato(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
            <option value="">Todos los formatos</option>
            <option value="PDF">PDF</option>
            <option value="Word">Word</option>
          </select>
          {(filtroTipo || filtroFormato || busqueda) && (
            <button onClick={limpiarFiltros}
              className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1">
              <Filter className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {estaCargando ? <Cargando /> : documentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-16 text-center">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No hay documentos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentos.map((doc) => (
              <div key={doc.nombre_archivo} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.formato === 'PDF' ? 'bg-red-50' : 'bg-medico-50'}`}>
                    {doc.formato === 'PDF' ? <File className="w-5 h-5 text-red-500" /> : <FileSpreadsheet className="w-5 h-5 text-medico-500" />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.formato === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-medico-50 text-medico-500'}`}>
                    {doc.formato}
                  </span>
                </div>
                {doc.nombre_paciente ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800 truncate mb-0.5" title={doc.nombre_paciente}>{doc.nombre_paciente}</p>
                    <p className="text-[11px] text-slate-400 truncate mb-2" title={doc.nombre_archivo}>{doc.nombre_archivo}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-700 truncate mb-2" title={doc.nombre_archivo}>{doc.nombre_archivo}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 flex-wrap">
                  <span>{doc.tipo_documento}</span><span>&bull;</span><span>{doc.tamano_legible}</span><span>&bull;</span><span>{doc.fecha_legible}</span>
                  {doc.especialidad ? (<><span>&bull;</span><span className="truncate">{doc.especialidad}</span></>) : null}
                </div>
                <button onClick={() => descargarDocumento(doc.nombre_archivo)}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium hover:bg-medico-50 hover:text-medico-600 hover:border-medico-200 transition-all opacity-0 group-hover:opacity-100">
                  <Download className="w-4 h-4" /> Descargar
                </button>
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-3">
              <p className="text-xs text-slate-400">
                Pagina {paginaActual} de {totalPaginas} ({totalDocumentos} documentos)
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual <= 1}
                  className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
                  let numeroPagina: number
                  if (totalPaginas <= 5) {
                    numeroPagina = i + 1
                  } else if (paginaActual <= 3) {
                    numeroPagina = i + 1
                  } else if (paginaActual >= totalPaginas - 2) {
                    numeroPagina = totalPaginas - 4 + i
                  } else {
                    numeroPagina = paginaActual - 2 + i
                  }
                  return (
                    <button key={numeroPagina} onClick={() => cambiarPagina(numeroPagina)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        paginaActual === numeroPagina ? 'bg-medico-500 text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}>
                      {numeroPagina}
                    </button>
                  )
                })}
                <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas}
                  className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
