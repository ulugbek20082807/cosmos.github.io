import { useMemo } from 'react'
import * as THREE from 'three'

export function TrajectoryPath({ dots }) {
  const safeDots = Array.isArray(dots) && dots.length > 1 && dots.every(
    (d) => Array.isArray(d) && d.length === 3 && d.every(Number.isFinite),
  ) ? dots : null

  const { lineGeom, midPtsGeom, capPtsGeom } = useMemo(() => {
    if (!safeDots) return { lineGeom: null, midPtsGeom: null, capPtsGeom: null }

    const positions = new Float32Array(safeDots.length * 3)
    safeDots.forEach((d, i) => {
      positions[i * 3] = d[0]
      positions[i * 3 + 1] = d[1]
      positions[i * 3 + 2] = d[2]
    })
    
    const lGeom = new THREE.BufferGeometry()
    lGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Middle dots
    const midCount = Math.max(0, safeDots.length - 2)
    const midPos = new Float32Array(midCount * 3)
    for (let i = 1; i < safeDots.length - 1; i++) {
      midPos[(i - 1) * 3] = safeDots[i][0]
      midPos[(i - 1) * 3 + 1] = safeDots[i][1]
      midPos[(i - 1) * 3 + 2] = safeDots[i][2]
    }
    const mGeom = new THREE.BufferGeometry()
    if (midCount > 0) mGeom.setAttribute('position', new THREE.BufferAttribute(midPos, 3))

    // Start and end caps
    const capPos = new Float32Array(6)
    capPos.set(safeDots[0], 0)
    capPos.set(safeDots[safeDots.length - 1], 3)
    const cGeom = new THREE.BufferGeometry()
    cGeom.setAttribute('position', new THREE.BufferAttribute(capPos, 3))
    
    // Cap colors
    const startCol = new THREE.Color('#22d3ee')
    const endCol = new THREE.Color('#a78bfa')
    const capCol = new Float32Array([...startCol.toArray(), ...endCol.toArray()])
    cGeom.setAttribute('color', new THREE.BufferAttribute(capCol, 3))

    return { lineGeom: lGeom, midPtsGeom: mGeom, capPtsGeom: cGeom }
  }, [safeDots])

  if (!lineGeom) return null

  return (
    <group>
      <line geometry={lineGeom}>
        <lineBasicMaterial color="#00ffff" transparent opacity={0.8} linewidth={1} depthTest={false} />
      </line>
      {midPtsGeom && midPtsGeom.attributes.position && (
        <points geometry={midPtsGeom}>
          <pointsMaterial color="#38bdf8" size={5} sizeAttenuation={false} transparent opacity={0.9} depthWrite={false} depthTest={false} />
        </points>
      )}
      <points geometry={capPtsGeom}>
        <pointsMaterial size={10} sizeAttenuation={false} vertexColors transparent opacity={1} depthWrite={false} depthTest={false} />
      </points>
    </group>
  )
}
