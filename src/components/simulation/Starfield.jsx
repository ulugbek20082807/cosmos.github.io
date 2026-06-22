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

const nebulaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nebulaFragmentShader = `
  varying vec2 vUv;
  
  void main() {
    // Create incredibly smooth, large-scale cosmic clouds using sine waves
    vec2 p = vUv * 2.0;
    
    // Smooth, low-frequency wave math
    float wave1 = sin(p.x * 3.1415 + p.y * 2.0);
    float wave2 = cos(p.y * 3.1415 - p.x * 1.5);
    float n = (wave1 + wave2) * 0.5 + 0.5; // Normalize to 0.0 - 1.0
    
    // Deep cosmic colors
    vec3 color1 = vec3(0.01, 0.015, 0.04); // Void black-blue
    vec3 color2 = vec3(0.06, 0.01, 0.12);  // Deep violet nebula
    vec3 color3 = vec3(0.0, 0.08, 0.15);   // Cyan tint
    
    // Smooth blending
    vec3 finalColor = mix(color1, color2, smoothstep(0.2, 0.8, n));
    finalColor = mix(finalColor, color3, smoothstep(0.7, 1.0, n));
    
    // Add a slight radial darkening towards the poles (top/bottom)
    float poleDarken = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
    finalColor *= poleDarken;
    
    gl_FragColor = vec4(finalColor * 0.4, 1.0);
  }
`

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
    <group>
      <mesh>
        <sphereGeometry args={[180000, 32, 32]} />
        <shaderMaterial
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.2} color="#8899bb" transparent opacity={0.85} sizeAttenuation />
      </points>
    </group>
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
