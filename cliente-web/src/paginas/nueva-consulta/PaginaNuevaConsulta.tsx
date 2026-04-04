import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Send, FileText, CheckCircle, RotateCcw, Users, Eye, Download, Edit3, Save, Search, Clock, User } from 'lucide-react'
import Modal from '../../componentes/comunes/Modal'
import EditorNotaClinicaEstructurada from '../../componentes/comunes/EditorNotaClinicaEstructurada'
import { useContextoAutenticacion } from '../../contextos/ContextoAutenticacion'

type EstadoDelFlujo = 'esperando' | 'grabando' | 'detenido' | 'transcribiendo' | 'procesando' | 'completado'

const etiquetasPorEstado: Record<EstadoDelFlujo, string> = {
  esperando: 'Presiona el microfono para iniciar',
  grabando: 'Grabando consulta...',
  detenido: 'Grabacion lista. Procesa con IA o graba de nuevo.',
  transcribiendo: 'Transcribiendo audio con IA...',
  procesando: 'Generando nota clinica...',
  completado: 'Documento generado exitosamente',
}

const CLAVE_SESION = 'medscribe_consulta_en_progreso'

function cargarEstadoPersistido() {
  try {
    const guardado = sessionStorage.getItem(CLAVE_SESION)
    return guardado ? JSON.parse(guardado) : null
  } catch { return null }
}

