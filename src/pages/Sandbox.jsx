import { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SimulationCanvas, SimClock } from '../components/simulation/SimulationCanvas'
import { SandboxUniverse, VelocityArrow } from '../components/simulation/SandboxUniverse'
import { Starfield } from '../components/simulation/Starfield'
import { TrajectoryPath } from '../components/simulation/TrajectoryRenderer'
import { ScaleControl, TimeControl, SearchControl } from '../components/controls/ViewControls'
import { AddObjectPanel, ObjectListPanel } from '../components/controls/AddObjectPanel'
import { TravelStatistics } from '../components/controls/TravelStatistics'
import { stepNBody, formatSimTime } from '../physics/gravity'

export default function Sandbox() {
  const [viewScale, setViewScale] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [timeScale, setTimeScale] = useState(86400)
  const [simTime, setSimTime] = useState(0)
  const [bodies, setBodies] = useState([])
  const bodiesRef = useRef([])
  const lastUiUpdateTime = useRef(0)
  const [selectedId, setSelectedId] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(true)
  const [trajectoryData, setTrajectoryData] = useState(null)
  const focusCounter = useRef(0)
  const [focusRequest, setFocusRequest] = useState(null)

  const handlePhysicsStep = useCallback((dt) => {
    setSimTime((t) => t + dt)
    const next = stepNBody(bodiesRef.current, dt, 1)
    bodiesRef.current = next

    // Check for collisions and remove destroyed bodies
    if (next.destroyedObjects && next.destroyedObjects.length > 0) {
      next.destroyedObjects.forEach(destroyedObj => {
        if (selectedId === destroyedObj.id) setSelectedId(null)
      })
    }

    // Throttle UI update to ~10 FPS (100ms)
    const now = performance.now()
    if (now - lastUiUpdateTime.current > 100) {
      setBodies([...next])
      lastUiUpdateTime.current = now
    }
  }, [selectedId])

  const focusOnBody = useCallback((body) => {
    if (!body?.position?.every(Number.isFinite)) return
    focusCounter.current += 1
    setFocusRequest({
      id: `${body.id}-${focusCounter.current}`,
      position: body.position,
      visualRadius: Math.max(0.5, (body.radiusKm || 6371) / 1e6 * 120),
    })
  }, [])

  const handleAdd = (obj) => {
    bodiesRef.current = [...bodiesRef.current, obj]
    setBodies([...bodiesRef.current])
    setSelectedId(obj.id)
    focusOnBody(obj)
  }

  const handleRemove = (id) => {
    bodiesRef.current = bodiesRef.current.filter((x) => x.id !== id)
    setBodies([...bodiesRef.current])
    if (selectedId === id) setSelectedId(null)
  }

  const handleSearchQuery = useCallback((query) => {
    const q = query.trim().toLowerCase()
    const match = bodiesRef.current.find((b) => b.name.toLowerCase().includes(q))
    if (match) {
      setSelectedId(match.id)
      focusOnBody(match)
      return true
    }
    return false
  }, [focusOnBody])

  const selected = bodies.find((b) => b.id === selectedId)

  return (
    <div className="relative w-full h-full">
      <SimulationCanvas viewScale={viewScale} onViewScaleChange={setViewScale} focusRequest={focusRequest}>
        <Starfield />
        <SimClock playing={playing} timeScale={timeScale} onTimeUpdate={handlePhysicsStep}>
          <SandboxUniverse
            bodiesRef={bodiesRef}
            onSelectBody={(id) => {
              setSelectedId(id)
              const b = bodiesRef.current.find((x) => x.id === id)
              if (b) focusOnBody(b)
            }}
            selectedId={selectedId}
            showGrid
          />
          {selected && !selected.fixed && <VelocityArrow body={{ ...selected, position: selected.position.map((p) => p) }} />}
          <TrajectoryPath dots={trajectoryData?.dots} />
        </SimClock>
      </SimulationCanvas>

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
        <Link to="/" className="font-display text-[10px] tracking-[0.3em] uppercase text-slate-500 hover:text-cosmic-violet transition-colors">
          ← Command
        </Link>
        <h1 className="font-display text-xs tracking-[0.35em] uppercase text-white/80">Empty Universe</h1>
        <span className="font-mono text-[10px] text-cosmic-violet/60">SIM</span>
      </div>

      <div className="absolute top-16 left-4 z-20 w-80 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar space-y-3">
        <div className="glass-panel p-3 space-y-3">
          <ScaleControl value={viewScale} onChange={setViewScale} min={0.01} max={100} step={0.1} />
          <TimeControl
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
            timeScale={timeScale}
            onTimeScaleChange={(ts) => { setTimeScale(ts); if (ts === 0) setPlaying(false) }}
            simTime={simTime}
            onResetTime={() => { setSimTime(0); bodiesRef.current = []; setBodies([]); setTrajectoryData(null); setSelectedId(null) }}
            formatTime={formatSimTime}
          />
          <SearchControl onSearch={handleSearchQuery} highlightName={selected?.name} />
        </div>
        <ObjectListPanel
          bodies={bodies}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onFocus={focusOnBody}
          onRemove={handleRemove}
        />
      </div>
      <div className="absolute top-16 right-4 z-20 w-80 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar space-y-3">
        <button
          type="button"
          onClick={() => setShowAddPanel((prev) => !prev)}
          className="glass-panel w-full px-4 py-2 font-display text-xs tracking-widest uppercase text-cosmic-violet hover:border-cosmic-violet"
        >
          {showAddPanel ? '− Close Create' : '+ Create Object'}
        </button>
        {showAddPanel && (
          <AddObjectPanel
            onAdd={handleAdd}
            onClose={() => setShowAddPanel(false)}
            isOpen={showAddPanel}
            existingBodies={bodies}
          />
        )}
        <TravelStatistics
          onCalculate={setTrajectoryData}
          onClear={() => setTrajectoryData(null)}
          objects={bodies}
          simTime={simTime}
          activeStats={trajectoryData?.stats}
        />
      </div>

      {selected && (
        <div className="absolute top-16 z-20 w-72 glass-panel p-4" style={{ right: '22rem' }}>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="absolute top-2 right-3 text-slate-500 hover:text-white text-lg"
          >
            ×
          </button>
          <h3 className="font-display text-sm tracking-wider uppercase text-cosmic-cyan mb-2 pr-6">
            {selected.name}
          </h3>
          <div className="space-y-1 font-mono text-[10px] text-slate-400">
             <p>Mass: {selected.mass?.toExponential(2)} kg</p>
             <p>Pos: [{selected.position.map((p) => p.toFixed(1)).join(', ')}] ×10⁶ km</p>
             <p>Vel: [{selected.velocity.map((v) => v.toFixed(0)).join(', ')}] m/s</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center">
        <div className="glass-panel px-4 py-2 flex items-center gap-6 font-mono text-[10px] text-slate-500">
          <span>Bodies: {bodies.length}</span>
          <span className="text-cosmic-border">|</span>
          <span>View: {viewScale.toFixed(2)}×</span>
          <span className="text-cosmic-border">|</span>
          <span>Sim: {formatSimTime(simTime)} @ {timeScale === 0 ? 'OFF' : timeScale >= 86400 ? `${(timeScale / 86400).toFixed(0)}d/s` : `${timeScale}×`}</span>
          {trajectoryData && (
            <>
              <span className="text-cosmic-border">|</span>
              <button type="button" onClick={() => setTrajectoryData(null)} className="text-cosmic-cyan hover:text-white">Clear Trajectory ×</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
