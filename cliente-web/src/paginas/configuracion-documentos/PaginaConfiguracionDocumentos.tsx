import { useState, useEffect, useRef } from 'react'
import { Settings, Upload, Save, Building2, User, FileText, CheckCircle, Image, Pen } from 'lucide-react'
import Cargando from '../../componentes/comunes/Cargando'
import ModalFirmaDigital from '../../componentes/comunes/ModalFirmaDigital'

interface ConfiguracionDocumentos {
  nombre_clinica: string
  ruc: string
  direccion: string
  telefono: string
  correo: string
  logo_path: string
  nombre_medico: string
  colegiatura: string
  especialidad_medico: string
  formato_documento: string
  firma_medico: string
  firma_clinica: string
}

interface FormatoDisponible {
  codigo: string
  nombre: string
  descripcion: string
}

export default function PaginaConfiguracionDocumentos() {
  const [config, establecerConfig] = useState<ConfiguracionDocumentos>({
    nombre_clinica: '', ruc: '', direccion: '', telefono: '', correo: '',
    logo_path: '', nombre_medico: '', colegiatura: '', especialidad_medico: '',
    formato_documento: 'moderno_medico', firma_medico: '', firma_clinica: '',
  })
  const [modalFirmaMedico, establecerModalFirmaMedico] = useState(false)
  const [modalFirmaClinica, establecerModalFirmaClinica] = useState(false)
  const [urlPreviewFormato, establecerUrlPreview] = useState('')
  const [tipoDocumentoPreview, establecerTipoDocumentoPreview] = useState('SOAP')

  const actualizarPreview = (formato: string, tipo: string) => {
    establecerUrlPreview(`http://localhost:8000/api/ia/configuracion/preview-formato/${formato}?tipo_documento=${tipo}&t=${Date.now()}`)
  }
  const [formatosDisponibles, establecerFormatos] = useState<FormatoDisponible[]>([])
  const [estaCargando, establecerEstaCargando] = useState(true)
  const [estaGuardando, establecerEstaGuardando] = useState(false)
  const [mensajeExito, establecerMensajeExito] = useState('')
  const [estaSubiendoLogo, establecerEstaSubiendoLogo] = useState(false)
  const referenciaInputLogo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [respConfig, respFormatos] = await Promise.all([
          fetch('http://localhost:8000/api/ia/configuracion/obtener'),
          fetch('http://localhost:8000/api/ia/configuracion/formatos'),
        ])
        const datosConfig = await respConfig.json()
        const datosFormatos = await respFormatos.json()
        establecerConfig(datosConfig)
        establecerFormatos(datosFormatos.formatos || [])
      } catch {
        console.error('Error al cargar configuracion')
      } finally {
        establecerEstaCargando(false)
      }
    }
    cargarTodo()
  }, [])

  const guardarConfiguracion = async () => {
    if (!validarTodosLosCamposAntesDeGuardar()) return

    establecerEstaGuardando(true)
    try {
      await fetch('http://localhost:8000/api/ia/configuracion/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      establecerMensajeExito('Configuracion guardada exitosamente')
      setTimeout(() => establecerMensajeExito(''), 3000)
    } catch {
      alert('Error al guardar configuracion')
    } finally {
      establecerEstaGuardando(false)
    }
  }

  const subirLogo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0]
    if (!archivo) return

    const extensionesPermitidas = ['png', 'jpg', 'jpeg', 'svg', 'webp']
    const extension = archivo.name.rsplit ? archivo.name.split('.').pop()?.toLowerCase() : archivo.name.split('.').pop()?.toLowerCase()
    if (!extension || !extensionesPermitidas.includes(extension)) {
      alert('Solo se permiten imagenes: PNG, JPG, SVG, WEBP')
      return
    }
    if (archivo.size > 2 * 1024 * 1024) {
      alert('El logo no debe superar 2 MB')
      return
    }
    if (!archivo.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen')
      return
    }

    establecerEstaSubiendoLogo(true)
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      const respuesta = await fetch('http://localhost:8000/api/ia/configuracion/subir-logo', {
        method: 'POST',
        body: formData,
      })
      const datos = await respuesta.json()
      establecerConfig(prev => ({ ...prev, logo_path: datos.ruta }))
      establecerMensajeExito('Logo subido exitosamente')
      setTimeout(() => establecerMensajeExito(''), 3000)
    } catch {
      alert('Error al subir logo')
    } finally {
      establecerEstaSubiendoLogo(false)
    }
  }

  const [erroresDeValidacion, establecerErrores] = useState<Record<string, string>>({})

  const reglasPorCampo: Record<string, { patron: RegExp; maximo: number; mensaje: string; validacionFinal?: (v: string) => string | null }> = {
    nombre_clinica: { patron: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-,&']*$/, maximo: 150, mensaje: 'Solo letras y caracteres basicos' },
    ruc: { patron: /^\d*$/, maximo: 11, mensaje: 'Solo digitos numericos',
      validacionFinal: (v) => v.length > 0 && v.length !== 11 ? 'El RUC debe tener exactamente 11 digitos' : null },
    direccion: { patron: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\d.\-,#/°]*$/, maximo: 200, mensaje: 'Caracteres no permitidos' },
    telefono: { patron: /^[\d\s\-+()]*$/, maximo: 15, mensaje: 'Solo numeros, guiones y parentesis' },
    correo: { patron: /^[a-zA-Z0-9._%+\-@]*$/, maximo: 80, mensaje: 'Caracteres no permitidos en correo',
      validacionFinal: (v) => {
        if (!v) return null
        if (v.length > 80) return 'Maximo 80 caracteres'
        if (!(/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/).test(v)) return 'Formato invalido: usuario@dominio.com'
        if (v.split('@').length !== 2) return 'Solo un @ permitido'
        const [usuario, dominio] = v.split('@')
        if (usuario.length > 30) return 'Usuario muy largo (max 30)'
        if (dominio.length > 40) return 'Dominio muy largo (max 40)'
        return null
      }
    },
    nombre_medico: { patron: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]*$/, maximo: 80, mensaje: 'Solo letras, puntos y guiones' },
    colegiatura: { patron: /^[CMP\d\-]*$/, maximo: 10, mensaje: 'Solo CMP, numeros y guion',
      validacionFinal: (v) => v.length > 0 && v.length >= 5 && !(/^CMP-\d{4,6}$/).test(v) ? 'Formato: CMP-12345' : null },
    especialidad_medico: { patron: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]*$/, maximo: 60, mensaje: 'Solo letras' },
  }

  const actualizarCampo = (campo: keyof ConfiguracionDocumentos, valor: string) => {
    const regla = reglasPorCampo[campo]
    if (regla) {
      if (valor.length > regla.maximo) return
      if (!regla.patron.test(valor)) {
        establecerErrores(prev => ({ ...prev, [campo]: regla.mensaje }))
        return
      }
      const errorFinal = regla.validacionFinal?.(valor)
      if (errorFinal) {
        establecerErrores(prev => ({ ...prev, [campo]: errorFinal }))
      } else {
        establecerErrores(prev => {
          const nuevos = { ...prev }
          delete nuevos[campo]
          return nuevos
        })
      }
    }
    establecerConfig(prev => ({ ...prev, [campo]: valor }))
  }

  const validarTodosLosCamposAntesDeGuardar = (): boolean => {
    const errores: Record<string, string> = {}
    for (const [campo, regla] of Object.entries(reglasPorCampo)) {
      const valor = config[campo as keyof ConfiguracionDocumentos]
      if (valor && !regla.patron.test(valor)) errores[campo] = regla.mensaje
      if (valor && regla.validacionFinal) {
        const error = regla.validacionFinal(valor)
        if (error) errores[campo] = error
      }
    }
    establecerErrores(errores)
    return Object.keys(errores).length === 0
  }

  const tieneErrores = Object.keys(erroresDeValidacion).length > 0

  if (estaCargando) return <Cargando />

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Settings className="w-7 h-7 text-medico-500" />
          Configuracion de Documentos
        </h1>
        <p className="text-slate-400 mt-1">Configura los datos que apareceran en los documentos generados</p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {mensajeExito}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-medico-500" />
          Formato de Documento
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {formatosDisponibles.map((formato) => {
            const coloresPreview: Record<string, string> = {
              clasico_minsa: 'border-slate-600 bg-slate-50',
              moderno_medico: 'border-sky-500 bg-sky-50',
              clinico_elegante: 'border-emerald-500 bg-emerald-50',
              compacto_funcional: 'border-indigo-500 bg-indigo-50',
            }
            const colorBarra: Record<string, string> = {
              clasico_minsa: 'bg-slate-700',
              moderno_medico: 'bg-sky-500',
              clinico_elegante: 'bg-emerald-500',
              compacto_funcional: 'bg-indigo-500',
            }
            const seleccionado = config.formato_documento === formato.codigo

            return (
              <button
                key={formato.codigo}
                type="button"
                onClick={() => { establecerConfig(prev => ({ ...prev, formato_documento: formato.codigo })); actualizarPreview(formato.codigo, tipoDocumentoPreview) }}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  seleccionado
                    ? `${coloresPreview[formato.codigo] || 'border-medico-500 bg-medico-50'} shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="mb-3 rounded-md border border-slate-200 bg-white p-2 h-16 flex flex-col justify-between overflow-hidden">
                  <div className={`h-1 w-full rounded-full ${colorBarra[formato.codigo] || 'bg-slate-400'}`} />
                  <div className="space-y-1 mt-1">
                    <div className="h-1 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-1 w-1/2 bg-slate-100 rounded-full" />
                    <div className="h-1 w-2/3 bg-slate-100 rounded-full" />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div className="h-1 w-1/4 bg-slate-200 rounded-full" />
                    <div className="h-1 w-1/4 bg-slate-200 rounded-full" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700">{formato.nombre}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{formato.descripcion}</p>
                {seleccionado && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-3 h-3 text-medico-500" />
                    <span className="text-[10px] font-medium text-medico-600">Seleccionado</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {urlPreviewFormato && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-medico-500" />
              Vista previa — {formatosDisponibles.find(f => f.codigo === config.formato_documento)?.nombre}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
                {[
                  { valor: 'SOAP', etiqueta: 'SOAP' },
                  { valor: 'HistoriaClinica', etiqueta: 'Historia Clinica' },
                  { valor: 'Receta', etiqueta: 'Receta' },
                ].map(({ valor, etiqueta }) => (
                  <button key={valor}
                    onClick={() => { establecerTipoDocumentoPreview(valor); actualizarPreview(config.formato_documento, valor) }}
                    className={`text-[10px] font-medium px-3 py-1.5 transition-colors ${
                      tipoDocumentoPreview === valor
                        ? 'bg-medico-500 text-white'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
              <a href={urlPreviewFormato} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-medium px-2 py-1 rounded bg-medico-50 text-medico-600 hover:bg-medico-100 transition-colors">
                Abrir
              </a>
              <button onClick={() => establecerUrlPreview('')}
                className="text-[10px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
          <iframe src={urlPreviewFormato} className="w-full h-[700px] border-0" title="Vista previa del documento" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-medico-500" />
            Datos de la Clinica
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre de la Clinica</label>
              <input type="text" value={config.nombre_clinica} onChange={(e) => actualizarCampo('nombre_clinica', e.target.value)}
                placeholder="Clinica San Pablo" maxLength={200}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.nombre_clinica ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
              {erroresDeValidacion.nombre_clinica && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.nombre_clinica}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RUC</label>
              <input type="text" value={config.ruc} onChange={(e) => actualizarCampo('ruc', e.target.value)}
                placeholder="20123456789" maxLength={11}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.ruc ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
              {erroresDeValidacion.ruc && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.ruc}</p>}
              <p className="text-[10px] text-slate-300 mt-0.5">{config.ruc.length}/11 digitos</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Direccion</label>
              <input type="text" value={config.direccion} onChange={(e) => actualizarCampo('direccion', e.target.value)}
                placeholder="Av. Arequipa 1234, Miraflores, Lima" maxLength={300}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.direccion ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
              {erroresDeValidacion.direccion && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.direccion}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefono</label>
                <input type="tel" value={config.telefono} onChange={(e) => actualizarCampo('telefono', e.target.value)}
                  placeholder="01-555-1234" maxLength={20}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.telefono ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
                {erroresDeValidacion.telefono && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.telefono}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Correo</label>
                <input type="email" value={config.correo} onChange={(e) => actualizarCampo('correo', e.target.value)}
                  placeholder="info@clinica.pe" maxLength={150}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.correo ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
                {erroresDeValidacion.correo && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.correo}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Logo de la Clinica</label>
              <div className="flex items-center gap-4">
                {(config as any).logo_url ? (
                  <img src={`http://localhost:8000${(config as any).logo_url}`} alt="Logo" className="w-16 h-16 rounded-lg border border-slate-200 object-contain" />
                ) : config.logo_path ? (
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                    <CheckCircle className="w-6 h-6 text-exito" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                    <Image className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                <div>
                  <input ref={referenciaInputLogo} type="file" accept="image/*" onChange={subirLogo} className="hidden" />
                  <button onClick={() => referenciaInputLogo.current?.click()} disabled={estaSubiendoLogo}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {estaSubiendoLogo ? 'Subiendo...' : config.logo_path ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o SVG. Maximo 2MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-medico-500" />
            Datos del Medico (Firma)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo del Medico</label>
              <input type="text" value={config.nombre_medico} onChange={(e) => actualizarCampo('nombre_medico', e.target.value)}
                placeholder="Dr. Jose Roberto Garcia" maxLength={100}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.nombre_medico ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
              {erroresDeValidacion.nombre_medico && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.nombre_medico}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Numero de Colegiatura (CMP)</label>
              <input type="text" value={config.colegiatura} onChange={(e) => actualizarCampo('colegiatura', e.target.value)}
                placeholder="CMP-12345" maxLength={20}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.colegiatura ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
              {erroresDeValidacion.colegiatura && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.colegiatura}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Especialidad Medica</label>
              <input type="text" value={config.especialidad_medico} onChange={(e) => actualizarCampo('especialidad_medico', e.target.value)}
                placeholder="Medicina General" maxLength={100}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 ${erroresDeValidacion.especialidad_medico ? 'border-red-300' : 'border-slate-200 focus:border-medico-400'}`} />
              {erroresDeValidacion.especialidad_medico && <p className="text-[10px] text-red-500 mt-1">{erroresDeValidacion.especialidad_medico}</p>}
            </div>

            <div className="border border-slate-100 rounded-lg p-4 mt-4">
              <h3 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1">
                <Pen className="w-3 h-3 text-medico-500" />
                Firma Digital del Medico
              </h3>
              {config.firma_medico ? (
                <div className="text-center">
                  <img src={config.firma_medico} alt="Firma del medico" className="max-h-20 mx-auto border border-slate-200 rounded-lg p-1" />
                  <div className="flex justify-center gap-2 mt-2">
                    <button onClick={() => establecerModalFirmaMedico(true)}
                      className="text-xs text-medico-600 hover:text-medico-700 font-medium">Cambiar firma</button>
                    <button onClick={async () => { await fetch('http://localhost:8000/api/ia/configuracion/eliminar-firma?tipo=medico', { method: 'POST' }); establecerConfig(prev => ({ ...prev, firma_medico: '' })) }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium">Eliminar</button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{config.nombre_medico || 'Medico'}</p>
                  <p className="text-[10px] text-slate-400">{config.colegiatura || ''} {config.especialidad_medico ? `| ${config.especialidad_medico}` : ''}</p>
                </div>
              ) : (
                <button onClick={() => establecerModalFirmaMedico(true)}
                  className="w-full py-6 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-medico-300 hover:text-medico-500 transition-colors flex flex-col items-center gap-1">
                  <Pen className="w-5 h-5" />
                  Dibujar firma del medico
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-medico-500" />
          Firma Digital de la Clinica
        </h2>
        {config.firma_clinica ? (
          <div className="text-center">
            <img src={config.firma_clinica} alt="Firma de la clinica" className="max-h-24 mx-auto border border-slate-200 rounded-lg p-2" />
            <div className="flex justify-center gap-2 mt-3">
              <button onClick={() => establecerModalFirmaClinica(true)}
                className="text-xs text-medico-600 hover:text-medico-700 font-medium">Cambiar firma</button>
              <button onClick={async () => { await fetch('http://localhost:8000/api/ia/configuracion/eliminar-firma?tipo=clinica', { method: 'POST' }); establecerConfig(prev => ({ ...prev, firma_clinica: '' })) }}
                className="text-xs text-red-500 hover:text-red-600 font-medium">Eliminar</button>
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-2">{config.nombre_clinica || 'Clinica'}</p>
            <p className="text-[10px] text-slate-400">Sello Institucional</p>
          </div>
        ) : (
          <button onClick={() => establecerModalFirmaClinica(true)}
            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-medico-300 hover:text-medico-500 transition-colors flex flex-col items-center gap-1">
            <Pen className="w-5 h-5" />
            Dibujar firma o sello de la clinica
          </button>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={guardarConfiguracion} disabled={estaGuardando || tieneErrores}
          className="flex items-center gap-2 px-6 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="w-4 h-4" />
          {estaGuardando ? 'Guardando...' : tieneErrores ? 'Corrige los errores' : 'Guardar Configuracion'}
        </button>
      </div>

      <ModalFirmaDigital
        estaAbierto={modalFirmaMedico}
        alCerrar={() => establecerModalFirmaMedico(false)}
        alConfirmar={(firma) => { establecerConfig(prev => ({ ...prev, firma_medico: firma })); establecerModalFirmaMedico(false) }}
        titulo="Firma Digital del Medico"
      />

      <ModalFirmaDigital
        estaAbierto={modalFirmaClinica}
        alCerrar={() => establecerModalFirmaClinica(false)}
        alConfirmar={(firma) => { establecerConfig(prev => ({ ...prev, firma_clinica: firma })); establecerModalFirmaClinica(false) }}
        titulo="Firma Digital de la Clinica"
      />
    </div>
  )
}
