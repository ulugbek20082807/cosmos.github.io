import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Vite injects BASE_URL from the `base` config (e.g. "/cosmos.github.io/")
const BASE = import.meta.env.BASE_URL

function tex(path) {
  // External URLs stay as-is; local paths get the base prefix
  if (path.startsWith('http')) return path
  // Avoid double slashes: BASE already ends with /
  return BASE + path.replace(/^\//, '')
}

export const TEXTURES = {
  sun:        tex('/textures/nasa/sun.jpg'),
  star:       tex('/textures/nasa/sun.jpg'),
  mercury:    tex('/textures/nasa/mercury.jpg'),
  venus:      tex('/textures/nasa/venus.jpg'),
  earthDay:   tex('/textures/nasa/earth.jpg'),
  moon:       tex('/textures/nasa/moon.jpg'),
  mars:       tex('/textures/nasa/mars.jpg'),
  jupiter:    tex('/textures/nasa/jupiter.jpg'),
  saturn:     tex('/textures/nasa/saturn.jpg'),
  saturnRing: tex('/textures/nasa/saturn_ring.png'),
  uranus:     tex('/textures/nasa/uranus.jpg'),
  uranusRing:  tex('/textures/nasa/uranus_ring.png'),
  neptune:    tex('/textures/nasa/neptune.jpg'),
  pluto:      tex('/textures/nasa/pluto.jpg'),
  io:         tex('/textures/nasa/io.jpg'),
  europa:     tex('/textures/nasa/europa.jpg'),
  ganymede:   tex('/textures/nasa/ganymede.jpg'),
  callisto:   tex('/textures/nasa/callisto.jpg'),

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
  umbriel:    tex('/textures/nasa/moon.jpg'), // Wikipedia thumbnail missing, using generic
  titania:    tex('/textures/nasa/titania.jpg'),
  oberon:     tex('/textures/nasa/oberon.jpg'),

  // Neptune Moons
  triton:     tex('/textures/nasa/triton.jpg'),
  nereid:     tex('/textures/nasa/nereid.jpg'),
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
  const tex = useTexture(url || TEXTURES.sun)
  
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

// Generates a soft glowing radial gradient for particles (galaxies, stars, nebulae)
let _particleTexture = null;
export function getParticleTexture() {
  if (_particleTexture) return _particleTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  _particleTexture = texture;
  return texture;
}
