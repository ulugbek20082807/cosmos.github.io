import * as THREE from 'three'

export function getMoonOrbitFrame(moon, a, simTime) {
  const e = moon.e || 0
  const i = (moon.i || 0) * Math.PI / 180
  const lan = (moon.lan || 0) * Math.PI / 180
  const w = (moon.w || 0) * Math.PI / 180
  const period = Math.max(0.2, moon.orbitPeriodDays || 10)
  const M = (simTime / (period * 86400)) * Math.PI * 2
  
  let E = M
  for(let iter=0; iter<5; iter++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  }
  
  const b = a * Math.sqrt(1 - e * e)
  
  // The planet is at (0,0) which is one focus of the ellipse.
  // We use standard eccentric anomaly mapping.
  const x = a * (Math.cos(E) - e)
  const z = -b * Math.sin(E)
  
  // Pre-calculate the 3D position by applying the rotations
  const vec = new THREE.Vector3(x, 0, z)
  
  // Apply argument of periapsis (rotation around Y axis in our XZ plane system)
  vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -w)
  // Apply inclination (rotation around X axis)
  vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), i)
  // Apply longitude of ascending node (rotation around Y axis)
  vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -lan)

  return { 
    localX: x, 
    localZ: z, 
    worldVec: vec,
    i, lan, w, a, b, e 
  }
}
