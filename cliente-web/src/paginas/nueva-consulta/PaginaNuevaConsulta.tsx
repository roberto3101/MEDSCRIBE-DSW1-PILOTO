import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Send, FileText, CheckCircle, RotateCcw, Users, Eye, Download, Edit3, Save, Search, Clock, User, UserPlus, AlertCircle } from 'lucide-react'
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
  const [motorDiarizacion, establecerMotorDiarizacion] = useState('deepgram')
  const [modalDiarizacionAbierto, establecerModalDiarizacionAbierto] = useState(false)

  const [textoBusqueda, establecerTextoBusqueda] = useState(estadoPersistido?.textoBusqueda || estadoPersistido?.dniBusqueda || '')
  const [pacienteEncontrado, establecerPacienteEncontrado] = useState<any>(estadoPersistido?.pacienteEncontrado || null)
  const [buscandoPaciente, establecerBuscandoPaciente] = useState(false)
  const [historialDelPaciente, establecerHistorialDelPaciente] = useState<any[]>([])
  const [mostrarHistorial, establecerMostrarHistorial] = useState(false)
  const [infoDiarizacion, establecerInfoDiarizacion] = useState<any>(estadoPersistido?.infoDiarizacion || null)
  const [listaPacientes, establecerListaPacientes] = useState<any[]>([])
  const [cargandoLista, establecerCargandoLista] = useState(false)
  const [mostrarSugerencias, establecerMostrarSugerencias] = useState(false)
  const [listaCargada, establecerListaCargada] = useState(false)

  const persistirEstado = useCallback(() => {
    const estado = {
      estadoDelFlujo, tipoDocumento, especialidad, transcripcion, notaClinica,
      textoBusqueda, pacienteEncontrado, infoDiarizacion,
    }
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(estado))
  }, [estadoDelFlujo, tipoDocumento, especialidad, transcripcion, notaClinica, textoBusqueda, pacienteEncontrado, infoDiarizacion])

  useEffect(() => {
    if (transcripcion || notaClinica) persistirEstado()
  }, [transcripcion, notaClinica, estadoDelFlujo, persistirEstado])

  const referenciaMediaRecorder = useRef<MediaRecorder | null>(null)
  const referenciaTrozosDeAudio = useRef<Blob[]>([])
  const referenciaIntervalo = useRef<number | null>(null)
  const referenciaFlujoDeAudio = useRef<MediaStream | null>(null)
  const referenciaSeccionPaciente = useRef<HTMLDivElement | null>(null)
  const referenciaInputDni = useRef<HTMLInputElement | null>(null)
  const [resaltarSeccionPaciente, establecerResaltarSeccionPaciente] = useState(false)

  const cargarListaPacientesUnaVez = useCallback(async () => {
    if (listaCargada || cargandoLista) return
    establecerCargandoLista(true)
    try {
      const respuesta = await fetch('/api/pacientes')
      if (respuesta.ok) {
        const datos = await respuesta.json()
        establecerListaPacientes(Array.isArray(datos) ? datos : [])
        establecerListaCargada(true)
      }
    } catch { /* silenciar */ }
    finally { establecerCargandoLista(false) }
  }, [listaCargada, cargandoLista])

  const cargarHistorialDelPaciente = async (idPaciente: number) => {
    try {
      const respHistorial = await fetch(`/api/consultas/medico/${1}`)
      if (respHistorial.ok) {
        const consultas = await respHistorial.json()
        const consultasDelPaciente = consultas.filter((c: any) => c.idPacienteAtendido === idPaciente)
        establecerHistorialDelPaciente(consultasDelPaciente)
      }
    } catch { /* silenciar */ }
  }

  const normalizarTexto = (texto: string) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  const textoBusquedaNormalizado = normalizarTexto(textoBusqueda)
  const esBusquedaNumerica = /^\d+$/.test(textoBusqueda.trim())

  const sugerencias = (!pacienteEncontrado && textoBusquedaNormalizado.length >= 2)
    ? listaPacientes
        .filter((p: any) => {
          const nombreCompleto = normalizarTexto(`${p.nombreDelPaciente || ''} ${p.apellidoDelPaciente || ''}`)
          const documento = (p.numeroDocumentoIdentidad || '').toLowerCase()
          return nombreCompleto.includes(textoBusquedaNormalizado) || documento.includes(textoBusquedaNormalizado)
        })
        .slice(0, 8)
    : []

  const seleccionarPaciente = async (paciente: any) => {
    establecerPacienteEncontrado(paciente)
    establecerTextoBusqueda(`${paciente.nombreDelPaciente} ${paciente.apellidoDelPaciente}`.trim())
    establecerMostrarSugerencias(false)
    establecerHistorialDelPaciente([])
    await cargarHistorialDelPaciente(paciente.idPaciente)
  }

  const buscarPaciente = async () => {
    const consulta = textoBusqueda.trim()
    if (consulta.length < 2) return
    establecerBuscandoPaciente(true)
    establecerPacienteEncontrado(null)
    establecerHistorialDelPaciente([])
    try {
      if (esBusquedaNumerica && consulta.length >= 8) {
        const respuesta = await fetch(`/api/pacientes/documento/${consulta}`)
        if (respuesta.ok) {
          const paciente = await respuesta.json()
          await seleccionarPaciente(paciente)
          return
        }
      }
      await cargarListaPacientesUnaVez()
      if (sugerencias.length === 1) {
        await seleccionarPaciente(sugerencias[0])
      } else {
        establecerMostrarSugerencias(true)
      }
    } catch { /* silenciar */ }
    finally { establecerBuscandoPaciente(false) }
  }

  const manejarCambioBusqueda = (valor: string) => {
    if (valor.length > 100) return
    establecerTextoBusqueda(valor)
    establecerMostrarSugerencias(true)
    if (pacienteEncontrado) {
      establecerPacienteEncontrado(null)
      establecerHistorialDelPaciente([])
    }
    if (valor.trim().length >= 2) cargarListaPacientesUnaVez()
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

  const solicitarSeleccionDePaciente = () => {
    establecerResaltarSeccionPaciente(true)
    referenciaSeccionPaciente.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => referenciaInputDni.current?.focus(), 350)
    setTimeout(() => establecerResaltarSeccionPaciente(false), 2400)
  }

  const iniciarGrabacion = async () => {
    if (!pacienteEncontrado) {
      solicitarSeleccionDePaciente()
      return
    }
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
    establecerTextoBusqueda('')
    establecerPacienteEncontrado(null)
    establecerHistorialDelPaciente([])
    establecerMostrarSugerencias(false)
    establecerEstaEditando(false)
    sessionStorage.removeItem(CLAVE_SESION)
  }

  const inyectarDatosDelPacienteEnNota = (nota: string, paciente: any): string => {
    if (!paciente || !nota) return nota

    const calcularEdad = (fechaNac?: string) => {
      if (!fechaNac) return ''
      const soloFecha = fechaNac.split('T')[0]
      const nacimiento = new Date(soloFecha)
      if (isNaN(nacimiento.getTime())) return ''
      const hoy = new Date()
      let edad = hoy.getFullYear() - nacimiento.getFullYear()
      const m = hoy.getMonth() - nacimiento.getMonth()
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
      return edad >= 0 && edad < 130 ? `${edad} anos` : ''
    }

    const formatearFecha = (fecha?: string) => {
      if (!fecha) return ''
      const partes = fecha.split('T')[0].split('-')
      return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha
    }

    const nombreCompleto = `${paciente.nombreDelPaciente || ''} ${paciente.apellidoDelPaciente || ''}`.trim()
    const edad = calcularEdad(paciente.fechaDeNacimiento)
    const lineas: string[] = []
    if (nombreCompleto) lineas.push(`- Nombre: ${nombreCompleto}`)
    if (paciente.numeroDocumentoIdentidad) lineas.push(`- Documento: ${paciente.tipoDocumentoIdentidad || 'DNI'} ${paciente.numeroDocumentoIdentidad}`)
    if (paciente.sexoBiologico) lineas.push(`- Sexo: ${paciente.sexoBiologico}`)
    if (paciente.fechaDeNacimiento) lineas.push(`- Fecha de nacimiento: ${formatearFecha(paciente.fechaDeNacimiento)}${edad ? ` (${edad})` : ''}`)
    if (paciente.telefonoDeContacto) lineas.push(`- Telefono: ${paciente.telefonoDeContacto}`)
    if (paciente.correoElectronico) lineas.push(`- Correo: ${paciente.correoElectronico}`)
    if (paciente.direccionDomiciliaria) lineas.push(`- Direccion: ${paciente.direccionDomiciliaria}`)

    if (lineas.length === 0) return nota

    const bloqueDatos = lineas.join('\n')
    const regexTitulo = /^(#{1,3}\s+|\*\*\s*)?datos\s+del\s+paciente\s*(\*\*)?\s*$/i

    const lineasNota = nota.split('\n')
    const indicesEncabezado: number[] = []
    lineasNota.forEach((linea, i) => {
      const limpio = linea.trim().replace(/\*/g, '').replace(/^#+\s*/, '').trim()
      if (/^#{1,3}\s+/.test(linea.trim()) || /^\*\*.+\*\*$/.test(linea.trim())) {
        indicesEncabezado.push(i)
        if (regexTitulo.test(linea.trim()) || /^datos\s+del\s+paciente/i.test(limpio)) {
          (indicesEncabezado as any).__datos = i
        }
      }
    })

    const idxDatos = (indicesEncabezado as any).__datos as number | undefined
    if (idxDatos !== undefined) {
      const siguiente = indicesEncabezado.find(i => i > idxDatos) ?? lineasNota.length
      const nuevas = [
        ...lineasNota.slice(0, idxDatos + 1),
        bloqueDatos,
        '',
        ...lineasNota.slice(siguiente),
      ]
      return nuevas.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    }

    const seccionNueva = `## Datos del Paciente\n${bloqueDatos}\n\n`
    const primerEncabezado = indicesEncabezado[0]
    if (primerEncabezado === undefined) return `${seccionNueva}${nota}`
    const antes = lineasNota.slice(0, primerEncabezado).join('\n')
    const despues = lineasNota.slice(primerEncabezado).join('\n')
    return `${antes ? antes + '\n' : ''}${seccionNueva}${despues}`.replace(/\n{3,}/g, '\n\n').trim()
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

      const claveIdempotencia = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const respuestaEncolado = await fetch('http://localhost:8000/api/ia/procesar-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': claveIdempotencia,
        },
        body: JSON.stringify({
          transcripcion: datosTranscripcion.transcripcion,
          especialidad,
          tipo_documento: tipoDocumento,
        }),
      })

      if (!respuestaEncolado.ok) {
        throw new Error(`Error ${respuestaEncolado.status} al encolar trabajo`)
      }

      const datosEncolado = await respuestaEncolado.json()
      const jobId = datosEncolado.job_id
      if (!jobId) {
        throw new Error('El servidor no devolvio un job_id valido')
      }

      if (datosEncolado.reutilizado_por_idempotencia && datosEncolado.resultado) {
        const datosProcesamiento = datosEncolado.resultado
        const notaEnriquecida = inyectarDatosDelPacienteEnNota(datosProcesamiento.nota_clinica, pacienteEncontrado)
        establecerNotaClinica(notaEnriquecida)
        await fetch('http://localhost:8000/api/ia/generar-y-guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nota_clinica: notaEnriquecida, tipo_documento: tipoDocumento }),
        })
        establecerEstadoDelFlujo('completado')
        return
      }

      const intervaloPollingMs = 1500
      const tiempoMaximoEsperaMs = 240000
      const inicioEsperaMs = Date.now()
      let datosProcesamiento: any = null
      while (Date.now() - inicioEsperaMs < tiempoMaximoEsperaMs) {
        await new Promise((resolve) => setTimeout(resolve, intervaloPollingMs))
        const respuestaEstado = await fetch(`http://localhost:8000/api/ia/procesar-async/${jobId}`)
        if (!respuestaEstado.ok) {
          throw new Error(`Error ${respuestaEstado.status} consultando estado del trabajo`)
        }
        const registro = await respuestaEstado.json()
        if (registro.estado === 'completado') {
          datosProcesamiento = registro.resultado
          break
        }
        if (registro.estado === 'fallido') {
          const detalle = registro?.error?.detalle || 'El trabajo fallo en el pipeline'
          throw new Error(detalle)
        }
      }

      if (!datosProcesamiento) {
        throw new Error('El trabajo excedio el tiempo maximo de espera')
      }
      const notaEnriquecida = inyectarDatosDelPacienteEnNota(datosProcesamiento.nota_clinica, pacienteEncontrado)
      establecerNotaClinica(notaEnriquecida)

      await fetch('http://localhost:8000/api/ia/generar-y-guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nota_clinica: notaEnriquecida,
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
            notaClinica: notaEnriquecida,
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
      const cuerpoPeticion: Record<string, unknown> = {
        nota_clinica: notaClinica,
        tipo_documento: tipoDocumento,
        especialidad: especialidad || '',
      }
      if (pacienteEncontrado) {
        cuerpoPeticion.paciente = {
          nombre_completo: `${pacienteEncontrado.nombreDelPaciente ?? ''} ${pacienteEncontrado.apellidoDelPaciente ?? ''}`.trim(),
          tipo_documento: pacienteEncontrado.tipoDocumentoIdentidad ?? '',
          numero_documento: pacienteEncontrado.numeroDocumentoIdentidad ?? '',
          sexo: pacienteEncontrado.sexoBiologico ?? '',
          fecha_nacimiento: pacienteEncontrado.fechaDeNacimiento ?? '',
          telefono: pacienteEncontrado.telefonoDeContacto ?? '',
          correo: pacienteEncontrado.correoElectronico ?? '',
          direccion: pacienteEncontrado.direccionDomiciliaria ?? '',
        }
      }
      const respuesta = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpoPeticion),
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

      <div
        ref={referenciaSeccionPaciente}
        className={`bg-white rounded-xl border p-5 mb-6 transition-all duration-500 ${
          resaltarSeccionPaciente
            ? 'border-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.18)] ring-2 ring-amber-200'
            : !pacienteEncontrado
              ? 'border-amber-200/70 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]'
              : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-medico-500" />
            Paciente
            {!pacienteEncontrado && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Requerido
              </span>
            )}
          </h3>
          {pacienteEncontrado && (
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle className="w-3 h-3" /> Seleccionado
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              ref={referenciaInputDni}
              type="text" value={textoBusqueda}
              onChange={(e) => manejarCambioBusqueda(e.target.value)}
              onFocus={() => { cargarListaPacientesUnaVez(); if (textoBusqueda.trim().length >= 2 && !pacienteEncontrado) establecerMostrarSugerencias(true) }}
              onBlur={() => setTimeout(() => establecerMostrarSugerencias(false), 180)}
              onKeyDown={(e) => e.key === 'Enter' && buscarPaciente()}
              placeholder="Busca por DNI o nombre del paciente"
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />

            {mostrarSugerencias && !pacienteEncontrado && textoBusqueda.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                {cargandoLista && sugerencias.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400">Cargando pacientes...</div>
                ) : sugerencias.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400">
                    Sin coincidencias. {esBusquedaNumerica && textoBusqueda.trim().length >= 8 ? 'Presiona Buscar para buscar por DNI exacto.' : 'Refina la busqueda.'}
                  </div>
                ) : (
                  sugerencias.map((p: any) => (
                    <button key={p.idPaciente} type="button"
                      onMouseDown={(e) => { e.preventDefault(); seleccionarPaciente(p) }}
                      className="w-full text-left px-4 py-2.5 hover:bg-medico-50 border-b border-slate-100 last:border-b-0 transition-colors">
                      <p className="text-sm font-medium text-slate-800">
                        {p.nombreDelPaciente} {p.apellidoDelPaciente}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{p.tipoDocumentoIdentidad}: {p.numeroDocumentoIdentidad}</span>
                        {p.sexoBiologico && <span>{p.sexoBiologico}</span>}
                        {p.fechaDeNacimiento && <span>{p.fechaDeNacimiento.split('T')[0]}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button onClick={buscarPaciente} disabled={textoBusqueda.trim().length < 2 || buscandoPaciente}
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

        {textoBusqueda.trim().length >= 2 && !pacienteEncontrado && !buscandoPaciente && !mostrarSugerencias && sugerencias.length === 0 && listaCargada && (
          <p className="mt-2 text-xs text-amber-600">Sin coincidencias. Registra al paciente en la seccion de Pacientes antes de continuar.</p>
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
              <div className="mb-4 px-3 py-2 rounded-lg border bg-medico-50 border-medico-300 text-xs font-medium text-medico-700">
                Motor: Deepgram (cloud, preciso)
              </div>
            )}

            {!pacienteEncontrado && estadoDelFlujo === 'esperando' && (
              <button
                type="button"
                onClick={solicitarSeleccionDePaciente}
                className="w-full mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-50/60 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">Selecciona un paciente para continuar</p>
                  <p className="text-xs text-amber-600/80 mt-0.5">La grabacion se habilitara cuando vincules al paciente de esta consulta.</p>
                </div>
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              </button>
            )}

            <div className="flex flex-col items-center py-8">
              <div className="relative">
                {estadoDelFlujo === 'grabando' && (
                  <div className="absolute inset-0 -m-2 rounded-full border-4 border-red-300 animate-ping" />
                )}
                {!pacienteEncontrado && estadoDelFlujo === 'esperando' && (
                  <div className="absolute inset-0 -m-2 rounded-full border-2 border-dashed border-amber-300/70 pointer-events-none" />
                )}
                <button
                  onClick={estadoDelFlujo === 'grabando' ? detenerGrabacion : iniciarGrabacion}
                  disabled={estaEnProcesoDeIA || estadoDelFlujo === 'detenido'}
                  title={!pacienteEncontrado && estadoDelFlujo === 'esperando' ? 'Selecciona un paciente para habilitar la grabacion' : undefined}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    estadoDelFlujo === 'grabando'
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-200 scale-110'
                      : !pacienteEncontrado && estadoDelFlujo === 'esperando'
                        ? 'bg-gradient-to-br from-slate-300 to-slate-400 hover:from-amber-400 hover:to-amber-500 cursor-help shadow-slate-200'
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
                !pacienteEncontrado && estadoDelFlujo === 'esperando' ? 'text-amber-600' :
                'text-slate-400'
              }`}>
                {!pacienteEncontrado && estadoDelFlujo === 'esperando'
                  ? 'Selecciona un paciente antes de grabar'
                  : etiquetasPorEstado[estadoDelFlujo]}
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
