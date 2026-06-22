import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function SmoothGroup({ targetPosition, name, children, ...props }) {
  const ref = useRef()
  const targetVec = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    if (ref.current && targetPosition) {
      targetVec.set(targetPosition[0], targetPosition[1], targetPosition[2])
      
      const distSq = ref.current.position.distanceToSquared(targetVec)
      if (distSq > 1000000 || distSq < 0.0001) { // snap if jump is huge (> 1000 units) or very small
        ref.current.position.copy(targetVec)
      } else {
        // use damping for frame-rate independence
        const t = 1 - Math.exp(-15 * delta)
        ref.current.position.lerp(targetVec, t)
      }
    }
  })

  // Set initial position without animation
  return (
    <group ref={ref} name={name} position={targetPosition || [0,0,0]} {...props}>
      {children}
    </group>
  )
}
