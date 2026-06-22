import re

with open('src/components/simulation/SolarSystem.jsx', 'r') as f:
    content = f.read()

# 1. Update the signature of EarthShader and replace worldPos prop with planetId and planetStatesRef
content = content.replace("function EarthShader({ worldPos, simActive, simTime, tilt, moon, onSelect })", "function EarthShader({ planetId, orbitKm, planetStatesRef, simActive, simTimeRef, tilt, moon, onSelect })")
content = content.replace("worldPos={worldPos}", "planetId={planet.id} orbitKm={planet.orbitKm} planetStatesRef={planetStatesRef} simTimeRef={simTimeRef}")
content = content.replace("<group position={worldPos}>", "<group name={planetId} ref={groupRef}>")

# Add groupRef and useFrame logic to EarthShader
earth_use_frame_start = """  const groupRef = useRef()
  const r = planetDisplayRadius(6371)
  const moonR = moon ? moonDisplayRadius(moon.radiusKm, r) : 0
  const moonOrbit = moon ? moonOrbitDisplayRadius(moon.orbitKm, r) : 0

  useFrame((_, delta) => {
    if (groupRef.current) {
      const pos = planetStatesRef.current[planetId]?.position
      if (pos) {
        groupRef.current.position.set(pos[0], pos[1], pos[2])
      } else {
        const orbitR = planetOrbitRadius(orbitKm)
        groupRef.current.position.set(orbitR, 0, 0)
      }
    }
    if (meshRef.current && simActive) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.z = (tilt * Math.PI) / 180
    }
    if (moonRef.current && moon) {
      const frame = getMoonOrbitFrame(moon, moonOrbit, simTimeRef.current)
      moonRef.current.position.set(frame.worldVec.x, frame.worldVec.y, frame.worldVec.z)
    }
  })"""

# Replace the existing useFrame in EarthShader
content = re.sub(r"  const r = planetDisplayRadius\(6371\).*?\}\)\n  \}\)\n", earth_use_frame_start + "\n", content, flags=re.DOTALL)


# 2. Update PlanetMesh
content = content.replace("function PlanetMesh({ planet, worldPos, simActive, onSelect })", "function PlanetMesh({ planet, planetStatesRef, simActive, onSelect })")
content = content.replace("<PlanetMesh planet={planet} worldPos={worldPos} simActive={simActive} onSelect={onSelect} />", "<PlanetMesh planet={planet} planetStatesRef={planetStatesRef} simActive={simActive} onSelect={onSelect} />")
content = content.replace("function PlanetMesh(", "function PlanetMesh({ planet, planetStatesRef, simActive, onSelect }) {\n  const groupRef = useRef()")
content = re.sub(r"function PlanetMesh\(\{ planet, planetStatesRef, simActive, onSelect \}\) \{\n  const groupRef = useRef\(\)\n.*?\{ planet, planetStatesRef, simActive, onSelect \}\) \{", "function PlanetMesh({ planet, planetStatesRef, simActive, onSelect }) {", content, flags=re.DOTALL)
# wait, manual replace is safer. Let's just create a full new file.

