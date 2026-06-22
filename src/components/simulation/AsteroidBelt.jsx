import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ASTEROID_BELT_INNER_KM, ASTEROID_BELT_OUTER_KM } from '../../data/solarSystemData'
import { REMOTE_TEXTURES, useSafeTexture } from '../../utils/textures'

function AsteroidBelt({ innerKm = ASTEROID_BELT_INNER_KM, outerKm = ASTEROID_BELT_OUTER_KM, simActive = true }) {
  const inner = innerKm / 1e6
  const outer = outerKm / 1e6
  const groupRef = useRef()

  const { dust, asteroids } = useMemo(() => {
    // Real life asteroid belt is extremely sparse. We'll render far fewer particles to reflect this.
    const dustCount = 800
    const dustPositions = new Float32Array(dustCount * 3)
    const dustColors = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = inner + Math.random() * (outer - inner)
      // Increase vertical scatter for a more diffuse, less dense look
      const y = (Math.random() - 0.5) * 6.0
      dustPositions[i * 3] = Math.cos(angle) * r
      dustPositions[i * 3 + 1] = y
      dustPositions[i * 3 + 2] = Math.sin(angle) * r
      const gray = 0.2 + Math.random() * 0.2
      dustColors[i * 3] = gray
      dustColors[i * 3 + 1] = gray * 0.95
      dustColors[i * 3 + 2] = gray * 0.9
    }

    const asteroidCount = 45 // Significantly fewer large rocks
    const asteroidData = Array.from({ length: asteroidCount }, () => {
      const angle = Math.random() * Math.PI * 2
      const r = inner + Math.random() * (outer - inner)
      const y = (Math.random() - 0.5) * 4.0 // Vertical spacing
      return {
        position: [Math.cos(angle) * r, y, Math.sin(angle) * r],
        scale: 0.005 + Math.random() * 0.015, // Slightly smaller rocks
        rotSpeed: (Math.random() - 0.5) * 0.4,
        orbitSpeed: 0.003 + Math.random() * 0.008,
        angle,
        radius: r,
      }
    })

    return { dust: { positions: dustPositions, colors: dustColors }, asteroids: asteroidData }
  }, [inner, outer])

  useFrame(({ clock }, delta) => {
    if (!simActive || !groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * 0.015
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dust.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.12} vertexColors transparent opacity={0.7} sizeAttenuation depthWrite={false} />
      </points>
      {asteroids.map((a, i) => (
        <AsteroidRock key={i} data={a} simActive={simActive} />
      ))}
    </group>
  )
}

function AsteroidRock({ data, simActive }) {
  const ref = useRef()
  const angleRef = useRef(data.angle)
  const asteroidTex = useSafeTexture(REMOTE_TEXTURES.asteroid)

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * data.rotSpeed
    ref.current.rotation.y += delta * data.rotSpeed * 0.7
    if (simActive) {
      angleRef.current += delta * data.orbitSpeed
      ref.current.position.set(
        Math.cos(angleRef.current) * data.radius,
        data.position[1],
        Math.sin(angleRef.current) * data.radius,
      )
    }
  })

  return (
    <mesh ref={ref} position={data.position} scale={data.scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial map={asteroidTex} color="#8a7a6a" roughness={0.95} metalness={0.03} />
    </mesh>
  )
}

export { AsteroidBelt }
