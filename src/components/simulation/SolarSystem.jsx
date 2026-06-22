import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  planetDisplayRadius,
  moonDisplayRadius,
  planetOrbitRadius,
  moonOrbitDisplayRadius,
  ringDisplayRadii,
  SUN,
  TEXTURES,
  ASTEROID_BELT_INNER_KM,
  ASTEROID_BELT_OUTER_KM,
} from '../../data/solarSystemData'
import { OrbitPath } from './Starfield'
import { AsteroidBelt } from './AsteroidBelt'
import { useSafeTexture } from '../../utils/textures'
import { HoverRing, ObjectLabel } from './ObjectInteraction'
import { getMoonOrbitFrame } from '../../utils/orbitMath'
import { useGlobalHover } from '../../hooks/useGlobalHover'
import { StarGlowMaterial } from './StarGlowMaterial'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
function EarthShader({ planetId, orbitKm, planetStatesRef, simActive, simTimeRef, tilt, moon, onSelect, timeScale = 1 }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const moonRef = useRef()
  const { hovered: earthHovered, onPointerOver: onEarthOver, onPointerOut: onEarthOut } = useGlobalHover('earth')
  const { hovered: moonHovered, onPointerOver: onMoonOver, onPointerOut: onMoonOut } = useGlobalHover('moon_of_earth')
  const dayTex = useSafeTexture(TEXTURES.earthDay)
  const moonTex = useSafeTexture(TEXTURES.moon)

  const r = planetDisplayRadius(6371)
  const moonR = moon ? moonDisplayRadius(moon.radiusKm, r) : 0
  const moonOrbit = moon ? moonOrbitDisplayRadius(moon.orbitKm, r) : 0

  useFrame((_, delta) => {
    if (groupRef.current) {
      const pos = planetStatesRef.current[planetId]?.position
      if (pos) {
        groupRef.current.position.set(pos[0], pos[1], pos[2])
      } else {
        const orbitR = planetOrbitRadius(orbitKm)
        groupRef.current.position.set(orbitR, 0, 0)
      }
    }
    if (meshRef.current && simActive) {
      const rotSpeed = (2 * Math.PI) / (1 * 86400) // 1 day
      meshRef.current.rotation.y += delta * timeScale * rotSpeed
    }
    if (moonRef.current && moon) {
      const frame = getMoonOrbitFrame(moon, moonOrbit, simTimeRef.current)
      moonRef.current.position.set(frame.worldVec.x, frame.worldVec.y, frame.worldVec.z)
    }
  })

  const tiltRad = (tilt * Math.PI) / 180

  return (
    <group ref={groupRef} name={planetId}>
      {/* Tilt Group: Tilts the Earth surface, atmosphere, and its moon orbit */}
      <group rotation={[0, 0, tiltRad]}>
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onSelect?.({ name: 'Earth', id: 'earth', radiusKm: 6371 }) }}
          onPointerEnter={(e) => { e.stopPropagation(); onEarthOver() }}
          onPointerLeave={(e) => { e.stopPropagation(); onEarthOut() }}
        >
          <sphereGeometry args={[r, 48, 32]} />
          <meshPhongMaterial map={dayTex} color="#ffffff" shininess={15} />
        </mesh>
        {/* Procedural atmosphere glow */}
        <mesh>
          <sphereGeometry args={[r * 1.05, 48, 32]} />
          <meshBasicMaterial color="#4488ff" transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* Moon */}
        {moon && (
          <group>
            <OrbitPath radius={moonOrbit} color="#93c5fd" opacity={0.14} e={moon.e||0} i={moon.i||0} lan={moon.lan||0} w={moon.w||0} />
            <group ref={moonRef} name={moon.name.toLowerCase()}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  const wp = new THREE.Vector3()
                  moonRef.current.getWorldPosition(wp)
                  onSelect?.({ ...moon, id: 'moon', type: 'moon', parentPlanet: 'Earth', position: wp.toArray() })
                }}
                onPointerOver={(e) => { e.stopPropagation(); onMoonOver() }}
                onPointerOut={(e) => { e.stopPropagation(); onMoonOut() }}
              >
                <sphereGeometry args={[moonR, 32, 24]} />
                <meshStandardMaterial map={moonTex} color="#ffffff" roughness={0.95} />
              </mesh>
              <HoverRing radius={moonR} visible={moonHovered} />
              <ObjectLabel name="Moon" radius={moonR} visible={moonHovered} />
            </group>
          </group>
        )}
      </group>
      <HoverRing radius={r} visible={earthHovered} />
      <ObjectLabel name="Earth" radius={r} visible={earthHovered} />
    </group>
  )
}

