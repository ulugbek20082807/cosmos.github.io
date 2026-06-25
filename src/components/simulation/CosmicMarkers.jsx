import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { raDecToVector } from './Starfield'
import { TEXTURES } from '../../data/solarSystemData'
import { useSafeTexture, REMOTE_TEXTURES, getParticleTexture } from '../../utils/textures'
import { HoverRing, ObjectLabel } from './ObjectInteraction'
import { StarGlowMaterial } from './StarGlowMaterial'

const DISPLAY_BASE = 2000
const DISPLAY_FACTOR = 5000

export function getCosmicDisplayPosition(obj) {
  // Pure Linear Scale: 10,000 units = 1 Light Year
  return raDecToVector(obj.ra, obj.dec, obj.distanceLy * 10000).toArray()
}

export function getCosmicVisualRadius(obj) {
  // Shrink physical point sizes so they don't swallow the solar system.
  // Because sizeAttenuation={false}, they will always be visible regardless of distance.
  if (obj.type?.startsWith('galaxy') || obj.type === 'cluster') return 1500
  if (obj.type === 'nebula') return 800
  if (obj.type === 'black_hole') return 400
  if (obj.type === 'exoplanet') return 50
  if (obj.type === 'star') return 100
  if (obj.type === 'wiki_object') return 200
  return 50
}

export function CosmicMarkers({ objects, onSelect }) {
  return (
    <group>
      {objects.map((obj) => (
        <CosmicDot
          key={obj.id}
          obj={obj}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

function StarMesh({ size, color }) {
  const ref = useRef()
  const starTex = useSafeTexture(TEXTURES.star)

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08
  })

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 32, 24]} />
        <meshBasicMaterial
          map={starTex}
          color="#ffffff"
        />
      </mesh>
      {/* Smooth dithered star glow */}
      <mesh>
        <sphereGeometry args={[size * 4.0, 32, 24]} />
        <StarGlowMaterial color={color || '#fff4a8'} opacity={0.6} />
      </mesh>
    </group>
  )
}

