// Astronomical scale: 1 scene unit = 1 million km
// All radii and orbital distances use real values divided by 1e6

import cosmicData from './cosmicData.json'
import { TEXTURES } from '../utils/textures'

export { TEXTURES }

export const KM_PER_UNIT = 1_000_000
export const AU_KM = 149_597_870.7
export const EARTH_RADIUS_KM = 6_371


export const toUnits = (km) => km / KM_PER_UNIT
export const toKm = (units) => units * KM_PER_UNIT

// Asteroid belt: 2.2–3.2 AU (NASA main belt)
export const ASTEROID_BELT_INNER_KM = 329_000_000
export const ASTEROID_BELT_OUTER_KM = 478_000_000

export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    radiusKm: 2_439.7,
    massKg: 3.301e23,
    orbitKm: 57_909_227,
    tilt: 0.034,
    rotationPeriodDays: 58.6,
    orbitPeriodDays: 88,
    texture: TEXTURES.mercury,
    gravityG: 0.38,
    info: 'Innermost planet; extreme temperature swings.',
  },
  {
    id: 'venus',
    name: 'Venus',
    radiusKm: 6_051.8,
    massKg: 4.867e24,
    orbitKm: 108_209_475,
    tilt: 177.4,
    rotationPeriodDays: 243,
    orbitPeriodDays: 225,
    texture: TEXTURES.venus,
    gravityG: 0.90,
    info: 'Thick CO₂ atmosphere; runaway greenhouse effect.',
  },
  {
    id: 'earth',
    name: 'Earth',
    radiusKm: 6_371,
    massKg: 5.972e24,
    orbitKm: 149_597_870.7,
    tilt: 23.5,
    rotationPeriodDays: 1,
    orbitPeriodDays: 365.25,
    shader: 'earth',
    texture: TEXTURES.earthDay,
    moons: [
      {
        name: 'Moon',
        radiusKm: 1_737.4,
        orbitKm: 384_400,
        texture: TEXTURES.moon,
        orbitPeriodDays: 27.3,
      },
    ],
    gravityG: 1.00,
    info: 'Third planet; only known world with life.',
  },
  {
    id: 'mars',
    name: 'Mars',
    radiusKm: 3_389.5,
    massKg: 6.417e23,
    orbitKm: 227_943_824,
    tilt: 25.19,
    rotationPeriodDays: 1.03,
    orbitPeriodDays: 687,
    texture: TEXTURES.mars,
    moons: [
      { name: 'Phobos', radiusKm: 11.1, orbitKm: 9_376, texture: TEXTURES.moon, orbitPeriodDays: 0.32, e: 0.0151, i: 1.093, lan: 35.0, w: 150.0 },
      { name: 'Deimos', radiusKm: 6.2, orbitKm: 23_463, texture: TEXTURES.moon, orbitPeriodDays: 1.26, e: 0.0002, i: 1.793, lan: 115.0, w: 240.0 },
    ],
    gravityG: 0.38,
    info: 'The Red Planet; target for human exploration.',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    radiusKm: 69_911,
    massKg: 1.898e27,
    orbitKm: 778_570_000,
    tilt: 3.13,
    rotationPeriodDays: 0.41,
    orbitPeriodDays: 4332.59,
    texture: TEXTURES.jupiter,
    moons: [
      { name: 'Io', radiusKm: 1_821.6, orbitKm: 421_700, texture: TEXTURES.io, orbitPeriodDays: 1.77, e: 0.0041, i: 0.036, lan: 43.9, w: 84.1 },
      { name: 'Europa', radiusKm: 1_560.8, orbitKm: 671_100, texture: TEXTURES.europa, orbitPeriodDays: 3.55, e: 0.009, i: 0.466, lan: 219.1, w: 282.8 },
      { name: 'Ganymede', radiusKm: 2_634.1, orbitKm: 1_070_400, texture: TEXTURES.ganymede, orbitPeriodDays: 7.15, e: 0.0013, i: 0.177, lan: 63.5, w: 192.4 },
      { name: 'Callisto', radiusKm: 2_410.3, orbitKm: 1_882_700, texture: TEXTURES.callisto, orbitPeriodDays: 16.69, e: 0.0074, i: 0.192, lan: 298.8, w: 52.6 },
    ],
    gravityG: 2.53,
    info: 'Gas giant; largest planet in the solar system.',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    radiusKm: 58_232,
    massKg: 5.683e26,
    orbitKm: 1_433_530_000,
    tilt: 26.73,
    rotationPeriodDays: 0.45,
    orbitPeriodDays: 10759,
    texture: TEXTURES.saturn,
    ring: { innerKm: 70_000, outerKm: 140_000, texture: TEXTURES.saturnRing },
    moons: [
      { name: 'Mimas', radiusKm: 198.2, orbitKm: 185_539, texture: TEXTURES.mimas, orbitPeriodDays: 0.94, e: 0.0202, i: 1.574, lan: 153.3, w: 343.8 },
      { name: 'Enceladus', radiusKm: 252.1, orbitKm: 238_042, texture: TEXTURES.enceladus, orbitPeriodDays: 1.37, e: 0.0047, i: 0.009, lan: 93.9, w: 211.2 },
      { name: 'Tethys', radiusKm: 531.1, orbitKm: 294_672, texture: TEXTURES.tethys, orbitPeriodDays: 1.89, e: 0.0001, i: 1.12, lan: 215.1, w: 104.9 },
      { name: 'Dione', radiusKm: 561.4, orbitKm: 377_415, texture: TEXTURES.dione, orbitPeriodDays: 2.74, e: 0.0022, i: 0.019, lan: 326.6, w: 187.3 },
      { name: 'Rhea', radiusKm: 763.8, orbitKm: 527_108, texture: TEXTURES.rhea, orbitPeriodDays: 4.52, e: 0.00125, i: 0.331, lan: 345.0, w: 260.4 },
      { name: 'Titan', radiusKm: 2_574.7, orbitKm: 1_221_870, texture: TEXTURES.titan, orbitPeriodDays: 15.95, e: 0.0288, i: 0.348, lan: 24.5, w: 185.7 },
      { name: 'Iapetus', radiusKm: 734.5, orbitKm: 3_560_820, texture: TEXTURES.iapetus, orbitPeriodDays: 79.32, e: 0.0286, i: 15.47, lan: 75.8, w: 275.6 },
    ],
    info: 'Iconic ring system; low density gas giant.',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    radiusKm: 25_362,
    massKg: 8.681e25,
    orbitKm: 2_872_460_000,
    tilt: 97.77,
    rotationPeriodDays: 0.72,
    orbitPeriodDays: 30687,
    texture: TEXTURES.uranus,
    ring: { innerKm: 38_000, outerKm: 98_000, texture: TEXTURES.uranusRing },
    moons: [
      { name: 'Miranda', radiusKm: 235.8, orbitKm: 129_390, texture: TEXTURES.miranda, orbitPeriodDays: 1.41, e: 0.0013, i: 4.232, lan: 110.1, w: 68.2 },
      { name: 'Ariel', radiusKm: 578.9, orbitKm: 191_020, texture: TEXTURES.ariel, orbitPeriodDays: 2.52, e: 0.0012, i: 0.041, lan: 22.4, w: 112.5 },
      { name: 'Umbriel', radiusKm: 584.7, orbitKm: 266_300, texture: TEXTURES.umbriel, orbitPeriodDays: 4.14, e: 0.0039, i: 0.128, lan: 204.6, w: 58.7 },
      { name: 'Titania', radiusKm: 788.9, orbitKm: 435_910, texture: TEXTURES.titania, orbitPeriodDays: 8.71, e: 0.0011, i: 0.340, lan: 275.9, w: 290.1 },
      { name: 'Oberon', radiusKm: 761.4, orbitKm: 583_520, texture: TEXTURES.oberon, orbitPeriodDays: 13.46, e: 0.0014, i: 0.058, lan: 35.8, w: 104.4 },
    ],
    info: 'Ice giant with extreme axial tilt.',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    radiusKm: 24_622,
    massKg: 1.024e26,
    orbitKm: 4_495_060_000,
    tilt: 28.32,
    rotationPeriodDays: 0.67,
    orbitPeriodDays: 60190,
    texture: TEXTURES.neptune,
    moons: [
      { name: 'Triton', radiusKm: 1_353.4, orbitKm: 354_759, texture: TEXTURES.triton, orbitPeriodDays: 5.88, e: 0.000016, i: 156.885, lan: 109.6, w: 0 },
      { name: 'Nereid', radiusKm: 170, orbitKm: 5_513_400, texture: TEXTURES.nereid, orbitPeriodDays: 360.13, e: 0.7507, i: 7.23, lan: 219.7, w: 293.9 },
    ],
    info: 'Outermost major planet; supersonic winds.',
  },
  {
    id: 'pluto',
    name: 'Pluto',
    radiusKm: 1_188.3,
    massKg: 1.303e22,
    orbitKm: 5_906_380_000,
    tilt: 122.53,
    rotationPeriodDays: 6.39,
    orbitPeriodDays: 90560,
    texture: TEXTURES.pluto,
    moons: [
      { name: 'Charon', radiusKm: 606, orbitKm: 19_640, texture: TEXTURES.moon, orbitPeriodDays: 6.39, e: 0.0022, i: 0.08, lan: 80.0, w: 10.0 },
    ],
    info: 'Dwarf planet in the Kuiper belt.',
  },
]

