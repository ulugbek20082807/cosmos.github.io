import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export const TEXTURES = {
  sun:        '/textures/nasa/sun.jpg',
  star:       '/textures/nasa/sun.jpg',
  mercury:    '/textures/nasa/mercury.jpg',
  venus:      '/textures/nasa/venus.jpg',
  earthDay:   '/textures/nasa/earth.jpg',
  moon:       '/textures/nasa/moon.jpg',
  mars:       '/textures/nasa/mars.jpg',
  jupiter:    '/textures/nasa/jupiter.jpg',
  saturn:     '/textures/nasa/saturn.jpg',
  saturnRing: '/textures/nasa/saturn_ring.png',
  uranus:     '/textures/nasa/uranus.jpg',
  uranusRing: '/textures/nasa/uranus_ring.png',
  neptune:    '/textures/nasa/neptune.jpg',
  pluto:      '/textures/nasa/pluto.jpg',
  io:         '/textures/nasa/io.jpg',
  europa:     '/textures/nasa/europa.jpg',
  ganymede:   '/textures/nasa/ganymede.jpg',
  callisto:   '/textures/nasa/callisto.jpg',

  // Saturn Moons
  mimas:      'https://upload.wikimedia.org/wikipedia/commons/5/5e/Mimas_Masked.jpg',
  enceladus:  'https://upload.wikimedia.org/wikipedia/commons/8/83/PIA17202_-_Approaching_Enceladus.jpg',
  tethys:     'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Tethys_-_Rev_15_%2837267740632%29.png/1280px-Tethys_-_Rev_15_%2837267740632%29.png',
  dione:      'https://upload.wikimedia.org/wikipedia/commons/4/42/Dione_in_natural_light.jpg',
  rhea:       'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/PIA07763_Rhea_full_globe5.jpg/1280px-PIA07763_Rhea_full_globe5.jpg',
  titan:      'https://upload.wikimedia.org/wikipedia/commons/f/fe/Titan_in_true_color_by_Kevin_M._Gill.jpg',
  iapetus:    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Iapetus_trailing_natural_color.jpg/1280px-Iapetus_trailing_natural_color.jpg',

  // Uranus Moons
  miranda:    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Miranda_mosaic_in_color_-_Voyager_2.png/1280px-Miranda_mosaic_in_color_-_Voyager_2.png',
  ariel:      'https://upload.wikimedia.org/wikipedia/commons/8/84/Ariel_in_monochrome.jpg',
  umbriel:    '/textures/nasa/moon.jpg', // Wikipedia thumbnail missing, using generic
  titania:    '/textures/nasa/titania.jpg',
  oberon:     '/textures/nasa/oberon.jpg',

  // Neptune Moons
  triton:     '/textures/nasa/triton.jpg',
  nereid:     '/textures/nasa/nereid.jpg',
}

export const REMOTE_TEXTURES = TEXTURES

/**
 * useSafeTexture now wraps @react-three/drei's useTexture which correctly 
 * integrates with R3F, handles suspense, and automatically assigns color spaces.
 */
export function useSafeTexture(url) {
  // If no url, we can't call useTexture because hooks can't be conditional.
  // In our app, the urls are static strings, so it's fine.
  // We provide a fallback just in case to avoid breaking hook rules.
  const tex = useTexture(url || '/textures/nasa/sun.jpg')
  
  // Set SRGB color space as required by modern Three.js for color maps
  if (tex && tex.colorSpace !== THREE.SRGBColorSpace) {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
  }
  
  // If the caller passed a falsy url, return null (even though we loaded the fallback)
  return url ? tex : null
}

export function useSafeTextureDirect(key) {
  return useSafeTexture(TEXTURES[key])
}