function ProceduralGalaxyVisual({ size, color, obj }) {
  const groupRef = useRef()
  const matRef = useRef()
  const c = color || '#a78bfa'
  const type = obj.type || 'galaxy_spiral'
  const particleTex = getParticleTexture()

  useFrame(({ camera }, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.015
    if (matRef.current && groupRef.current) {
      // Dynamic camera protection: fade out dust if camera enters galaxy
      const dist = camera.position.distanceTo(groupRef.current.position)
      const fadeDist = size * 2.0
      let fade = 1.0
      if (dist < fadeDist) {
        fade = Math.pow(Math.max(0, dist / fadeDist), 3.0)
      }
      matRef.current.opacity = 0.75 * fade
    }
  })

  const { positions, colors, sizes } = useMemo(() => {
    const count = type === 'galaxy_elliptical' ? 12000 : 8000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    
    const baseCol = new THREE.Color(c)
    const warmCol = new THREE.Color('#ffe8c0')
    const blueCol = new THREE.Color('#8888ff')

    for (let i = 0; i < count; i++) {
      const t = Math.random()
      let r, x, y, z;

      if (type === 'galaxy_spiral' || type === 'galaxy_lenticular') {
        r = size * Math.pow(t, 1.5)
        const armIndex = i % (type === 'galaxy_spiral' ? 2 : 1)
        const armOffset = (armIndex * Math.PI)
        const spiralAngle = armOffset + (r / size) * 8
        const spread = type === 'galaxy_lenticular' ? r * 0.1 : (0.1 + t * 0.3) * r * 0.5
        const offsetAngle = spiralAngle + (Math.random() - 0.5) * spread / (r + 1)
        y = (Math.random() - 0.5) * size * 0.1 * (1 + (size / (r + 1)))
        x = Math.cos(offsetAngle) * r
        z = Math.sin(offsetAngle) * r
      } else if (type === 'galaxy_elliptical') {
        r = size * Math.pow(t, 2.0)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        x = r * Math.sin(phi) * Math.cos(theta)
        y = r * Math.sin(phi) * Math.sin(theta) * 0.6 // Oblate shape
        z = r * Math.cos(phi)
      } else { // galaxy_irregular
        x = (Math.random() - 0.5) * size * 2
        y = (Math.random() - 0.5) * size * 1.5
        z = (Math.random() - 0.5) * size * 2
        r = Math.sqrt(x*x + y*y + z*z)
      }

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      const radialFade = Math.max(0, 1 - r / (size * 1.2))
      const mixColor = type === 'galaxy_elliptical' ? warmCol : new THREE.Color().lerpColors(blueCol, warmCol, radialFade)
      mixColor.lerp(baseCol, 0.4)

      // Smooth steep edge falloff
      const fade = Math.pow(radialFade, 3.0)
      col[i * 3] = mixColor.r * fade
      col[i * 3 + 1] = mixColor.g * fade
      col[i * 3 + 2] = mixColor.b * fade

      sz[i] = (0.5 + Math.random() * 0.5) * (fade * 0.6 + 0.4)
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [size, c, type])

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[size * 0.15, 16, 16]} />
        <meshBasicMaterial color={c} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={3}
          vertexColors
          transparent
          opacity={0.75}
          sizeAttenuation={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          map={particleTex}
        />
      </points>
    </group>
  )
}

/* ─── Nebula: volumetric gas clouds with embedded stars ─────────────────── */
function NebulaVisual({ size, color }) {
  const groupRef = useRef()
  const c = color || '#818cf8'

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.008
  })

  // Multiple gas cloud layers with different densities
  const gasLayers = useMemo(() => {
    const layers = []
    const layerConfigs = [
      { count: 2500, radiusMult: 1.5, opacity: 0.35, sizeMult: 0.18, flatten: 0.7, colorShift: 0 },
      { count: 1500, radiusMult: 1.0, opacity: 0.5, sizeMult: 0.12, flatten: 0.5, colorShift: 0.2 },
      { count: 800, radiusMult: 0.6, opacity: 0.7, sizeMult: 0.08, flatten: 0.4, colorShift: 0.4 },
    ]

    for (const config of layerConfigs) {
      const positions = new Float32Array(config.count * 3)
      const colors = new Float32Array(config.count * 3)
      const col = new THREE.Color(c)
      const shiftedCol = new THREE.Color(c).offsetHSL(config.colorShift * 0.15, 0, 0.1)

      for (let i = 0; i < config.count; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        // Irregular cloud shape using multiple noise-like layers
        const r0 = size * config.radiusMult
        const noiseR = r0 * (0.3 + Math.pow(Math.random(), 1.2) * 0.7)
        // Add filament structure
        const filament = 1 + 0.5 * Math.sin(theta * 3) * Math.sin(phi * 2)
        const r = noiseR * filament

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * config.flatten
        positions[i * 3 + 2] = r * Math.cos(phi)

        const fade = Math.random() * 0.6 + 0.2
        const mixCol = new THREE.Color().lerpColors(col, shiftedCol, Math.random())
        colors[i * 3] = mixCol.r * fade
        colors[i * 3 + 1] = mixCol.g * fade
        colors[i * 3 + 2] = mixCol.b * fade
      }
      layers.push({ positions, colors, ...config })
    }
    return layers
  }, [size, c])

  // Embedded young stars
  const embeddedStars = useMemo(() => {
    const count = 40
    const positions = []
    for (let i = 0; i < count; i++) {
      const r = size * 0.3 + Math.random() * size * 0.8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.6,
        r * Math.cos(phi),
      ])
    }
    return positions
  }, [size])

  // Dust pillars (elongated structures)
  const dustPillars = useMemo(() => {
    const count = 600
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const darkCol = new THREE.Color(c).multiplyScalar(0.15)

    for (let i = 0; i < count; i++) {
      const pillarX = (Math.random() - 0.5) * size * 1.5
      const pillarZ = (Math.random() - 0.5) * size * 1.5
      const pillarY = (Math.random() - 0.5) * size * 1.8

      positions[i * 3] = pillarX + (Math.random() - 0.5) * size * 0.1
      positions[i * 3 + 1] = pillarY
      positions[i * 3 + 2] = pillarZ + (Math.random() - 0.5) * size * 0.1

      colors[i * 3] = darkCol.r
      colors[i * 3 + 1] = darkCol.g
      colors[i * 3 + 2] = darkCol.b
    }
    return { positions, colors }
  }, [size, c])

  return (
    <group ref={groupRef}>
      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[size * 0.2, 24, 16]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Gas cloud layers */}
      {gasLayers.map((layer, i) => (
        <points key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layer.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[layer.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={size * layer.sizeMult}
            vertexColors
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}

      {/* Dark dust pillars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPillars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustPillars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={size * 0.15}
          vertexColors
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </points>

      {/* Embedded bright young stars */}
      {embeddedStars.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[size * 0.02, 8, 6]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Outer glow shell */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 24, 16]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

/* ─── Black Hole: event horizon + relativistic accretion disk + jets ───── */
function BlackHoleVisual({ size, color }) {
  const groupRef = useRef()
  const diskRef = useRef()
  const jetRef = useRef()
  const c = color || '#f97316'

  useFrame(({ clock }, delta) => {
    if (diskRef.current) diskRef.current.rotation.y += delta * 0.6
    if (jetRef.current) {
      const pulse = 1 + 0.1 * Math.sin(clock.elapsedTime * 3)
      jetRef.current.scale.y = pulse
    }
    if (groupRef.current) {
      // Subtle wobble
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.05
    }
  })

  // Multi-layered accretion disk with Doppler-shifted colors
  const accretionDisk = useMemo(() => {
    const count = 4000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const hotCol = new THREE.Color(c)
    const whiteHot = new THREE.Color('#ffffff')
    const coolCol = new THREE.Color('#3322aa')
    const blueShift = new THREE.Color('#4488ff')

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      // Disk extends from just outside event horizon to several radii
      const innerEdge = size * 0.55
      const outerEdge = size * 2.5
      const t = Math.pow(Math.random(), 0.7) // Denser near inner edge
      const r = innerEdge + t * (outerEdge - innerEdge)

      // Slight turbulence in the disk
      const turbulence = Math.sin(angle * 5 + r * 2) * 0.02 * r
      const y = (Math.random() - 0.5) * 0.08 * r * (innerEdge / r) + turbulence * 0.3

      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * r

      // Temperature gradient: white-hot near center, cooler outward
      // Plus Doppler effect: blueshift on approaching side, redshift on receding
      const heat = Math.max(0, 1 - t)
      const doppler = Math.cos(angle) * 0.3 // Approaching vs receding

      const baseColor = new THREE.Color().lerpColors(coolCol, hotCol, heat)
      if (heat > 0.7) baseColor.lerp(whiteHot, (heat - 0.7) * 3)
      if (doppler > 0) baseColor.lerp(blueShift, doppler * heat)

      const brightness = 0.3 + heat * 0.7
      colors[i * 3] = baseColor.r * brightness
      colors[i * 3 + 1] = baseColor.g * brightness
      colors[i * 3 + 2] = baseColor.b * brightness
    }
    return { positions, colors }
  }, [size, c])

  // Gravitational lensing ring (photon sphere)
  const photonRing = useMemo(() => {
    const count = 500
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const ringCol = new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.5)

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.02
      const r = size * 0.72 + (Math.random() - 0.5) * size * 0.04

      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.01 * r
      positions[i * 3 + 2] = Math.sin(angle) * r

      const brightness = 0.6 + Math.random() * 0.4
      colors[i * 3] = ringCol.r * brightness
      colors[i * 3 + 1] = ringCol.g * brightness
      colors[i * 3 + 2] = ringCol.b * brightness
    }
    return { positions, colors }
  }, [size, c])

  // Relativistic jets (bipolar)
  const jets = useMemo(() => {
    const count = 600
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const jetCol = new THREE.Color('#6688ff')

    for (let i = 0; i < count; i++) {
      const direction = i < count / 2 ? 1 : -1
      const t = Math.pow(Math.random(), 0.5) // More particles near base
      const height = direction * (size * 0.5 + t * size * 4)
      const spread = size * 0.05 + t * size * 0.4

      const angle = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * spread * Math.random()
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * spread * Math.random()

      const fade = 0.3 + (1 - t) * 0.7
      colors[i * 3] = jetCol.r * fade
      colors[i * 3 + 1] = jetCol.g * fade
      colors[i * 3 + 2] = jetCol.b * fade
    }
    return { positions, colors }
  }, [size])

  // Infalling matter streams
  const infallingStreams = useMemo(() => {
    const count = 300
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const streamCol = new THREE.Color(c).lerp(new THREE.Color('#ff4400'), 0.3)

    for (let i = 0; i < count; i++) {
      const streamAngle = (Math.floor(i / 60)) * Math.PI * 2 / 5 // 5 streams
      const t = (i % 60) / 60
      const spiralR = size * 3 * (1 - t * 0.8) + size * 0.6
      const spiralAngle = streamAngle + t * Math.PI * 2
      const y = (Math.random() - 0.5) * size * 0.1 * (1 - t)

      positions[i * 3] = Math.cos(spiralAngle) * spiralR
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(spiralAngle) * spiralR

      const brightness = 0.1 + t * 0.6
      colors[i * 3] = streamCol.r * brightness
      colors[i * 3 + 1] = streamCol.g * brightness
      colors[i * 3 + 2] = streamCol.b * brightness
    }
    return { positions, colors }
  }, [size, c])

  return (
    <group ref={groupRef}>
      {/* Event Horizon - pure black sphere */}
      <mesh>
        <sphereGeometry args={[size * 0.5, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Shadow / silhouette slightly larger than event horizon */}
      <mesh>
        <sphereGeometry args={[size * 0.52, 48, 48]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Photon sphere ring */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[photonRing.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[photonRing.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Accretion Disk */}
      <group ref={diskRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[accretionDisk.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[accretionDisk.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={2}
            vertexColors
            transparent
            opacity={0.85}
            sizeAttenuation={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Infalling streams */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[infallingStreams.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[infallingStreams.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={size * 0.035}
            vertexColors
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      {/* Relativistic Jets */}
      <group ref={jetRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[jets.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[jets.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={2}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      {/* Inner accretion glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.55, size * 0.75, 96]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer gravitational lensing effect ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.52, size * 2.8, 96]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gravitational lensing halo behind the black hole */}
      <mesh>
        <sphereGeometry args={[size * 0.65, 32, 32]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

/* ─── Star Cluster: realistic globular/open cluster ────────────────────── */
function ClusterVisual({ size, color }) {
  const groupRef = useRef()
  const c = color || '#818cf8'

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.01
  })

  const stars = useMemo(() => {
    const count = 3000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const col = new THREE.Color(c)
    const warmCol = new THREE.Color('#ffeedd')
    const blueCol = new THREE.Color('#aaccff')

    for (let i = 0; i < count; i++) {
      // King profile: dense core, sparse halo
      const t = Math.random()
      const r = size * (t < 0.3
        ? Math.pow(t / 0.3, 0.5) * 0.3 // Dense core
        : 0.3 + (t - 0.3) / 0.7 * 2.0  // Extended halo
      )

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Mix of stellar colors
      const starType = Math.random()
      let starColor
      if (starType < 0.3) starColor = warmCol.clone()     // Red/yellow giants
      else if (starType < 0.7) starColor = col.clone()      // Main sequence
      else starColor = blueCol.clone()                       // Blue stragglers

      const fade = 0.2 + Math.random() * 0.8 * Math.max(0, 1 - r / (size * 2))
      colors[i * 3] = starColor.r * fade
      colors[i * 3 + 1] = starColor.g * fade
      colors[i * 3 + 2] = starColor.b * fade
    }
    return { positions, colors }
  }, [size, c])

  return (
    <group ref={groupRef}>
      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[size * 0.25, 24, 16]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={2}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

/* ─── Exoplanet: rocky/gas with subtle features ────────────────────────── */
function ExoplanetVisual({ size, color }) {
  const ref = useRef()
  const c = color || '#4ade80'

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3
  })

  return (
    <group>
      {/* Planet body */}
      <mesh ref={ref}>
        <sphereGeometry args={[size * 0.5, 32, 24]} />
        <meshStandardMaterial
          color={c}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Thin atmosphere */}
      <mesh>
        <sphereGeometry args={[size * 0.56, 32, 24]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Host star glow nearby */}
      <mesh position={[size * 2.5, size * 0.5, 0]}>
        <sphereGeometry args={[size * 0.15, 16, 12]} />
        <meshBasicMaterial
          color="#ffffaa"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function WikiObjectVisual({ size, textureUrl }) {
  const groupRef = useRef()
  const matRef = useRef()
  const [tex, setTex] = useState(null)

  useEffect(() => {
    if (textureUrl) {
      const loader = new THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')
      loader.load(textureUrl, (loadedTex) => {
        loadedTex.colorSpace = THREE.SRGBColorSpace
        setTex(loadedTex)
      })
    }
  }, [textureUrl])

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.2
    // Smooth cinematic crossfade when texture finishes loading
    if (matRef.current && tex) {
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, 1, delta * 3)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Holographic loading skeleton */}
      {!tex && (
        <mesh>
          <sphereGeometry args={[size * 0.8, 16, 12]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.4} />
        </mesh>
      )}

      {/* Main textured body (cinematically fades in) */}
      <mesh>
        <sphereGeometry args={[size * 0.8, 32, 24]} />
        <meshStandardMaterial 
          ref={matRef}
          map={tex} 
          color="#ffffff" 
          roughness={0.6}
          transparent
          opacity={0} // Starts completely invisible
          depthWrite={!!tex}
        />
      </mesh>
      
      {/* Outer atmosphere / glow */}
      <mesh>
        <sphereGeometry args={[size * 0.9, 32, 24]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={tex ? 0.15 : 0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

function CosmicDot({ obj, onSelect }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const baseSize = getCosmicVisualRadius(obj)
  const position = getCosmicDisplayPosition(obj)
  if (!position.every(Number.isFinite)) return null

  const renderBody = () => {
    if (obj.type?.startsWith('galaxy')) {
      return <ProceduralGalaxyVisual size={baseSize} color={obj.color} obj={obj} />
    }
    if (obj.type === 'cluster') {
      return <ClusterVisual size={baseSize} color={obj.color} />
    }
    if (obj.type === 'nebula') {
      return <NebulaVisual size={baseSize} color={obj.color} />
    }
    if (obj.type === 'black_hole') {
      return <BlackHoleVisual size={baseSize} color={obj.color} />
    }
    if (obj.type === 'exoplanet') {
      return <ExoplanetVisual size={baseSize} color={obj.color} />
    }
    if (obj.type === 'star') {
      return <StarMesh size={baseSize * 0.6} color={obj.color} />
    }
    if (obj.type === 'wiki_object') {
      return <WikiObjectVisual size={baseSize} textureUrl={obj.textureUrl} />
    }
    return <StarMesh size={baseSize * 0.5} color={obj.color || '#60a5fa'} />
  }

  return (
    <group position={position}>
      <group
        ref={groupRef}
        onClick={(e) => { e.stopPropagation(); onSelect?.(obj) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <mesh visible={false}>
          <sphereGeometry args={[Math.max(baseSize * 1.5, 4000), 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {renderBody()}
        <HoverRing radius={Math.max(baseSize, 2000)} visible={hovered} />
      </group>
      <ObjectLabel name={obj.name} radius={Math.max(baseSize, 2000)} visible={hovered} />
    </group>
  )
}

export function SearchMarker({ position, radius = 1.2 }) {
  const ref = useRef()
  useFrame(({ clock, camera }) => {
    if (ref.current && position) {
      // Gentle pulsing effect
      const dist = camera.position.distanceTo(ref.current.position)
      // Base scale on distance so it maintains minimum screen visibility (about 2% of distance)
      const minScale = dist * 0.02
      // If the object's radius is smaller than minScale, use minScale instead
      const scaleFactor = Math.max(1, minScale / Math.max(radius, 0.1))
      
      const pulse = 1.0 + 0.15 * Math.sin(clock.elapsedTime * 4)
      ref.current.scale.setScalar(pulse * scaleFactor)
    }
  })
  if (!position || !position.every(Number.isFinite)) return null

  // Ensure the marker is clearly visible but doesn't completely block small objects
  const markerR = Math.max(radius * 1.5, 0.5)

  return (
    <group position={position} ref={ref}>
      <mesh>
        <ringGeometry args={[markerR, markerR + Math.max(markerR * 0.05, 0.02), 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} side={THREE.DoubleSide} depthTest={false} />
      </mesh>
    </group>
  )
}
