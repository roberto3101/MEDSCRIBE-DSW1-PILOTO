import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const CANTIDAD_PARTICULAS = 120
const RADIO_INFLUENCIA = 2.5

function CampoDeParticulas() {
  const referenciaPuntos = useRef<THREE.Points>(null)
  const posicionDelCursor = useRef(new THREE.Vector2(0, 0))
  const { viewport } = useThree()

  const posicionesIniciales = useMemo(() => {
    const posiciones = new Float32Array(CANTIDAD_PARTICULAS * 3)
    const tamanos = new Float32Array(CANTIDAD_PARTICULAS)
    for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
      posiciones[i * 3] = (Math.random() - 0.5) * 8
      posiciones[i * 3 + 1] = (Math.random() - 0.5) * 8
      posiciones[i * 3 + 2] = (Math.random() - 0.5) * 3
      tamanos[i] = Math.random() * 3 + 1
    }
    return { posiciones, tamanos }
  }, [])

  const posicionesOriginales = useMemo(() => {
    return new Float32Array(posicionesIniciales.posiciones)
  }, [posicionesIniciales])

  useFrame(({ pointer, clock }) => {
    if (!referenciaPuntos.current) return

    posicionDelCursor.current.set(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2
    )

    const posiciones = referenciaPuntos.current.geometry.attributes.position.array as Float32Array
    const tiempo = clock.getElapsedTime()

    for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      const origenX = posicionesOriginales[ix]
      const origenY = posicionesOriginales[iy]

      const distanciaAlCursor = Math.sqrt(
        Math.pow(origenX - posicionDelCursor.current.x, 2) +
        Math.pow(origenY - posicionDelCursor.current.y, 2)
      )

      if (distanciaAlCursor < RADIO_INFLUENCIA) {
        const fuerza = (1 - distanciaAlCursor / RADIO_INFLUENCIA) * 0.8
        const anguloHaciaCursor = Math.atan2(
          posicionDelCursor.current.y - origenY,
          posicionDelCursor.current.x - origenX
        )
        posiciones[ix] += (origenX + Math.cos(anguloHaciaCursor) * fuerza - posiciones[ix]) * 0.08
        posiciones[iy] += (origenY + Math.sin(anguloHaciaCursor) * fuerza - posiciones[iy]) * 0.08
      } else {
        posiciones[ix] += (origenX - posiciones[ix]) * 0.03
        posiciones[iy] += (origenY - posiciones[iy]) * 0.03
      }

      posiciones[iy] += Math.sin(tiempo * 0.5 + i * 0.1) * 0.002
      posiciones[iz] = posicionesOriginales[iz] + Math.sin(tiempo * 0.3 + i * 0.05) * 0.3
    }

    referenciaPuntos.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={referenciaPuntos}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={CANTIDAD_PARTICULAS}
          array={posicionesIniciales.posiciones}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={CANTIDAD_PARTICULAS}
          array={posicionesIniciales.tamanos}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#bae6fd"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function LineasDeConexion() {
  const referenciaLineas = useRef<THREE.LineSegments>(null)
  const { viewport } = useThree()

  const geometria = useMemo(() => {
    const maxConexiones = CANTIDAD_PARTICULAS * 6
    const posiciones = new Float32Array(maxConexiones * 3)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3))
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  useFrame(({ scene, pointer }) => {
    if (!referenciaLineas.current) return

    const puntos = scene.children.find((c) => c instanceof THREE.Points) as THREE.Points | undefined
    if (!puntos) return

    const posicionesPuntos = puntos.geometry.attributes.position.array as Float32Array
    const posicionesLineas = geometria.attributes.position.array as Float32Array
    const cursorX = (pointer.x * viewport.width) / 2
    const cursorY = (pointer.y * viewport.height) / 2

    let indiceLinea = 0
    const distanciaMaxima = 1.8

    for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
      const x1 = posicionesPuntos[i * 3]
      const y1 = posicionesPuntos[i * 3 + 1]
      const z1 = posicionesPuntos[i * 3 + 2]

      const distCursor = Math.sqrt(Math.pow(x1 - cursorX, 2) + Math.pow(y1 - cursorY, 2))
      if (distCursor > 3) continue

      for (let j = i + 1; j < CANTIDAD_PARTICULAS; j++) {
        const x2 = posicionesPuntos[j * 3]
        const y2 = posicionesPuntos[j * 3 + 1]
        const z2 = posicionesPuntos[j * 3 + 2]

        const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2))

        if (dist < distanciaMaxima && indiceLinea < CANTIDAD_PARTICULAS * 6 - 2) {
          posicionesLineas[indiceLinea * 3] = x1
          posicionesLineas[indiceLinea * 3 + 1] = y1
          posicionesLineas[indiceLinea * 3 + 2] = z1
          indiceLinea++
          posicionesLineas[indiceLinea * 3] = x2
          posicionesLineas[indiceLinea * 3 + 1] = y2
          posicionesLineas[indiceLinea * 3 + 2] = z2
          indiceLinea++
        }
      }
    }

    geometria.setDrawRange(0, indiceLinea)
    geometria.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments ref={referenciaLineas} geometry={geometria}>
      <lineBasicMaterial color="#7dd3fc" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
    </lineSegments>
  )
}

export default function ParticulasSigueCursor() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      gl={{ alpha: true, antialias: true }}
    >
      <CampoDeParticulas />
      <LineasDeConexion />
    </Canvas>
  )
}
