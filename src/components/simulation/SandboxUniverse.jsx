import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Trail } from '@react-three/drei'
import { planetDisplayRadius, toUnits } from '../../data/solarSystemData'
import { TEXTURES } from '../../data/solarSystemData'
import { useSafeTexture } from '../../utils/textures'
import { HoverRing, ObjectLabel } from './ObjectInteraction'
import { useGlobalHover } from '../../hooks/useGlobalHover'

function StarGlowMaterial({ color, opacity = 1 }) {
  const shader = useMemo(() => ({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      opacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalMatrix * normal;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float opacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float intensity = max(0.0, dot(normal, viewDir));
        
        // Smoother, more expansive falloff
        float falloff = smoothstep(0.0, 1.0, intensity);
        float alpha = pow(falloff, 3.5) * opacity;
        
        // Dithering to eliminate color banding (stripes)
        float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        alpha += (dither - 0.5) * 0.025;
        alpha = max(0.0, alpha);
        
        gl_FragColor = vec4(glowColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [color, opacity])

  return <shaderMaterial attach="material" args={[shader]} />
}

const TEXTURE_MAP = {
  sun: TEXTURES.sun,
  mercury: TEXTURES.mercury,
  venus: TEXTURES.venus,
  earth: TEXTURES.earthDay,
  mars: TEXTURES.mars,
  jupiter: TEXTURES.jupiter,
  saturn: TEXTURES.saturn,
  uranus: TEXTURES.uranus,
  neptune: TEXTURES.neptune,
  pluto: TEXTURES.pluto,
  moon: TEXTURES.moon,
}

function TexturedBody({ body, radius, bodiesRef, onSelect }) {
  const groupRef = useRef()
  const ref = useRef()
  const { hovered, onPointerOver, onPointerOut } = useGlobalHover(body.id)
  const texture = useSafeTexture(TEXTURE_MAP[body.texturePreset])

  useFrame((_, delta) => {
    if (groupRef.current) {
      const b = bodiesRef?.current?.find(x => x.id === body.id)
      if (b && b.position) {
        groupRef.current.position.set(b.position[0], b.position[1], b.position[2])
      }
    }
    if (ref.current && body.emissive) ref.current.rotation.y += delta * 0.2
  })

  const isEmissive = body.type === 'star' || body.emissive
  const materialProps = isEmissive
    ? { map: texture, emissiveMap: texture, emissive: body.color || '#ffffff', emissiveIntensity: body.emissiveIntensity ?? 2, color: body.color || '#ffffff' }
    : { map: texture, color: texture ? '#ffffff' : (body.color || '#6699cc') }

  return (
    <group ref={groupRef} name={body.id}>
      <Trail width={radius * 5} length={20} color={body.color || '#fff4a8'} attenuation={(t) => t * t}>
        <mesh
          ref={ref}
          onClick={(e) => { e.stopPropagation(); onSelect?.(body.id) }}
          onPointerEnter={onPointerOver}
          onPointerLeave={onPointerOut}
        >
          <sphereGeometry args={[Math.max(radius, 0.001), 64, 64]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      </Trail>
      {isEmissive && (
        <mesh>
          <sphereGeometry args={[Math.max(radius * 4.0, 0.003), 64, 64]} />
          <StarGlowMaterial color={body.color || '#ffffff'} opacity={0.5} />
        </mesh>
      )}
      {isEmissive && (
        <pointLight color={body.color || '#ffffff'} intensity={2} distance={radius * 500} decay={2} />
      )}
      <HoverRing radius={radius} visible={hovered} />
      <ObjectLabel name={body.name} radius={radius} visible={hovered} />
    </group>
  )
}

function ColoredBody({ body, radius, bodiesRef, onSelect }) {
  const groupRef = useRef()
  const ref = useRef()
  const { hovered, onPointerOver, onPointerOut } = useGlobalHover(body.id)
  
  const isEmissive = body.type === 'star' || body.emissive
  const glowColor = body.color || (isEmissive ? '#fff4a8' : '#6699cc')

  useFrame(() => {
    if (groupRef.current) {
      const b = bodiesRef?.current?.find(x => x.id === body.id)
      if (b && b.position) {
        groupRef.current.position.set(b.position[0], b.position[1], b.position[2])
      }
    }
  })

  return (
    <group ref={groupRef} name={body.id}>
      <Trail width={radius * 5} length={20} color={body.color || '#6699cc'} attenuation={(t) => t * t}>
        <mesh
          ref={ref}
          onClick={(e) => { e.stopPropagation(); onSelect?.(body.id) }}
          onPointerEnter={onPointerOver}
          onPointerLeave={onPointerOut}
        >
          <sphereGeometry args={[Math.max(radius, 0.001), 64, 64]} />
          {isEmissive ? (
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
          ) : (
            <meshPhongMaterial color={glowColor} />
          )}
        </mesh>
      </Trail>
      {isEmissive && (
        <mesh>
          <sphereGeometry args={[Math.max(radius * 4.0, 0.003), 64, 64]} />
          <StarGlowMaterial color={glowColor} opacity={0.5} />
        </mesh>
      )}
      {isEmissive && (
        <pointLight color={glowColor} intensity={2} distance={radius * 500} decay={2} />
      )}
      <HoverRing radius={radius} visible={hovered} />
      <ObjectLabel name={body.name} radius={radius} visible={hovered} />
    </group>
  )
}

function SandboxBody({ body, bodiesRef, onSelect }) {
  const radius = body.radiusKm ? planetDisplayRadius(body.radiusKm) : toUnits(body.radius || 1000)
  const hasTexture = body.texturePreset && TEXTURE_MAP[body.texturePreset]
  const displayRadius = Math.max(radius, 0.08)

  if (hasTexture) {
    return <TexturedBody body={body} radius={displayRadius} bodiesRef={bodiesRef} onSelect={onSelect} />
  }
  return <ColoredBody body={body} radius={displayRadius} bodiesRef={bodiesRef} onSelect={onSelect} />
}

export function SandboxUniverse({ bodiesRef, onSelectBody, selectedId, showGrid = false }) {
  // Use current ref state to map bodies.
  // We assume bodiesRef won't change its length/identities during physics steps for rendering
  // (actually if new bodies are added, we rely on the parent component triggering a React render,
  // which is handled by uiBodies throttled state in RealCosmos.jsx!)
  const visibleBodies = bodiesRef?.current?.filter((b) => !b.hidden) || []
  return (
    <group>
      <ambientLight intensity={0.15} />
      <directionalLight position={[100, 200, 100]} intensity={0.6} />
      {showGrid && <gridHelper args={[2000, 40, '#1a3050', '#0d1828']} />}
      {visibleBodies.map((body) => (
        <SandboxBody
          key={body.id}
          body={body}
          bodiesRef={bodiesRef}
          onSelect={onSelectBody}
        />
      ))}
    </group>
  )
}

export function VelocityArrow({ body }) {
  if (!body?.velocity) return null
  const [vx, vy, vz] = body.velocity
  const mag = Math.sqrt(vx * vx + vy * vy + vz * vz)
  if (mag < 1) return null

  const dir = new THREE.Vector3(vx, vy, vz).normalize()
  const len = Math.min(mag * 0.00001, 50)
  const end = [
    body.position[0] + dir.x * len,
    body.position[1] + dir.y * len,
    body.position[2] + dir.z * len,
  ]

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array([...body.position, ...end]), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#22d3ee" transparent opacity={0.7} />
    </line>
  )
}