function PlanetMesh({ planet, planetStatesRef, simActive, simTimeRef, onSelect, timeScale = 1 }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const { hovered, onPointerOver, onPointerOut } = useGlobalHover(planet.id)
  const texture = useSafeTexture(planet.texture)
  const radius = planetDisplayRadius(planet.radiusKm)

  useFrame((_, delta) => {
    if (groupRef.current) {
      const pos = planetStatesRef.current[planet.id]?.position
      if (pos) {
        groupRef.current.position.set(pos[0], pos[1], pos[2])
      } else {
        const orbitR = planetOrbitRadius(planet.orbitKm)
        groupRef.current.position.set(orbitR, 0, 0)
      }
    }
    if (meshRef.current && simActive) {
      const rotSpeed = (2 * Math.PI) / (planet.rotationPeriodDays * 86400)
      meshRef.current.rotation.y += delta * timeScale * rotSpeed
    }
  })

  const tiltRad = (planet.tilt * Math.PI) / 180

  return (
    <group ref={groupRef} name={planet.id}>
      {/* Tilt Group: Tilts everything (planet, rings, moons) by planet's axial tilt */}
      <group rotation={[0, 0, tiltRad]}>
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onSelect?.(planet) }}
          onPointerEnter={onPointerOver}
          onPointerLeave={onPointerOut}
        >
          <sphereGeometry args={[radius, 48, 32]} />
          <meshPhongMaterial map={texture} color="#ffffff" shininess={8} />
        </mesh>
        
        {planet.ring && <RingBody planet={planet} radius={radius} />}
        {planet.moons?.map((moon) => (
          <MoonBody key={moon.name} moon={moon} parentPlanet={planet.name} parentRadius={radius} simActive={simActive} simTimeRef={simTimeRef} onSelect={onSelect} />
        ))}
      </group>
      <HoverRing radius={radius} visible={hovered} />
      <ObjectLabel name={planet.name} radius={radius} visible={hovered} />
    </group>
  )
}

function RingBody({ planet, radius }) {
  const ringTex = useSafeTexture(planet.ring.texture)
  const { inner, outer } = ringDisplayRadii(planet.ring, radius)

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 128]} />
      <meshStandardMaterial map={ringTex} side={THREE.DoubleSide} transparent opacity={0.85} color="#ffffff" roughness={0.9} />
    </mesh>
  )
}

function MoonBody({ moon, parentPlanet, parentRadius, simActive, simTimeRef, onSelect }) {
  const ref = useRef()
  const moonId = moon.name.toLowerCase()
  const { hovered, onPointerOver, onPointerOut } = useGlobalHover(moonId)
  const texture = useSafeTexture(moon.texture)
  const moonR = moonDisplayRadius(moon.radiusKm, parentRadius)
  const moonOrbit = moonOrbitDisplayRadius(moon.orbitKm, parentRadius)

  useFrame(() => {
    if (ref.current) {
      const frame = getMoonOrbitFrame(moon, moonOrbit, simTimeRef.current)
      ref.current.position.set(frame.worldVec.x, frame.worldVec.y, frame.worldVec.z)
    }
  })

  return (
    <group>
      <OrbitPath radius={moonOrbit} color="#93c5fd" opacity={0.1} e={moon.e||0} i={moon.i||0} lan={moon.lan||0} w={moon.w||0} />
      <group ref={ref} name={moonId}>
        <mesh
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.({ ...moon, id: moonId, type: 'moon', parentPlanet })
          }}
          onPointerEnter={onPointerOver}
          onPointerLeave={onPointerOut}
        >
          <sphereGeometry args={[moonR, 32, 24]} />
          <meshStandardMaterial map={texture} color="#ffffff" roughness={0.95} />
        </mesh>
        <HoverRing radius={moonR} visible={hovered} />
        <ObjectLabel name={moon.name} radius={moonR} visible={hovered} />
      </group>
    </group>
  )
}

