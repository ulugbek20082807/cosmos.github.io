import { PLANETS, SUN, TEXTURES, ALL_MOONS } from './solarSystemData'
import cosmicData from './cosmicData.json'

/** Unified catalog: Sun + planets + deep-sky objects */
export const CATALOG_SOLAR = [
  {
    id: 'sun',
    name: 'Sun',
    category: 'solar',
    type: 'star',
    radiusKm: SUN.radiusKm,
    massKg: SUN.massKg,
    orbitKm: 0,
    texture: TEXTURES.sun,
    info: SUN.info,
  },
  ...PLANETS.map((p) => ({
    ...p,
    category: 'solar',
    type: 'planet',
  })),
  ...ALL_MOONS.map((m) => ({
    ...m,
    category: 'solar',
    type: 'moon',
  })),
]

export const CATALOG_COSMIC = cosmicData.map((o) => ({
  ...o,
  category: 'cosmic',
}))

export const CATALOG_ALL = [...CATALOG_SOLAR, ...CATALOG_COSMIC]

export function isSolarEntry(obj) {
  return obj?.category === 'solar' || obj?.id === 'sun' || PLANETS.some((p) => p.id === obj?.id)
}

export function findCatalogEntry(id) {
  return CATALOG_ALL.find((o) => o.id === id)
}

export function searchCatalog(query) {
  const q = query.trim().toLowerCase()
  if (!q) return null
  return CATALOG_ALL.find(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.type && o.type.toLowerCase().includes(q)),
  )
}
