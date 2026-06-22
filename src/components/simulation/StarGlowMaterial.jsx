import { useMemo } from 'react'
import * as THREE from 'three'

export function StarGlowMaterial({ color, opacity = 1 }) {
  const shader = useMemo(() => ({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      opacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalMatrix * normal;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float opacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float intensity = max(0.0, dot(normal, viewDir));
        
        // Smoother falloff
        float falloff = smoothstep(0.0, 1.0, intensity);
        float alpha = pow(falloff, 3.0) * opacity;
        
        // Stronger dithering applied to both color and alpha to crush banding
        float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 finalColor = glowColor + (dither - 0.5) * 0.06;
        alpha += (dither - 0.5) * 0.04;
        alpha = max(0.0, alpha);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [color, opacity])

  return <shaderMaterial attach="material" args={[shader]} />
}
