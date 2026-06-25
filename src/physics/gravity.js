const G = 6.674e-11
// 1 scene unit = 1e6 km = 1e9 meters
const METERS_PER_UNIT = 1e9

export { METERS_PER_UNIT }

import { getMoonOrbitFrame } from '../utils/orbitMath'
import { planetDisplayRadius, SUN } from '../data/solarSystemData'

export function gravitationalForce(m1, m2, dx, dy, dz) {
  const r2 = dx * dx + dy * dy + dz * dz
  const softening = 1e10 // Lowered from 1e14 to allow realistic close-range capture
  const r = Math.sqrt(r2 + softening)
  const f = (G * m1 * m2) / (r * r * r)
  return { fx: f * dx, fy: f * dy, fz: f * dz }
}

function stepNBodySingle(bodies, dt) {
  if (dt === 0 || bodies.length === 0) return bodies
  const accelerations = bodies.map(() => ({ ax: 0, ay: 0, az: 0 }))

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]
      if (a.fixed && b.fixed) continue
      if (!a.mass || !b.mass) continue

      const dx = (b.position[0] - a.position[0]) * METERS_PER_UNIT
      const dy = (b.position[1] - a.position[1]) * METERS_PER_UNIT
      const dz = (b.position[2] - a.position[2]) * METERS_PER_UNIT
      const { fx, fy, fz } = gravitationalForce(a.mass, b.mass, dx, dy, dz)

      if (!a.fixed) {
        accelerations[i].ax += fx / a.mass
        accelerations[i].ay += fy / a.mass
        accelerations[i].az += fz / a.mass
      }
      if (!b.fixed) {
        accelerations[j].ax -= fx / b.mass
        accelerations[j].ay -= fy / b.mass
        accelerations[j].az -= fz / b.mass
      }
    }
  }

  return bodies.map((body, i) => {
    if (body.fixed) return body
    const vel = [...body.velocity]
    const pos = [...body.position]
    
    // Symplectic Euler Integration: Update velocity FIRST, then use NEW velocity to update position.
    // This dramatically preserves orbital energy over extreme timescales compared to basic Euler.
    vel[0] += accelerations[i].ax * dt
    vel[1] += accelerations[i].ay * dt
    vel[2] += accelerations[i].az * dt
    
    pos[0] += (vel[0] * dt) / METERS_PER_UNIT
    pos[1] += (vel[1] * dt) / METERS_PER_UNIT
    pos[2] += (vel[2] * dt) / METERS_PER_UNIT
    
    return { ...body, velocity: vel, position: pos, oldPosition: body.position }
  })
}

