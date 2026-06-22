import { Html } from '@react-three/drei'
import * as THREE from 'three'

/** Blue hover ring around an object */
export function HoverRing({ radius, visible }) {
  if (!visible) return null
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 1.15, radius * 1.25, 64]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

/** Label below object — shown on hover only */
export function ObjectLabel({ name, radius, visible }) {
  if (!visible || !name) return null
  return (
    <Html
      position={[0, -Math.max(radius * 1.35, 0.16), 0]}
      center
      style={{ pointerEvents: 'none' }}
    >
      <div className="px-2.5 py-1 text-[11px] leading-none font-mono whitespace-nowrap text-cosmic-cyan bg-slate-950/90 border border-cosmic-glow/60 shadow-lg">
        {name}
      </div>
    </Html>
  )
}

export function computeFocusCamera(position, visualRadius = 5) {
  const dist = Math.max(visualRadius * 14, 8)
  const dir = new THREE.Vector3(0.6, 0.35, 0.7).normalize()
  return {
    target: position,
    cameraPos: [
      position[0] + dir.x * dist,
      position[1] + dir.y * dist,
      position[2] + dir.z * dist,
    ],
    distance: dist,
  }
}