export const ALL_MOONS = PLANETS.flatMap((planet) =>
  (planet.moons || []).map((moon) => ({
    ...moon,
    id: moon.name.toLowerCase(),
    type: 'moon',
    parentPlanet: planet.name,
    info: `Natural satellite of ${planet.name}.`,
  }))
)

export const ALL_PHYSICAL = [
  { id: 'sun', name: 'Sun', radiusKm: 696340, massKg: 1.989e30, orbitKm: 0, tilt: 0, rotationPeriodDays: 25.4, orbitPeriodDays: 0, texture: TEXTURES.sun, info: 'G-type main-sequence star; gravitational anchor of the system.' },
  ...PLANETS,
  ...ALL_MOONS,
]
export const ALL_OBJECTS = [...ALL_PHYSICAL, ...cosmicData.map((o) => ({ ...o, orbitKm: 0, radiusKm: 0 }))]

export const SUN = {
  name: 'Sun',
  radiusKm: 696_340,
  massKg: 1.989e30,
  info: 'G-type main-sequence star; gravitational anchor of the system.',
}

/** Visual radius: readable but monotonic, so larger worlds always render larger. */
export function planetDisplayRadius(radiusKm) {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return 0.08
  return Math.max(0.045, Math.sqrt(radiusKm / EARTH_RADIUS_KM) * 0.18)
}

export function moonDisplayRadius(radiusKm, parentRadius = 1) {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return 0.015
  return Math.min(parentRadius * 0.35, Math.max(0.014, Math.sqrt(radiusKm / EARTH_RADIUS_KM) * 0.065))
}

export function planetOrbitRadius(orbitKm) {
  return toUnits(orbitKm)
}

export function moonOrbitDisplayRadius(orbitKm, parentRadius) {
  const realOrbit = toUnits(orbitKm)
  return parentRadius + Math.max(realOrbit, parentRadius * 1.25)
}

export function ringDisplayRadii(ring, planetRadius) {
  const outerRatio = ring.outerKm / ring.innerKm
  const inner = planetRadius * 1.18
  return { inner, outer: inner * outerRatio }
}
