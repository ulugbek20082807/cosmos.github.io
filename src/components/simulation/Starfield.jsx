import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function raDecToVector(raDeg, decDeg, distance) {
  const ra = (raDeg * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  return new THREE.Vector3(
    distance * Math.cos(dec) * Math.cos(ra),
    distance * Math.sin(dec),
    distance * Math.cos(dec) * Math.sin(ra),
  )
}

export function Starfield() {
  const ref = useRef()
  const positions = useMemo(() => {
    const count = 4000
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 8000 + Math.random() * 12000
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.002
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.2} color="#8899bb" transparent opacity={0.85} sizeAttenuation />
    </points>
  )
}

export function OrbitPath({ radius, color = '#ffffff', opacity = 0.08, e = 0, i = 0, lan = 0, w = 0 }) {
  const points = useMemo(() => {
    const b = radius * Math.sqrt(1 - e * e)
    const curve = new THREE.EllipseCurve(
      -e * radius, 0,
      radius, b,
      0, Math.PI * 2,
      false, 0
    )
    
    const iRad = (i || 0) * Math.PI / 180
    const lanRad = (lan || 0) * Math.PI / 180
    const wRad = (w || 0) * Math.PI / 180

    // Convert to 3D and apply orbital rotations
    const pts = curve.getPoints(128).map((p) => {
      const vec = new THREE.Vector3(p.x, 0, -p.y)
      // Same exact rotations as getMoonOrbitFrame
      vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -wRad)
      vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), iRad)
      vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -lanRad)
      return vec
    })
    return pts
  }, [radius, e, i, lan, w])

  return (
    <line loop>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  )
}
