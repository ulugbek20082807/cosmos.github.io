import React, { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import { SimulationCanvas, SimClock } from '../components/simulation/SimulationCanvas'
import { SolarSystem, getSolarObjectPosition, getSolarObjectRadius } from '../components/simulation/SolarSystem'
import { CosmicMarkers, SearchMarker, getCosmicDisplayPosition, getCosmicVisualRadius } from '../components/simulation/CosmicMarkers'
import { Starfield } from '../components/simulation/Starfield'
import { TrajectoryPath } from '../components/simulation/TrajectoryRenderer'
import { SandboxUniverse, VelocityArrow } from '../components/simulation/SandboxUniverse'
import { ScaleControl, TimeControl, SearchControl } from '../components/controls/ViewControls'
import { AddObjectPanel, ObjectListPanel } from '../components/controls/AddObjectPanel'
import { TravelStatistics } from '../components/controls/TravelStatistics'
import { PLANETS, moonDisplayRadius, moonOrbitDisplayRadius } from '../data/solarSystemData'
import { CATALOG_COSMIC, CATALOG_ALL, findCatalogEntry, searchCatalog, isSolarEntry } from '../data/catalog'
import { formatSimTime, stepNBody, initializeSolarSystemBodies, getMoonWorldPos } from '../physics/gravity'
import { getMoonOrbitFrame } from '../utils/orbitMath'

const INITIAL_BODIES = initializeSolarSystemBodies(PLANETS)

function getVisualRadius(entry) {
  if (!entry) return 5
  if (entry.category === 'custom') return Math.max(0.5, (entry.radiusKm || 6371) / 1e6 * 120)
  if (isSolarEntry(entry)) {
    if (entry.type === 'moon') {
      const parentPlanet = PLANETS.find(p => p.name === entry.parentPlanet)
      const parentR = parentPlanet ? getSolarObjectRadius(parentPlanet.id, parentPlanet.radiusKm) : 0.18
      return moonDisplayRadius(entry.radiusKm, parentR)
    }
    return getSolarObjectRadius(entry.id, entry.radiusKm)
  }
  return getCosmicVisualRadius(entry)
}

function getEntryPosition(entry, planetStates, simTime, bodies = []) {
  if (!entry) return [0, 0, 0]
  if (entry.category === 'custom') {
    const liveBody = bodies.find((b) => b.id === entry.id)
    if (liveBody && liveBody.position) return liveBody.position
  }
  if (entry.position && Array.isArray(entry.position)) return entry.position
  if (isSolarEntry(entry)) {
    if (entry.type === 'moon') {
      const parentPlanet = PLANETS.find(p => p.name === entry.parentPlanet)
      if (parentPlanet) {
        const parentPos = getSolarObjectPosition(parentPlanet.id, planetStates, parentPlanet.orbitKm)
        // Ensure accurate rendering position!
        const parentR = getSolarObjectRadius(parentPlanet.id, parentPlanet.radiusKm)
        const moonOrbit = moonOrbitDisplayRadius(entry.orbitKm, parentR)
        
        const frame = getMoonOrbitFrame(entry, moonOrbit, simTime)
        
        return [
           parentPos[0] + frame.worldVec.x,
           parentPos[1] + frame.worldVec.y,
           parentPos[2] + frame.worldVec.z,
        ]
      }
    }
    return getSolarObjectPosition(entry.id, planetStates, entry.orbitKm)
  }
  if (entry.ra != null) return getCosmicDisplayPosition(entry)
  return [0, 0, 0]
}

export default function RealCosmos() {
  const [viewScale, setViewScale] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [timeScale, setTimeScale] = useState(86400)
  // Physics engine refs (Zero-lag 60fps)
  const simTimeRef = useRef(0)
  const bodiesRef = useRef(INITIAL_BODIES)
  const planetStatesRef = useRef({})
  
  // UI Throttled state
  const [uiSimTime, setUiSimTime] = useState(0)
  const [uiBodies, setUiBodies] = useState(INITIAL_BODIES)
  const lastUiUpdateTime = useRef(0)
  
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [searchMarkerPos, setSearchMarkerPos] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [trajectoryData, setTrajectoryData] = useState(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth > 768)
  const [rightPanelOpen, setRightPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth > 768)
  const focusCounter = useRef(0)
  const [focusRequest, setFocusRequest] = useState(null)
  const trackedTargetRef = useRef(null)
  
  
  const [collisionWarning, setCollisionWarning] = useState(null)

  const simActive = playing && timeScale > 0

  // Initialize planetStatesRef mapping once
  if (Object.keys(planetStatesRef.current).length === 0) {
    bodiesRef.current.forEach((b) => {
      if (b.isPlanet) planetStatesRef.current[b.id] = { position: b.position, velocity: b.velocity }
    })
  }

  const customBodies = useMemo(() => uiBodies.filter((b) => !b.isPlanet && !b.isSystem), [uiBodies])

  const handleTimeUpdate = useCallback((dt) => {
    simTimeRef.current += dt
      
    const nextBodies = stepNBody(bodiesRef.current, dt, 1)
    bodiesRef.current = nextBodies
    
    nextBodies.forEach((b) => {
      if (b.isPlanet && planetStatesRef.current[b.id]) {
        planetStatesRef.current[b.id].position = b.position
        planetStatesRef.current[b.id].velocity = b.velocity
      }
    })
        
    // Check for collisions (UI state is fine for this)
    if (nextBodies.destroyedObjects && nextBodies.destroyedObjects.length > 0) {
      nextBodies.destroyedObjects.forEach(destroyedObj => {
        setCollisionWarning(`⚠️ Crash Detected! ${destroyedObj.name} crashed into ${destroyedObj.destroyedBy}.`)
        setTimeout(() => setCollisionWarning(null), 8000)
        if (selectedEntry?.id === destroyedObj.id) {
          setSelectedEntry(null)
          trackedTargetRef.current = null
        }
      })
    }
    
    if (selectedEntry) {
      const pos = getEntryPosition(selectedEntry, planetStatesRef.current, simTimeRef.current, bodiesRef.current)
      if (pos) trackedTargetRef.current = pos
    }
    
    // Throttle UI updates to 10 FPS (100ms) to avoid React render lag
    const now = performance.now()
    if (now - lastUiUpdateTime.current > 100) {
      setUiSimTime(simTimeRef.current)
      setUiBodies([...nextBodies])
      lastUiUpdateTime.current = now
    }
  }, [selectedEntry])

  const handleSearchResult = (entry) => {
    selectEntry(entry)
    const pos = getEntryPosition(entry, planetStates, simTime, bodies)
    if (pos) {
      setSearchMarkerPos({ position: pos, radius: getVisualRadius(entry) })
      setTimeout(() => setSearchMarkerPos(null), 3000)
    }
  }

  const focusOnEntry = useCallback((entry) => {
    if (!entry) return
    const position = getEntryPosition(entry, planetStatesRef.current, simTimeRef.current, bodiesRef.current)
    if (!position.every(Number.isFinite)) return
    focusCounter.current += 1
    setFocusRequest({
      id: `${entry.id}-${focusCounter.current}`,
      position,
      visualRadius: getVisualRadius(entry),
    })
    setSearchMarkerPos(isSolarEntry(entry) ? null : { position, radius: getVisualRadius(entry) })
  }, [])

  const selectEntry = useCallback((entry) => {
    if (!entry) {
      setSelectedEntry(null)
      trackedTargetRef.current = null
      return
    }
    setSelectedEntry(entry)
    focusOnEntry(entry)
    const pos = getEntryPosition(entry, planetStatesRef.current, simTimeRef.current, bodiesRef.current)
    if (pos) trackedTargetRef.current = pos
  }, [focusOnEntry])

  const handleSearchQuery = useCallback((query) => {
    const match = searchCatalog(query)
    if (match) {
      selectEntry(match)
      return true
    }
    return false
  }, [selectEntry])

  const handleAdd = useCallback((obj) => {
    bodiesRef.current.push(obj)
    setUiBodies([...bodiesRef.current])
    const newEntry = { ...obj, category: 'custom' }
    setSelectedEntry(newEntry)
    setShowAddPanel(false)
    focusCounter.current += 1
    setFocusRequest({
      id: `custom-${obj.id}-${focusCounter.current}`,
      position: obj.position,
      visualRadius: getVisualRadius(newEntry),
    })
  }, [])

  const handleCloseInfo = () => {
    setSelectedEntry(null)
    setSearchMarkerPos(null)
  }

  const handleRemoveBody = useCallback((id) => {
    bodiesRef.current = bodiesRef.current.filter((x) => x.id !== id)
    setUiBodies([...bodiesRef.current])
    if (selectedEntry?.id === id) setSelectedEntry(null)
  }, [selectedEntry])

  const handleCalculateTrajectory = useCallback((data) => {
    setTrajectoryData(data)
    if (data?.dots?.length > 1) {
      const startPos = data.dots[0]
      const endPos = data.dots[data.dots.length - 1]
      const midPoint = [
        (startPos[0] + endPos[0]) / 2,
        (startPos[1] + endPos[1]) / 2,
        (startPos[2] + endPos[2]) / 2,
      ]
      const distUnits = Math.hypot(
        endPos[0] - startPos[0],
        endPos[1] - startPos[1],
        endPos[2] - startPos[2]
      )
      focusCounter.current += 1
      setFocusRequest({
        id: `trajectory-${focusCounter.current}`,
        position: midPoint,
        visualRadius: Math.max(0.1, distUnits / 5),
      })
    }
  }, [])

  const handleClearTrajectory = useCallback(() => {
    setTrajectoryData(null)
  }, [])

  const handleResetTime = useCallback(() => {
    simTimeRef.current = 0
    bodiesRef.current = initializeSolarSystemBodies(PLANETS)
    setUiSimTime(0)
    setUiBodies(bodiesRef.current)
    setTrajectoryData(null)
  }, [])

  const catalogListItems = useMemo(
    () => CATALOG_ALL.map((o) => ({
      id: o.id,
      name: o.name,
      color: o.color || (isSolarEntry(o) ? '#fbbf24' : '#60a5fa'),
    })),
    [],
  )

  const travelObjects = useMemo(
    () => [...CATALOG_ALL, ...customBodies.map((b) => ({ ...b, category: 'custom' }))],
    [customBodies],
  )

  const selectedId = selectedEntry?.category === 'custom' ? null : selectedEntry?.id
  const customSelected = selectedEntry?.category === 'custom' ? selectedEntry : null
  const isSolarSelected = selectedEntry && isSolarEntry(selectedEntry)
  const isCosmicSelected = selectedEntry && selectedEntry.category === 'cosmic'

  const handlePlanetSelect = useCallback((planet) => {
    // Moons pass their real-time world position from getWorldPosition()
    if (planet.type === 'moon' && planet.position) {
      const moonEntry = { ...planet, category: 'solar' }
      setSelectedEntry(moonEntry)
      focusCounter.current += 1
      const vr = getVisualRadius(moonEntry)
      setFocusRequest({
        id: `${planet.id}-${focusCounter.current}`,
        position: planet.position,
        visualRadius: vr,
      })
      setSearchMarkerPos(null)
      return
    }
    const entry = findCatalogEntry(planet.id) || planet
    selectEntry(entry)
  }, [selectEntry])

  return (
    <div className="relative w-full h-full">
      <SimulationCanvas
        viewScale={viewScale}
        onViewScaleChange={setViewScale}
        focusRequest={focusRequest}
        trackedTargetRef={trackedTargetRef}
        trackedObjectId={selectedEntry?.id}
      >
        <React.Suspense fallback={null}>
        <Starfield />
        <SimClock playing={playing} timeScale={timeScale} onTimeUpdate={handleTimeUpdate}>
          <SolarSystem
            planets={PLANETS}
            planetStatesRef={planetStatesRef}
            onSelectPlanet={handlePlanetSelect}
            selectedId={selectedId}
            simActive={simActive}
            simTimeRef={simTimeRef}
          />
          <CosmicMarkers
            objects={CATALOG_COSMIC}
            onSelect={selectEntry}
          />
          <SearchMarker position={searchMarkerPos?.position} radius={searchMarkerPos?.radius || 1} />
          <SandboxUniverse
            bodiesRef={bodiesRef}
            onSelectBody={(id) => {
              const b = customBodies.find((x) => x.id === id)
              if (b) selectEntry({ ...b, category: 'custom' })
            }}
            selectedId={customSelected?.id}
          />
          {customSelected && !customSelected.fixed && (
            <VelocityArrow body={{ ...customSelected, position: customSelected.position.map((p) => p) }} />
          )}
          <TrajectoryPath dots={trajectoryData?.dots} />
        </SimClock>
        </React.Suspense>
      </SimulationCanvas>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
        <Link to="/" className="font-display text-[10px] tracking-[0.3em] uppercase text-slate-500 hover:text-cosmic-cyan transition-colors">
          ← Command
        </Link>
        <h1 className="font-display text-xs tracking-[0.35em] uppercase text-white/80">Real Cosmos</h1>
        <span className="font-mono text-[10px] text-cosmic-accent/60">LIVE</span>
      </div>

      {/* Left panel */}
      {leftPanelOpen && (
        <div className="absolute top-16 left-4 z-20 w-[calc(100vw-2rem)] md:w-80 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar space-y-3 pb-20 md:pb-0">
          <div className="glass-panel p-3 space-y-3">
            <ScaleControl value={viewScale} onChange={setViewScale} min={0.05} max={50} step={0.05} />
            <TimeControl
              playing={playing}
              onTogglePlay={() => setPlaying((p) => !p)}
              timeScale={timeScale}
              onTimeScaleChange={(ts) => {
                setTimeScale(ts)
                if (ts === 0) setPlaying(false)
              }}
              simTime={uiSimTime}
              onResetTime={handleResetTime}
              formatTime={(t) => formatSimTime(t)}
            />
            <SearchControl
              onSearch={handleSearchQuery}
              highlightName={selectedEntry?.name}
            />
          </div>

          <ObjectListPanel
            bodies={catalogListItems}
            selectedId={selectedEntry?.id}
            onSelect={(id) => {
              const entry = findCatalogEntry(id)
              if (entry) selectEntry(entry)
            }}
            onFocus={(item) => {
              const entry = findCatalogEntry(item.id)
              if (entry) focusOnEntry(entry)
            }}
            title="Cosmic Catalog"
          />

          {customBodies.length > 0 && (
            <ObjectListPanel
              bodies={customBodies}
              selectedId={customSelected?.id}
              onSelect={(id) => {
                const b = customBodies.find((x) => x.id === id)
                if (b) selectEntry({ ...b, category: 'custom' })
              }}
              onFocus={(b) => focusOnEntry({ ...b, category: 'custom' })}
              onRemove={handleRemoveBody}
              title="Created Objects"
            />
          )}
        </div>
      )}

      {/* Left Panel Toggle */}
      <button 
        type="button" 
        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        className={`absolute top-1/2 -translate-y-1/2 z-20 glass-panel flex items-center justify-center w-6 h-12 text-slate-400 hover:text-white transition-all ${leftPanelOpen ? 'left-[calc(100vw-1.5rem)] md:left-[21rem]' : 'left-0'}`}
        aria-label="Toggle Left Panel"
      >
        {leftPanelOpen ? '◀' : '▶'}
      </button>

      {/* Right panel */}
      {rightPanelOpen && (
        <div className="absolute top-16 right-4 z-20 w-[calc(100vw-2rem)] md:w-80 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar space-y-3 pb-20 md:pb-0">
          <button
            type="button"
            onClick={() => setShowAddPanel((prev) => !prev)}
            className="glass-panel w-full px-4 py-2 font-display text-xs tracking-widest uppercase text-cosmic-cyan hover:border-cosmic-accent"
          >
            {showAddPanel ? '− Close Create' : '+ Create Object'}
          </button>
          {showAddPanel && (
            <AddObjectPanel
              onAdd={handleAdd}
              onClose={() => setShowAddPanel(false)}
              isOpen={showAddPanel}
              existingBodies={[...uiBodies, ...PLANETS.map((p) => ({
                ...p,
                type: 'planet',
                position: planetStatesRef.current[p.id]?.position || [p.orbitKm / 1e6, 0, 0],
              }))]}
            />
          )}
          <TravelStatistics
            onCalculate={handleCalculateTrajectory}
            onClear={handleClearTrajectory}
            objects={travelObjects}
            simTime={uiSimTime}
            planetStates={planetStatesRef.current}
            activeStats={trajectoryData?.stats}
          />
        </div>
      )}

      {/* Right Panel Toggle */}
      <button 
        type="button" 
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        className={`absolute top-1/2 -translate-y-1/2 z-20 glass-panel flex items-center justify-center w-6 h-12 text-slate-400 hover:text-white transition-all ${rightPanelOpen ? 'right-[calc(100vw-1.5rem)] md:right-[21rem]' : 'right-0'}`}
        aria-label="Toggle Right Panel"
      >
        {rightPanelOpen ? '▶' : '◀'}
      </button>

      {/* Info panel — shown on select */}
      {selectedEntry && (
        <div className="absolute top-4 left-4 right-4 md:top-16 md:left-auto md:right-[22rem] z-30 md:w-72 glass-panel p-4 shadow-2xl bg-black/60 backdrop-blur-xl border border-cosmic-cyan/30">
          <button
            type="button"
            onClick={handleCloseInfo}
            className="absolute top-2 right-3 text-slate-500 hover:text-white text-lg"
          >
            ×
          </button>
          <h3 className="font-display text-sm tracking-wider uppercase text-cosmic-cyan mb-2 pr-6">
            {selectedEntry.name}
          </h3>
          {isSolarSelected && (
            <div className="space-y-1 font-mono text-[10px] text-slate-400">
              {selectedEntry.radiusKm && <p>Radius: {selectedEntry.radiusKm.toLocaleString()} km</p>}
              {selectedEntry.orbitKm > 0 && <p>Orbit: {(selectedEntry.orbitKm / 1e6).toFixed(2)}×10⁶ km</p>}
              {selectedEntry.tilt != null && <p>Axial tilt: {selectedEntry.tilt}°</p>}
              {selectedEntry.gravityG != null && <p>Surface Gravity: {selectedEntry.gravityG.toFixed(2)} g</p>}
              {selectedEntry.info && <p className="text-slate-500 mt-2 leading-relaxed">{selectedEntry.info}</p>}
            </div>
          )}
          {isCosmicSelected && (
            <div className="space-y-1 font-mono text-[10px] text-slate-400">
              <p>Type: {selectedEntry.type}</p>
              <p>Distance: {selectedEntry.distanceLy.toLocaleString()} ly</p>
              <p>RA: {selectedEntry.ra}° · Dec: {selectedEntry.dec}°</p>
              <p className="text-slate-500 mt-2 leading-relaxed">{selectedEntry.info}</p>
            </div>
          )}
          {customSelected && (
            <div className="space-y-1 font-mono text-[10px] text-slate-400">
              <p>Mass: {customSelected.mass?.toExponential(2)} kg</p>
              <p>Pos: [{customSelected.position.map((p) => p.toFixed(1)).join(', ')}] ×10⁶ km</p>
              <p>Vel: [{customSelected.velocity.map((v) => v.toFixed(0)).join(', ')}] m/s</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom HUD */}
      <div className="absolute bottom-4 left-2 right-2 md:left-4 md:right-4 z-20 flex justify-center pointer-events-none">
        <div className="glass-panel px-2 py-2 md:px-4 flex flex-wrap justify-center items-center gap-2 md:gap-6 font-mono text-[8px] md:text-[10px] text-slate-500 pointer-events-auto">
          <span>Catalog: {CATALOG_ALL.length + customBodies.length} objects</span>
          <span className="text-cosmic-border">|</span>
          <span>View: {viewScale.toFixed(2)}×</span>
          <span className="text-cosmic-border">|</span>
          <span>Time: {formatSimTime(uiSimTime)} @ {timeScale === 0 ? 'OFF' : timeScale >= 86400 ? `${(timeScale / 86400).toFixed(0)}d/s` : `${timeScale}×`}</span>
          {trajectoryData && (
            <>
              <span className="text-cosmic-border">|</span>
              <button type="button" onClick={handleClearTrajectory} className="text-cosmic-cyan hover:text-white">
                Clear Trajectory ×
              </button>
            </>
          )}
        </div>
      </div>
      {/* Collision Warning */}
      {collisionWarning && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-lg shadow-red-500/20 z-50 animate-fade-in-out">
          <span className="text-xl">💥</span>
          <span className="font-mono text-sm tracking-wide">{collisionWarning}</span>
        </div>
      )}
    </div>
  )
}