export default function PaginaNuevaConsulta() {
  const { tienePermiso } = useContextoAutenticacion()
  const estadoPersistido = cargarEstadoPersistido()

  const [estadoDelFlujo, establecerEstadoDelFlujo] = useState<EstadoDelFlujo>(estadoPersistido?.estadoDelFlujo === 'completado' ? 'completado' : 'esperando')
  const [tipoDocumento, establecerTipoDocumento] = useState(estadoPersistido?.tipoDocumento || 'SOAP')
  const [especialidad, establecerEspecialidad] = useState(estadoPersistido?.especialidad || 'Medicina General')
  const [transcripcion, establecerTranscripcion] = useState(estadoPersistido?.transcripcion || '')
  const [notaClinica, establecerNotaClinica] = useState(estadoPersistido?.notaClinica || '')
  const [estaEditando, establecerEstaEditando] = useState(false)
  const [notaEditada, establecerNotaEditada] = useState('')
  const [duracionEnSegundos, establecerDuracion] = useState(0)
  const [audioListo, establecerAudioListo] = useState(false)
  const [diarizacionActiva, establecerDiarizacionActiva] = useState(false)
  const [motorDiarizacion, establecerMotorDiarizacion] = useState('pyannote')
  const [modalDiarizacionAbierto, establecerModalDiarizacionAbierto] = useState(false)

  const [dniBusqueda, establecerDniBusqueda] = useState(estadoPersistido?.dniBusqueda || '')
  const [pacienteEncontrado, establecerPacienteEncontrado] = useState<any>(estadoPersistido?.pacienteEncontrado || null)
  const [buscandoPaciente, establecerBuscandoPaciente] = useState(false)
  const [historialDelPaciente, establecerHistorialDelPaciente] = useState<any[]>([])
  const [mostrarHistorial, establecerMostrarHistorial] = useState(false)
  const [infoDiarizacion, establecerInfoDiarizacion] = useState<any>(estadoPersistido?.infoDiarizacion || null)

  const persistirEstado = useCallback(() => {
    const estado = {
      estadoDelFlujo, tipoDocumento, especialidad, transcripcion, notaClinica,
      dniBusqueda, pacienteEncontrado, infoDiarizacion,
    }
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(estado))
  }, [estadoDelFlujo, tipoDocumento, especialidad, transcripcion, notaClinica, dniBusqueda, pacienteEncontrado, infoDiarizacion])

  useEffect(() => {
    if (transcripcion || notaClinica) persistirEstado()
  }, [transcripcion, notaClinica, estadoDelFlujo, persistirEstado])

  const referenciaMediaRecorder = useRef<MediaRecorder | null>(null)
  const referenciaTrozosDeAudio = useRef<Blob[]>([])
  const referenciaIntervalo = useRef<number | null>(null)
  const referenciaFlujoDeAudio = useRef<MediaStream | null>(null)

  const buscarPacientePorDni = async () => {
    if (dniBusqueda.length < 8) return
    establecerBuscandoPaciente(true)
    establecerPacienteEncontrado(null)
    establecerHistorialDelPaciente([])
    try {
      const respuesta = await fetch(`/api/pacientes/documento/${dniBusqueda}`)
      if (respuesta.ok) {
        const paciente = await respuesta.json()
        establecerPacienteEncontrado(paciente)

        const respHistorial = await fetch(`/api/consultas/medico/${1}`)
        if (respHistorial.ok) {
          const consultas = await respHistorial.json()
          const consultasDelPaciente = consultas.filter((c: any) => c.idPacienteAtendido === paciente.idPaciente)
          establecerHistorialDelPaciente(consultasDelPaciente)
        }
      }
    } catch { /* silenciar */ }
    finally { establecerBuscandoPaciente(false) }
  }

  const manejarCambioDni = (valor: string) => {
    if (!/^\d*$/.test(valor) || valor.length > 15) return
    establecerDniBusqueda(valor)
    if (valor.length < 8) {
      establecerPacienteEncontrado(null)
      establecerHistorialDelPaciente([])
    }
  }

  const limpiarIntervalo = useCallback(() => {
    if (referenciaIntervalo.current) {
      clearInterval(referenciaIntervalo.current)
      referenciaIntervalo.current = null
    }
  }, [])

  const liberarMicrofono = useCallback(() => {
    if (referenciaFlujoDeAudio.current) {
      referenciaFlujoDeAudio.current.getTracks().forEach((pista) => pista.stop())
      referenciaFlujoDeAudio.current = null
    }
  }, [])

  const iniciarGrabacion = async () => {
    try {
      const flujoDeAudio = await navigator.mediaDevices.getUserMedia({ audio: true })
      referenciaFlujoDeAudio.current = flujoDeAudio

      const grabador = new MediaRecorder(flujoDeAudio, { mimeType: 'audio/webm;codecs=opus' })
      referenciaMediaRecorder.current = grabador
      referenciaTrozosDeAudio.current = []
      establecerAudioListo(false)
      establecerTranscripcion('')
      establecerNotaClinica('')

      grabador.ondataavailable = (evento) => {
        if (evento.data.size > 0) {
          referenciaTrozosDeAudio.current.push(evento.data)
        }
      }

      grabador.onstop = () => {
        limpiarIntervalo()
        liberarMicrofono()
        establecerAudioListo(referenciaTrozosDeAudio.current.length > 0)
        establecerEstadoDelFlujo('detenido')
      }

      grabador.start(1000)
      establecerEstadoDelFlujo('grabando')
      establecerDuracion(0)
      referenciaIntervalo.current = window.setInterval(() => {
        establecerDuracion((anterior) => anterior + 1)
      }, 1000)
    } catch {
      alert('No se pudo acceder al microfono. Verifica los permisos del navegador.')
    }
  }

  const detenerGrabacion = () => {
    if (referenciaMediaRecorder.current && referenciaMediaRecorder.current.state === 'recording') {
      referenciaMediaRecorder.current.stop()
    }
  }

  const reiniciarGrabacion = () => {
    referenciaTrozosDeAudio.current = []
    establecerAudioListo(false)
    establecerDuracion(0)
    establecerTranscripcion('')
    establecerNotaClinica('')
    establecerEstadoDelFlujo('esperando')
    establecerInfoDiarizacion(null)
    establecerDniBusqueda('')
    establecerPacienteEncontrado(null)
    establecerHistorialDelPaciente([])
    establecerEstaEditando(false)
    sessionStorage.removeItem(CLAVE_SESION)
  }

  const enviarAlServicioIA = async () => {
    if (referenciaTrozosDeAudio.current.length === 0) return

    const archivoDeAudio = new Blob(referenciaTrozosDeAudio.current, { type: 'audio/webm' })

    establecerEstadoDelFlujo('transcribiendo')
    try {
      const datosFormulario = new FormData()
      datosFormulario.append('archivo', archivoDeAudio, 'consulta.webm')

      const urlTranscripcion = diarizacionActiva
        ? `http://localhost:8000/api/ia/transcribir?diarizar=true&motor_diarizacion=${motorDiarizacion}`
        : 'http://localhost:8000/api/ia/transcribir'

      const respuestaTranscripcion = await fetch(urlTranscripcion, {
        method: 'POST',
        body: datosFormulario,
      })

      if (!respuestaTranscripcion.ok) {
        throw new Error(`Error ${respuestaTranscripcion.status}`)
      }

      const datosTranscripcion = await respuestaTranscripcion.json()
      establecerTranscripcion(datosTranscripcion.transcripcion)
      if (datosTranscripcion.diarizacion) {
        establecerInfoDiarizacion(datosTranscripcion.diarizacion)
      }

      establecerEstadoDelFlujo('procesando')
      const respuestaProcesamiento = await fetch('http://localhost:8000/api/ia/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcripcion: datosTranscripcion.transcripcion,
          especialidad,
          tipo_documento: tipoDocumento,
        }),
      })

      if (!respuestaProcesamiento.ok) {
        throw new Error(`Error ${respuestaProcesamiento.status}`)
      }

      const datosProcesamiento = await respuestaProcesamiento.json()
      establecerNotaClinica(datosProcesamiento.nota_clinica)

      await fetch('http://localhost:8000/api/ia/generar-y-guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nota_clinica: datosProcesamiento.nota_clinica,
          tipo_documento: tipoDocumento,
        }),
      })

      try {
        await fetch('/api/consultas/registrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idMedicoResponsable: 1,
            idPacienteAtendido: pacienteEncontrado?.idPaciente || 0,
            especialidad,
            tipoDocumento,
            transcripcion: datosTranscripcion.transcripcion,
            notaClinica: datosProcesamiento.nota_clinica,
          }),
        })
      } catch { /* no bloquear el flujo principal */ }

      establecerEstadoDelFlujo('completado')
    } catch (error) {
      alert(`Error al procesar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      establecerEstadoDelFlujo('detenido')
    }
  }

  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
  }

  const descargarDocumentoGenerado = async (formato: 'pdf' | 'word') => {
    if (!notaClinica) return

    try {
      const endpoint = formato === 'pdf' ? '/api/ia/generar-pdf' : '/api/ia/generar-word'
      const respuesta = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota_clinica: notaClinica, tipo_documento: tipoDocumento }),
      })

      if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`)

      const blob = await respuesta.blob()
      const nombreArchivo = respuesta.headers.get('X-Nombre-Archivo') || `MedScribe_${tipoDocumento}.${formato === 'pdf' ? 'pdf' : 'docx'}`

      const enlaceDescarga = document.createElement('a')
      enlaceDescarga.href = URL.createObjectURL(blob)
      enlaceDescarga.download = nombreArchivo
      enlaceDescarga.click()
      URL.revokeObjectURL(enlaceDescarga.href)
    } catch (error) {
      alert(`Error al generar ${formato.toUpperCase()}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const estaEnProcesoDeIA = estadoDelFlujo === 'transcribiendo' || estadoDelFlujo === 'procesando'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Mic className="w-7 h-7 text-medico-500" />
          Nueva Consulta
        </h1>
        <p className="text-slate-400 mt-1">Graba la consulta y genera el documento clinico</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-medico-500" />
          Paciente
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" value={dniBusqueda} onChange={(e) => manejarCambioDni(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarPacientePorDni()}
              placeholder="Ingrese DNI del paciente y presione Enter"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <button onClick={buscarPacientePorDni} disabled={dniBusqueda.length < 8 || buscandoPaciente}
            className="px-4 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:opacity-50">
            {buscandoPaciente ? '...' : 'Buscar'}
          </button>
        </div>

        {pacienteEncontrado && (
          <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {pacienteEncontrado.nombreDelPaciente} {pacienteEncontrado.apellidoDelPaciente}
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                  <span>{pacienteEncontrado.tipoDocumentoIdentidad}: {pacienteEncontrado.numeroDocumentoIdentidad}</span>
                  <span>{pacienteEncontrado.sexoBiologico}</span>
                  <span>{pacienteEncontrado.fechaDeNacimiento?.split('T')[0]}</span>
                  {pacienteEncontrado.telefonoDeContacto && <span>Tel: {pacienteEncontrado.telefonoDeContacto}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {historialDelPaciente.length > 0 && (
                  <button onClick={() => establecerMostrarHistorial(!mostrarHistorial)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors">
                    <Clock className="w-3 h-3" />
                    {historialDelPaciente.length} consulta{historialDelPaciente.length > 1 ? 's' : ''} previa{historialDelPaciente.length > 1 ? 's' : ''}
                  </button>
                )}
                {historialDelPaciente.length === 0 && (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600">Primera consulta</span>
                )}
              </div>
            </div>

            {mostrarHistorial && historialDelPaciente.length > 0 && (
              <div className="mt-3 border-t border-emerald-200 pt-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Historial de consultas</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {historialDelPaciente.map((consulta: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-emerald-100">
                      <div>
                        <p className="text-xs font-medium text-slate-700">{consulta.tipoDocumentoClinico} — {consulta.especialidadMedicaAplicada}</p>
                        <p className="text-[10px] text-slate-400">{consulta.fechaYHoraDeLaConsulta?.split('T')[0]}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        consulta.estadoActualDeLaConsulta === 'Aprobado' ? 'bg-emerald-50 text-emerald-600' :
                        consulta.estadoActualDeLaConsulta === 'Borrador' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>{consulta.estadoActualDeLaConsulta}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {dniBusqueda.length >= 8 && !pacienteEncontrado && !buscandoPaciente && (
          <p className="mt-2 text-xs text-amber-600">Paciente no encontrado. Registrelo en la seccion de Pacientes antes de continuar.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Documento</label>
                <select value={tipoDocumento} onChange={(e) => establecerTipoDocumento(e.target.value)}
                  disabled={estadoDelFlujo !== 'esperando'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 disabled:opacity-50">
                  <option value="SOAP">Nota SOAP</option>
                  <option value="HistoriaClinica">Historia Clinica</option>
                  <option value="Receta">Receta Medica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Especialidad</label>
                <select value={especialidad} onChange={(e) => establecerEspecialidad(e.target.value)}
                  disabled={estadoDelFlujo !== 'esperando'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 disabled:opacity-50">
                  <option>Medicina General</option>
                  <option>Pediatria</option>
                  <option>Cardiologia</option>
                  <option>Ginecologia</option>
                  <option>Traumatologia</option>
                  <option>Dermatologia</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-medico-500" />
                <span className="text-sm font-medium text-slate-600">Separar voces (diarizacion)</span>
              </div>
              <button
                type="button"
                onClick={() => establecerDiarizacionActiva(!diarizacionActiva)}
                disabled={estadoDelFlujo !== 'esperando' && estadoDelFlujo !== 'detenido'}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  diarizacionActiva ? 'bg-medico-500' : 'bg-slate-300'
                } disabled:opacity-50`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  diarizacionActiva ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {diarizacionActiva && (
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => establecerMotorDiarizacion('pyannote')}
                  className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    motorDiarizacion === 'pyannote'
                      ? 'bg-medico-50 border-medico-300 text-medico-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                  Pyannote (local, gratuito)
                </button>
                <button type="button" onClick={() => establecerMotorDiarizacion('deepgram')}
                  className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    motorDiarizacion === 'deepgram'
                      ? 'bg-medico-50 border-medico-300 text-medico-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                  Deepgram (cloud, preciso)
                </button>
              </div>
            )}

            <div className="flex flex-col items-center py-8">
              <div className="relative">
                {estadoDelFlujo === 'grabando' && (
                  <div className="absolute inset-0 -m-2 rounded-full border-4 border-red-300 animate-ping" />
                )}
                <button
                  onClick={estadoDelFlujo === 'grabando' ? detenerGrabacion : iniciarGrabacion}
                  disabled={estaEnProcesoDeIA || estadoDelFlujo === 'detenido'}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    estadoDelFlujo === 'grabando'
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-200 scale-110'
                      : 'bg-gradient-to-br from-medico-500 to-medico-600 hover:from-medico-600 hover:to-medico-700 shadow-medico-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {estadoDelFlujo === 'grabando' ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>
              </div>

              {(estadoDelFlujo === 'grabando' || estadoDelFlujo === 'detenido') && (
                <p className="text-2xl font-mono font-bold text-slate-800 mt-4">{formatearDuracion(duracionEnSegundos)}</p>
              )}

              <p className={`text-sm mt-4 font-medium ${
                estadoDelFlujo === 'completado' ? 'text-exito' :
                estadoDelFlujo === 'grabando' ? 'text-red-500' :
                'text-slate-400'
              }`}>
                {etiquetasPorEstado[estadoDelFlujo]}
              </p>

              {estaEnProcesoDeIA && (
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-medico-500 rounded-full transition-all duration-1000"
                    style={{ width: estadoDelFlujo === 'transcribiendo' ? '40%' : '80%', animation: 'pulse 1.5s ease-in-out infinite' }}
                  />
                </div>
              )}
            </div>

            {audioListo && estadoDelFlujo === 'detenido' && (
              <div className="flex gap-3">
                <button onClick={reiniciarGrabacion}
                  className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  Grabar de nuevo
                </button>
                <button onClick={enviarAlServicioIA}
                  className="flex-1 flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors shadow-sm">
                  <Send className="w-4 h-4" />
                  Procesar con IA
                </button>
              </div>
            )}

            {estadoDelFlujo === 'completado' && (
              <button onClick={reiniciarGrabacion}
                className="w-full flex items-center justify-center gap-2 border border-medico-200 text-medico-600 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-50 transition-colors">
                <RotateCcw className="w-4 h-4" />
                Nueva grabacion
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {transcripcion && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-medico-500" />
                Transcripcion
              </h3>
              {infoDiarizacion && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-medico-50 text-medico-600">
                    {infoDiarizacion.hablantes_detectados} hablantes
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                    {infoDiarizacion.segmentos?.length || 0} segmentos
                  </span>
                  {infoDiarizacion.segmentos_descartados > 0 && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                      {infoDiarizacion.segmentos_descartados} descartados
                    </span>
                  )}
                  <button
                    onClick={() => establecerModalDiarizacionAbierto(true)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    Ver detalle
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{transcripcion}</p>
            </div>
          )}

          {notaClinica && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {estaEditando ? (
                <>
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    Editando Nota Clinica
                  </h3>
                  <EditorNotaClinicaEstructurada
                    notaClinicaOriginal={notaClinica}
                    alGuardar={(editada) => { establecerNotaClinica(editada); establecerEstaEditando(false) }}
                    alCancelar={() => establecerEstaEditando(false)}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-exito" />
                      Nota Clinica Generada
                    </h3>
                    <button onClick={() => establecerEstaEditando(true)}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors">
                      <Edit3 className="w-3 h-3" /> Editar antes de aprobar
                    </button>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{notaClinica}</div>
                  <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                    <button onClick={() => descargarDocumentoGenerado('pdf')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                      <Download className="w-4 h-4" /> Descargar PDF
                    </button>
                    <button onClick={() => descargarDocumentoGenerado('word')}
                      className="flex-1 flex items-center justify-center gap-2 bg-medico-50 text-medico-600 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-100 transition-colors">
                      <Download className="w-4 h-4" /> Descargar Word
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!transcripcion && !notaClinica && (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">La transcripcion y nota clinica apareceran aqui</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        estaAbierto={modalDiarizacionAbierto}
        alCerrar={() => establecerModalDiarizacionAbierto(false)}
        titulo="Separacion de Voces"
      >
        {infoDiarizacion && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-medico-50 text-medico-600">
                Motor: {infoDiarizacion.motor === 'deepgram' ? 'Deepgram Nova-3' : 'Pyannote 3.1'}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600">
                {infoDiarizacion.hablantes_detectados} hablantes
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                {infoDiarizacion.segmentos?.length || 0} segmentos
              </span>
            </div>

            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                {(infoDiarizacion.segmentos || []).filter((s: any) => s.texto).map((segmento: any, indice: number) => {
                  const coloresPorRol: Record<string, string> = {
                    MEDICO: 'bg-medico-500',
                    PACIENTE: 'bg-emerald-500',
                    TERCERO: 'bg-red-400',
                  }
                  const coloresPorSpeaker: Record<string, string> = {
                    SPEAKER_00: 'bg-medico-500',
                    SPEAKER_01: 'bg-emerald-500',
                    SPEAKER_02: 'bg-amber-500',
                    SPEAKER_03: 'bg-pink-500',
                  }

                  const tieneRolClinico = segmento.rol_clinico && segmento.rol_clinico !== ''
                  const etiqueta = tieneRolClinico ? segmento.rol_clinico : segmento.hablante
                  const color = tieneRolClinico
                    ? (coloresPorRol[segmento.rol_clinico] || 'bg-slate-400')
                    : (coloresPorSpeaker[segmento.hablante] || 'bg-slate-400')
                  const esTercero = segmento.es_principal === false || segmento.rol_clinico === 'TERCERO'

                  const etiquetasLegibles: Record<string, string> = {
                    MEDICO: 'Medico',
                    PACIENTE: 'Paciente',
                    TERCERO: 'Tercero',
                  }
                  const nombreMostrar = etiquetasLegibles[etiqueta] || etiqueta

                  return (
                    <div key={indice} className={`px-4 py-3 ${esTercero ? 'bg-red-50/50' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-xs font-semibold text-slate-700">{nombreMostrar}</span>
                        <span className="text-[10px] text-slate-300">
                          {segmento.inicio_segundos}s — {segmento.fin_segundos}s
                        </span>
                        {esTercero && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-500">DESCARTADO</span>
                        )}
                      </div>
                      <p className={`text-sm ${esTercero ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                        {segmento.texto}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