// Distance from point C to line segment P1-P2
function pointToSegmentDistance(cx, cy, cz, p1x, p1y, p1z, p2x, p2y, p2z) {
  const vx = p2x - p1x
  const vy = p2y - p1y
  const vz = p2z - p1z
  
  const wx = cx - p1x
  const wy = cy - p1y
  const wz = cz - p1z

  const c1 = wx * vx + wy * vy + wz * vz
  if (c1 <= 0) {
    return Math.sqrt(wx * wx + wy * wy + wz * wz)
  }

  const c2 = vx * vx + vy * vy + vz * vz
  if (c2 <= c1) {
    const dx = cx - p2x
    const dy = cy - p2y
    const dz = cz - p2z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  const b = c1 / c2
  const closestX = p1x + b * vx
  const closestY = p1y + b * vy
  const closestZ = p1z + b * vz
  
  const dx = cx - closestX
  const dy = cy - closestY
  const dz = cz - closestZ
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function getCollisionRadius(body) {
  // If it's the real Sun in RealCosmos
  if (body.isSystem && body.id === 'sun-gravity') {
    return planetDisplayRadius(SUN.radiusKm) * 1.5
  }
  // If it's a planet in RealCosmos
  if (body.isPlanet) {
    return planetDisplayRadius(body.radiusKm || 6371)
  }
  // Otherwise it's a custom/spawned body
  const radius = body.radiusKm ? planetDisplayRadius(body.radiusKm) : (body.radius ? body.radius / 1e6 : 0.001)
  return Math.max(radius, 0.08)
}

export function stepNBody(bodies, dt, timeScale) {
  const scaledDt = dt * timeScale
  if (scaledDt === 0 || bodies.length === 0) return bodies

  // Dynamic sub-stepping for extreme orbital stability (e.g. at 1 century/sec)
  // We want roughly 1 step per hour of simulation time to maintain perfect orbit, capped at 2000 steps/frame to avoid CPU lag
  const STEPS = Math.min(2000, Math.max(10, Math.ceil(Math.abs(scaledDt) / 3600)))
  const subDt = scaledDt / STEPS
  let current = bodies
  const destroyed = []
  
  for (let step = 0; step < STEPS; step++) {
    current = stepNBodySingle(current, subDt)
    
    // Check collisions DURING sub-steps to prevent objects falling into a massive body
    // from jumping through the core and being slingshotted out at extreme velocities.
    const survivingBodies = []
    for (let i = 0; i < current.length; i++) {
      const b1 = current[i]
      let isDestroyed = false
      
      if (!b1.isSystem && !b1.isPlanet) {
        const r1 = getCollisionRadius(b1)
        for (let j = 0; j < current.length; j++) {
          if (i === j) continue
          const b2 = current[j]
          
          // Only destroy b1 if b2 is a system body (sun/planet), or if they are both custom and b2 is heavier/equal
          const b2IsSystemOrPlanet = b2.isSystem || b2.isPlanet
          if (b2IsSystemOrPlanet || (b2.mass || 0) >= (b1.mass || 0)) {
            const r2 = getCollisionRadius(b2)
            const oldPos = b1.oldPosition || b1.position
            const cx = b2.position[0]
            const cy = b2.position[1]
            const cz = b2.position[2]
            
            // Continuous collision check (line segment to sphere)
            const dist = pointToSegmentDistance(
              cx, cy, cz, 
              oldPos[0], oldPos[1], oldPos[2],
              b1.position[0], b1.position[1], b1.position[2]
            )
            
            if (dist < r1 + r2) {
              isDestroyed = true
              b1.destroyedBy = b2.name
              destroyed.push(b1)
              break
            }
          }
        }
      }
      
      if (!isDestroyed) {
        survivingBodies.push(b1)
      }
    }
    current = survivingBodies
  }

  // We attach destroyed bodies as a non-enumerable property so React/RealCosmos can check it
  if (destroyed.length > 0) {
    Object.defineProperty(current, 'destroyedObjects', { value: destroyed, enumerable: false })
  }

  return current
}

export function formatSimTime(seconds) {
  const s = Math.abs(seconds)
  if (s < 60) return `${seconds.toFixed(1)} s`
  if (s < 3600) return `${(seconds / 60).toFixed(1)} min`
  if (s < 86400) return `${(seconds / 3600).toFixed(2)} hr`
  if (s < 86400 * 365.25) return `${(seconds / 86400).toFixed(1)} d`
  if (s < 86400 * 365.25 * 100) return `${(seconds / (86400 * 365.25)).toFixed(2)} yr`
  if (s < 86400 * 365.25 * 1000) return `${(seconds / (86400 * 365.25 * 100)).toFixed(1)} cent`
  return `${(seconds / (86400 * 365.25 * 1000)).toFixed(2)} kyr`
}

/** Initialize N-body state for the solar system with circular orbital velocities */
export function initializeSolarSystemBodies(planets, sunMass = 1.989e30) {
  const bodies = [
    {
      id: 'sun-gravity',
      name: 'Sun',
      mass: sunMass,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      fixed: true,
      hidden: true,
      isSystem: true,
    },
  ]

  planets.forEach((planet, idx) => {
    const rUnits = planet.orbitKm / 1_000_000
    const rMeters = planet.orbitKm * 1000
    const angle = (idx / planets.length) * Math.PI * 2 * 0.3
    const v = Math.sqrt((G * sunMass) / rMeters)

    bodies.push({
      id: planet.id,
      name: planet.name,
      mass: planet.massKg,
      position: [rUnits * Math.cos(angle), 0, -rUnits * Math.sin(angle)],
      velocity: [-v * Math.sin(angle), 0, -v * Math.cos(angle)],
      fixed: false,
      isPlanet: true,
    })
  })

  return bodies
}

const PHYSICAL_TYPES = new Set(['star', 'planet', 'moon', 'asteroid', 'black_hole', 'comet', 'custom'])

export function isPhysicalType(type) {
  return PHYSICAL_TYPES.has(type)
}

/** Check if a new physical body overlaps existing bodies (sphere intersection) */
export function checkPositionCollision(newBody, existingBodies) {
  const newR = (newBody.radiusKm || 1000) / 1_000_000
  const [nx, ny, nz] = newBody.position

  for (const existing of existingBodies) {
    if (!existing.position) continue

    // The central sun in RealCosmos has isSystem: true, but no radiusKm explicitly set
    let exR = (existing.radiusKm || 1000) / 1_000_000
    if (existing.isSystem && existing.id === 'sun-gravity') {
      exR = 696340 / 1_000_000
    }

    const dx = nx - existing.position[0]
    const dy = ny - existing.position[1]
    const dz = nz - existing.position[2]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const minDist = newR + exR + 0.01

    if (dist < minDist) {
      return `Position overlaps "${existing.name}". Move at least ${(minDist - dist).toFixed(2)} ×10⁶ km away.`
    }
  }

  return null
}

// ─── Trajectory Physics ──────────────────────────────────────────────────────

const C = 299_792_458
const G_ACCEL = 9.80665
const PILOT_MONTH_SECONDS = (86400 * 365.25) / 12
const MAX_TRAJECTORY_DOTS = 180

function buildPilotMonthSamples(totalPilotSeconds) {
  if (!Number.isFinite(totalPilotSeconds) || totalPilotSeconds <= 0) return [0, 1]
  const targetDots = Math.min(MAX_TRAJECTORY_DOTS, 60)
  const samples = []
  for (let i = 0; i <= targetDots; i++) {
    samples.push(i / targetDots)
  }
  return samples
}

export function trajectoryConstantVelocity(startPos, endPos, speedFraction, numDots = 50, trueDistanceM = null) {
  if (speedFraction <= 0 || speedFraction >= 1) speedFraction = 0.1
  const v = speedFraction * C

  const dx = endPos[0] - startPos[0]
  const dy = endPos[1] - startPos[1]
  const dz = endPos[2] - startPos[2]
  const visualDist = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const distM = trueDistanceM !== null ? trueDistanceM : (visualDist * METERS_PER_UNIT)

  const gamma = 1 / Math.sqrt(1 - speedFraction * speedFraction)
  const tObserver = distM / v
  const tPilot = tObserver / gamma

  const fractions = buildPilotMonthSamples(tPilot)
  const fallbackFractions = Array.from({ length: numDots + 1 }, (_, i) => i / numDots)
  const dots = (fractions.length > 2 ? fractions : fallbackFractions).map((t) => (
    [startPos[0] + dx * t, startPos[1] + dy * t, startPos[2] + dz * t]
  ))

  if (distM === 0) {
    return {
      dots: [startPos, endPos],
      travelTimeObserver: 0,
      travelTimePilot: 0,
      gamma,
      distanceM: 0,
      distanceLy: 0,
      distanceAU: 0,
      contractedDistanceM: 0,
      contractedDistanceLy: 0,
    }
  }

  return {
    dots,
    travelTimeObserver: tObserver,
    travelTimePilot: tPilot,
    gamma,
    distanceM: distM,
    distanceLy: distM / (9.461e15),
    distanceAU: distM / (1.496e11),
    contractedDistanceM: distM / gamma,
    contractedDistanceLy: (distM / (9.461e15)) / gamma,
  }
}

export function trajectoryConstantAcceleration(startPos, endPos, accelG, numDots = 50, trueDistanceM = null) {
  if (accelG <= 0) accelG = 1
  const a = accelG * G_ACCEL

  const dx = endPos[0] - startPos[0]
  const dy = endPos[1] - startPos[1]
  const dz = endPos[2] - startPos[2]
  const visualDist = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const distM = trueDistanceM !== null ? trueDistanceM : (visualDist * METERS_PER_UNIT)

  if (distM === 0) {
    return {
      dots: [startPos, endPos],
      travelTimeObserver: 0,
      travelTimePilot: 0,
      maxSpeedFraction: 0,
      maxGamma: 1,
      distanceM: 0,
      distanceLy: 0,
      distanceAU: 0,
    }
  }

  const halfDist = distM / 2
  const alphaMid = Math.acosh(1 + (a * halfDist) / (C * C))
  const tauMid = (C / a) * alphaMid
  const tauTotal = 2 * tauMid
  const tObsMid = (C / a) * Math.sinh(alphaMid)
  const tObsTotal = 2 * tObsMid
  const maxSpeedFraction = Math.tanh(alphaMid)
  const maxGamma = Math.cosh(alphaMid)

  const accelDistance = (tau) => (C * C / a) * (Math.cosh((a * tau) / C) - 1)
  const pilotMonthFractions = buildPilotMonthSamples(tauTotal)
  const fallbackFractions = Array.from({ length: numDots + 1 }, (_, i) => i / numDots)
  const fractions = pilotMonthFractions.length > 2 ? pilotMonthFractions : fallbackFractions
  const dots = fractions.map((fractionOfPilotTrip) => {
    const tau = fractionOfPilotTrip * tauTotal
    const xFromStart = tau <= tauMid
      ? accelDistance(tau)
      : distM - accelDistance(tauTotal - tau)
    const fraction = Math.min(1, Math.max(0, xFromStart / distM))
    return [
      startPos[0] + dx * fraction,
      startPos[1] + dy * fraction,
      startPos[2] + dz * fraction,
    ]
  })

  return {
    dots,
    travelTimeObserver: tObsTotal,
    travelTimePilot: tauTotal,
    maxSpeedFraction,
    maxGamma,
    distanceM: distM,
    distanceLy: distM / 9.461e15,
    distanceAU: distM / 1.496e11,
  }
}

export function getPlanetWorldPos(planet, simTime) {
  const orbitAngle = (simTime / (planet.orbitPeriodDays * 86400)) * Math.PI * 2
  const orbitR = planet.orbitKm / 1_000_000
  return [
    orbitR * Math.cos(orbitAngle),
    0,
    -orbitR * Math.sin(orbitAngle),
  ]
}

export function getMoonWorldPos(moon, parentPos, simTime) {
  if (!parentPos) return [0, 0, 0]
  // The visual radius used for the orbit
  const orbitR = (moon.orbitKm || 384400) / 1_000_000
  
  const frame = getMoonOrbitFrame(moon, orbitR, simTime)
  const v = frame.worldVec

  return [
    parentPos[0] + v.x,
    parentPos[1] + v.y,
    parentPos[2] + v.z,
  ]
}
