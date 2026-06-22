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
      <InstancedAsteroids asteroids={asteroids} simActive={simActive} />
    </group>
  )
}

function InstancedAsteroids({ asteroids, simActive }) {
  const meshRef = useRef()
  const asteroidTex = useSafeTexture(REMOTE_TEXTURES.asteroid)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // Store dynamic state in a ref so we don't trigger re-renders
  const stateRef = useRef(asteroids.map(a => ({
    angle: a.angle,
    rotX: 0,
    rotY: 0
  })))

  useFrame((_, delta) => {
    if (!meshRef.current) return
    
    asteroids.forEach((data, i) => {
      const state = stateRef.current[i]
      state.rotX += delta * data.rotSpeed
      state.rotY += delta * data.rotSpeed * 0.7
      
      if (simActive) {
        state.angle += delta * data.orbitSpeed
      }
      
      dummy.position.set(
        Math.cos(state.angle) * data.radius,
        data.position[1],
        Math.sin(state.angle) * data.radius
      )
      dummy.rotation.set(state.rotX, state.rotY, 0)
      dummy.scale.setScalar(data.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, asteroids.length]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial map={asteroidTex} color="#8a7a6a" roughness={0.95} metalness={0.03} />
    </instancedMesh>
  )
}

export { AsteroidBelt }
