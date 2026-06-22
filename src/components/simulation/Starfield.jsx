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
  
  float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  
  float noise(vec2 p){
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u*u*(3.0-2.0*u);
      
      float res = mix(
          mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
          mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
      return res*res;
  }

  void main() {
    vec2 p = vUv * 4.0;
    float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125;
    
    vec3 color1 = vec3(0.01, 0.02, 0.05); // Void black-blue
    vec3 color2 = vec3(0.05, 0.0, 0.15);  // Deep violet
    vec3 color3 = vec3(0.0, 0.1, 0.2);    // Cyan tint
    
    vec3 finalColor = mix(color1, color2, n * 1.5);
    finalColor = mix(finalColor, color3, smoothstep(0.6, 1.0, n));
    
    gl_FragColor = vec4(finalColor * 0.25, 1.0);
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
