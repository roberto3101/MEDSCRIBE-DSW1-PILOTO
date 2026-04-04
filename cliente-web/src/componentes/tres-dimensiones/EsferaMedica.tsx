import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function EsferaAnimada() {
  const referenciaEsfera = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (referenciaEsfera.current) {
      referenciaEsfera.current.rotation.y = clock.getElapsedTime() * 0.3
      referenciaEsfera.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    }
  })

  return (
    <Sphere ref={referenciaEsfera} args={[1, 64, 64]} scale={2.2}>
      <MeshDistortMaterial
        color="#0ea5e9"
        attach="material"
        distort={0.3}
        speed={1.5}
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0.85}
      />
    </Sphere>
  )
}

export default function EsferaMedica() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#e0f2fe" />
      <pointLight position={[-3, -3, 2]} intensity={0.4} color="#06b6d4" />
      <EsferaAnimada />
    </Canvas>
  )
}
