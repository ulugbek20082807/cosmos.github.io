import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { raDecToVector } from './Starfield'
import { TEXTURES } from '../../data/solarSystemData'
import { useSafeTexture, REMOTE_TEXTURES } from '../../utils/textures'
import { HoverRing, ObjectLabel } from './ObjectInteraction'

const DISPLAY_BASE = 2000
const DISPLAY_FACTOR = 5000

export function getCosmicDisplayPosition(obj) {
  // Push deep space objects significantly further out so they dwarf the solar system correctly
  const displayDist = Math.log10(obj.distanceLy + 1) * 15000 + 8000
  return raDecToVector(obj.ra, obj.dec, displayDist).toArray()
}

export function getCosmicVisualRadius(obj) {
  if (obj.type === 'galaxy' || obj.type === 'cluster') return 8000
  if (obj.type === 'nebula') return 2500
  if (obj.type === 'black_hole') return 500
  if (obj.type === 'exoplanet') return 50
  if (obj.type === 'star') return 120
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
      {/* Star glow (this provides the colored tint based on star temperature) */}
      <mesh>
        <sphereGeometry args={[size * 1.6, 24, 16]} />
        <meshBasicMaterial
          color={color || '#fff4a8'}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

/* ─── Galaxy: multi-armed spiral with dust lanes, bulge, and halo ──────── */
function GalaxyVisual({ size, color }) {
  const groupRef = useRef()
  const c = color || '#a78bfa'
  const coreSize = size * 0.3

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.015
  })

  // Spiral arm dust particles
  const spiralDust = useMemo(() => {
    const count = 5000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const col = new THREE.Color(c)
    const warmCol = new THREE.Color('#ffe8c0')
    const blueCol = new THREE.Color('#8888ff')

    for (let i = 0; i < count; i++) {
      // Two main spiral arms + two faint arms
      const armIndex = i % 4
      const armOffset = (armIndex * Math.PI) / 2
      const t = Math.random()
      const r = coreSize * 0.4 + t * size * 2.2

      // Logarithmic spiral: angle increases logarithmically with radius
      const spiralTightness = 0.45
      const spiralAngle = armOffset + spiralTightness * Math.log(r / coreSize + 1) * 4

      // Add spread that increases with radius
      const spread = (0.05 + t * 0.25) * r * 0.3
      const offsetAngle = spiralAngle + (Math.random() - 0.5) * spread / r

      const y = (Math.random() - 0.5) * size * 0.08 * (1 + (coreSize / (r + 1)) * 3)

      positions[i * 3] = Math.cos(offsetAngle) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(offsetAngle) * r

      // Color gradient: warm center to blue outer with arm color mixed
      const radialFade = Math.max(0, 1 - r / (size * 2.5))
      const armBrightness = armIndex < 2 ? 1.0 : 0.5 // Primary arms brighter
      const fade = (0.3 + Math.random() * 0.7) * radialFade * armBrightness

      const mixColor = new THREE.Color().lerpColors(blueCol, warmCol, radialFade)
      mixColor.lerp(col, 0.3)

      colors[i * 3] = mixColor.r * fade + col.r * 0.1
      colors[i * 3 + 1] = mixColor.g * fade + col.g * 0.1
      colors[i * 3 + 2] = mixColor.b * fade + col.b * 0.1

      sizes[i] = (0.3 + Math.random() * 0.7) * (radialFade * 0.6 + 0.4)
    }
    return { positions, colors, sizes }
  }, [size, coreSize, c])

  // Central bulge stars (denser, warmer)
  const bulgeStars = useMemo(() => {
    const count = 1200
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const warmCol = new THREE.Color('#ffe0a0')
    const col = new THREE.Color(c)

    for (let i = 0; i < count; i++) {
      const r = coreSize * Math.pow(Math.random(), 2) * 1.5
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * coreSize * 0.6 * Math.pow(Math.random(), 0.5)

      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(theta) * r

      const fade = 0.5 + Math.random() * 0.5
      const mixColor = new THREE.Color().lerpColors(col, warmCol, 0.6)
      colors[i * 3] = mixColor.r * fade
      colors[i * 3 + 1] = mixColor.g * fade
      colors[i * 3 + 2] = mixColor.b * fade
    }
    return { positions, colors }
  }, [coreSize, c])

  // Faint outer halo stars
  const haloStars = useMemo(() => {
    const count = 800
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const col = new THREE.Color(c)

    for (let i = 0; i < count; i++) {
      const r = size * 0.5 + Math.random() * size * 2.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.15 // very flat
      positions[i * 3 + 2] = r * Math.cos(phi)

      const fade = 0.05 + Math.random() * 0.15
      colors[i * 3] = col.r * fade
      colors[i * 3 + 1] = col.g * fade
      colors[i * 3 + 2] = col.b * fade
    }
    return { positions, colors }
  }, [size, c])

  return (
    <group ref={groupRef}>
      {/* Bright galactic core glow */}
      <mesh>
        <sphereGeometry args={[coreSize * 0.6, 32, 24]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[coreSize * 1.2, 32, 24]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Central bulge stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bulgeStars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[bulgeStars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={size * 0.04}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Spiral arm dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[spiralDust.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[spiralDust.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={size * 0.05}
          vertexColors
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Faint halo */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[haloStars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[haloStars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={size * 0.025}
          vertexColors
          transparent
          opacity={0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Flat disc glow for the galaxy plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[coreSize * 0.3, size * 2.5, 96]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
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
          size={size * 0.04}
          vertexColors
          transparent
          opacity={0.9}
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
            size={size * 0.04}
            vertexColors
            transparent
            opacity={0.85}
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
            size={size * 0.05}
            vertexColors
            transparent
            opacity={0.5}
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
          size={size * 0.04}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
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

function CosmicDot({ obj, onSelect }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const baseSize = getCosmicVisualRadius(obj)
  const position = getCosmicDisplayPosition(obj)
  if (!position.every(Number.isFinite)) return null

  const renderBody = () => {
    if (obj.type === 'galaxy') {
      return <GalaxyVisual size={baseSize} color={obj.color} />
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
        {renderBody()}
        <HoverRing radius={baseSize} visible={hovered} />
      </group>
      <ObjectLabel name={obj.name} radius={baseSize} visible={hovered} />
    </group>
  )
}

export function SearchMarker({ position, radius = 1.2 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current && position) {
      // Gentle pulsing effect
      const s = 1.0 + 0.1 * Math.sin(clock.elapsedTime * 4)
      ref.current.scale.setScalar(s)
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