function Sun({ onSelect, simActive, timeScale = 1 }) {
  const ref = useRef()
  const coronaRef = useRef()
  const { hovered, onPointerOver, onPointerOut } = useGlobalHover('sun')
  const sunTex = useSafeTexture(TEXTURES.sun)
  const radius = planetDisplayRadius(SUN.radiusKm) * 1.5

  useFrame(({ clock }, delta) => {
    if (simActive && ref.current) {
      const rotSpeed = (2 * Math.PI) / (25.05 * 86400)
      ref.current.rotation.y += delta * timeScale * rotSpeed
    }
    if (coronaRef.current) {
      const pulse = 1 + 0.04 * Math.sin(clock.elapsedTime * 1.5)
      coronaRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group name="sun">
      {/* Smooth, dithered solar corona glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[radius * 4.0, 64, 48]} />
        <StarGlowMaterial color="#ffa030" opacity={0.6} />
      </mesh>
      <mesh
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onSelect?.({ id: 'sun', name: 'Sun', ...SUN }) }}
        onPointerEnter={onPointerOver}
        onPointerLeave={onPointerOut}
      >
        <sphereGeometry args={[radius, 64, 48]} />
        <meshStandardMaterial map={sunTex} emissiveMap={sunTex} emissive={sunTex ? "#ffffff" : "#fff2a3"} emissiveIntensity={2} color="#ffffff" />
      </mesh>
      <pointLight color="#ffd37a" intensity={4.5} distance={3500} decay={1.2} />
      <HoverRing radius={radius} visible={hovered} />
      <ObjectLabel name="Sun" radius={radius} visible={hovered} />
    </group>
  )
}

// Fade orbit path opacity for very distant orbits so they don't appear as intrusive lines when zoomed in
function orbitOpacity(radiusUnits) {
  return Math.max(0.015, 0.1 / (1 + radiusUnits / 500))
}

export function SolarSystem({ planets, planetStatesRef, onSelectPlanet, simActive = true, simTimeRef, timeScale = 1 }) {
  const asteroidBeltAfterIndex = planets.findIndex((planet) => planet.id === 'mars')

  return (
    <group>
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1.1} luminanceSmoothing={0.9} height={300} opacity={1.5} mipmapBlur />
        <Vignette eskil={false} offset={0.1} darkness={0.9} />
      </EffectComposer>
      <Sun onSelect={onSelectPlanet} simActive={simActive} timeScale={timeScale} />
      <pointLight color="#fff8e0" intensity={3} distance={100000} decay={0} />
      <ambientLight intensity={0.08} />
      {planets.map((planet, planetIndex) => {
        const orbitR = planetOrbitRadius(planet.orbitKm)

        if (planet.shader === 'earth') {
          return (
            <group key={planet.id}>
              <OrbitPath radius={orbitR} opacity={orbitOpacity(orbitR)} />
              <EarthShader
                planetId={planet.id}
                orbitKm={planet.orbitKm}
                planetStatesRef={planetStatesRef}
                simActive={simActive}
                simTimeRef={simTimeRef}
                tilt={planet.tilt}
                moon={planet.moons?.[0]}
                onSelect={onSelectPlanet}
                timeScale={timeScale}
              />
            </group>
          )
        }

        const showBelt = planetIndex === asteroidBeltAfterIndex

        return (
          <group key={planet.id}>
            <OrbitPath radius={orbitR} opacity={orbitOpacity(orbitR)} e={planet.e||0} i={planet.i||0} lan={planet.lan||0} w={planet.w||0} />
            <PlanetMesh
              planet={planet}
              planetStatesRef={planetStatesRef}
              simActive={simActive}
              simTimeRef={simTimeRef}
              onSelect={onSelectPlanet}
              timeScale={timeScale}
            />
            {showBelt && <AsteroidBelt innerKm={ASTEROID_BELT_INNER_KM} outerKm={ASTEROID_BELT_OUTER_KM} simActive={simActive} />}
          </group>
        )
      })}
    </group>
  )
}

export function getSolarObjectPosition(planetId, planetStates, orbitKm = 0) {
  if (planetStates?.[planetId]) return planetStates[planetId].position
  if (planetId === 'sun') return [0, 0, 0]
  return [planetOrbitRadius(orbitKm), 0, 0]
}

export function getSolarObjectRadius(id, radiusKm) {
  if (id === 'sun') return planetDisplayRadius(SUN.radiusKm)
  return planetDisplayRadius(radiusKm || 6371)
}
