import { useState, useEffect } from 'react'
import { trajectoryConstantVelocity, trajectoryConstantAcceleration } from '../../physics/gravity'
import { getCosmicDisplayPosition } from '../simulation/CosmicMarkers'
import { getSolarObjectPosition } from '../simulation/SolarSystem'
import { isSolarEntry } from '../../data/catalog'
import { raDecToVector } from '../simulation/Starfield'

function getTruePhysicalPositionMeters(obj, planetStates = null) {
  const METERS_PER_UNIT = 1_000_000 * 1000 // 1 unit = 1 million km = 1e9 meters
  if (planetStates && obj.id && planetStates[obj.id]) {
    return planetStates[obj.id].position.map((v) => v * METERS_PER_UNIT)
  }
  if (obj.position && Array.isArray(obj.position) && obj.position.every(Number.isFinite)) {
    return obj.position.map((v) => v * METERS_PER_UNIT)
  }
  if (isSolarEntry(obj)) {
    return getSolarObjectPosition(obj.id, planetStates, obj.orbitKm).map((v) => v * METERS_PER_UNIT)
  }
  if (obj.ra != null && obj.dec != null && obj.distanceLy != null) {
    const distM = obj.distanceLy * 9.461e15
    return raDecToVector(obj.ra, obj.dec, distM).toArray()
  }
  return [0, 0, 0]
}

function getWorldPos(obj, planetStates = null) {
  if (planetStates && obj.id && planetStates[obj.id]) {
    return planetStates[obj.id].position
  }
  if (obj.position && Array.isArray(obj.position) && obj.position.every(Number.isFinite)) {
    return obj.position
  }
  if (isSolarEntry(obj)) {
    return getSolarObjectPosition(obj.id, planetStates, obj.orbitKm)
  }
  if (obj.ra != null && obj.dec != null && obj.distanceLy != null) {
    return getCosmicDisplayPosition(obj)
  }
  return [0, 0, 0]
}

function formatDuration(seconds, detailed = false) {
  if (!Number.isFinite(seconds)) return '—'
  if (detailed && seconds > 0) {
    if (seconds < 60) return `${seconds.toFixed(6)} s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(6)} min`
    if (seconds < 86400) return `${(seconds / 3600).toFixed(6)} hr`
  }
  if (seconds < 60) return `${seconds.toFixed(1)} s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)} hr`
  if (seconds < 86400 * 365.25) return `${(seconds / 86400).toFixed(1)} days`
  return `${(seconds / (86400 * 365.25)).toFixed(2)} years`
}

export function TravelStatsOverlay({ stats, onClear }) {
  if (!stats) return null

  const isDetailed = stats.travelTimeObserver > 0 && stats.travelTimeObserver < 86400 * 365;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[min(520px,calc(100vw-2rem))]">
      <div className="glass-panel p-5 border border-cosmic-accent/40 shadow-2xl relative">
        <button
          type="button"
          onClick={onClear}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors text-lg"
          aria-label="Clear trajectory"
        >
          ×
        </button>
        <h3 className="font-display text-sm tracking-[0.25em] uppercase text-cosmic-cyan mb-1 pr-8">
          Journey Statistics
        </h3>
        {stats.startName && stats.endName && (
          <p className="font-mono text-[10px] text-slate-400 mb-4 uppercase tracking-wider">
            {stats.startName} → {stats.endName}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <StatBlock label="Distance" value={`${(stats.distanceAU ?? 0).toFixed(2)} AU`} sub={`${(stats.distanceLy ?? 0).toExponential(2)} ly`} />
          <StatBlock label="Observer Time" value={formatDuration(stats.travelTimeObserver, isDetailed)} highlight />
          <StatBlock label="Pilot Time" value={formatDuration(stats.travelTimePilot, isDetailed)} highlight />
          {stats.gamma != null && (
            <StatBlock label="Lorentz Factor γ" value={stats.gamma.toFixed(4)} />
          )}
          {stats.maxGamma != null && (
            <StatBlock label="Peak Lorentz γ" value={stats.maxGamma.toFixed(4)} />
          )}
          {stats.maxSpeedFraction != null && (
            <StatBlock label="Peak Speed" value={`${(stats.maxSpeedFraction * 100).toFixed(1)}% c`} />
          )}
          {stats.contractedDistanceLy != null && (
            <StatBlock label="Contracted Dist" value={`${stats.contractedDistanceAU ? stats.contractedDistanceAU.toFixed(2) : '0'} AU`} sub={`${stats.contractedDistanceLy.toExponential(2)} ly`} />
          )}
        </div>
        <p className="mt-3 text-[10px] font-mono text-slate-500">
          Relativistic effects shown. Dot spacing along the path reflects time dilation between pilot and observer frames.
        </p>
      </div>
    </div>
  )
}

function StatBlock({ label, value, sub, highlight }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1">{label}</p>
      <p className={`font-mono text-lg ${highlight ? 'text-cosmic-cyan' : 'text-white'}`}>{value}</p>
      {sub && <p className="font-mono text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

function TravelStatsPanel({ stats, onClear }) {
  const isDetailed = stats.travelTimeObserver > 0 && stats.travelTimeObserver < 86400 * 365;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-[0.2em] text-cosmic-cyan font-mono">Journey Statistics</h4>
        <button
          type="button"
          onClick={onClear}
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 border border-cosmic-border"
          aria-label="Clear trajectory"
        >
          x
        </button>
      </div>
      {stats.startName && stats.endName && (
        <p className="font-mono text-[10px] text-slate-400 mb-2 uppercase tracking-wider">
          {stats.startName} → {stats.endName}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <StatBlock label="Distance" value={`${(stats.distanceAU ?? 0).toFixed(2)} AU`} sub={`${(stats.distanceLy ?? 0).toExponential(2)} ly`} />
        <StatBlock label="Observer Time" value={formatDuration(stats.travelTimeObserver, isDetailed)} highlight />
        <StatBlock label="Pilot Time" value={formatDuration(stats.travelTimePilot, isDetailed)} highlight />
        {stats.gamma != null && (
          <StatBlock label="Lorentz Factor" value={stats.gamma.toFixed(4)} />
        )}
        {stats.maxGamma != null && (
          <StatBlock label="Peak Lorentz γ" value={stats.maxGamma.toFixed(4)} />
        )}
        {stats.maxSpeedFraction != null && (
          <StatBlock label="Peak Speed" value={`${(() => {
            const f = stats.maxSpeedFraction;
            if (f > 0.9999999) return '> 99.99999';
            if (f > 0.9999) return (f * 100).toFixed(4);
            if (f > 0.99) return (f * 100).toFixed(2);
            return (f * 100).toFixed(1);
          })()}% c`} />
        )}
        {stats.contractedDistanceLy != null && (
          <StatBlock label="Contracted Dist" value={`${stats.contractedDistanceM ? (stats.contractedDistanceM / 1.496e11).toFixed(2) : '0'} AU`} sub={`${stats.contractedDistanceLy.toExponential(2)} ly`} />
        )}
      </div>
      <p className="text-[10px] font-mono text-slate-500 leading-relaxed mt-2 border-t border-cosmic-border pt-2">
        Dots mark equal pilot-time samples; stretched spacing shows relativistic divergence. {stats.travelTimeObserver > 0 && (stats.travelTimeObserver - stats.travelTimePilot) > 0 && `(Dilation: ${formatDuration(stats.travelTimeObserver - stats.travelTimePilot, true)})`}
      </p>
    </div>
  )
}

export function TravelStatistics({
  onCalculate,
  onClear,
  objects,
  simTime = 0,
  planetStates = null,
  activeStats = null,
}) {
  const [startId, setStartId] = useState('sun')
  const [endId, setEndId] = useState('earth')
  const [mode, setMode] = useState('velocity')
  const [speedRaw, setSpeedRaw] = useState('')
  const [accelRaw, setAccelRaw] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (objects && objects.length > 0) {
      const startExists = objects.some((o) => o.id === startId)
      if (!startExists) {
        setStartId(objects[0].id)
      }
      const endExists = objects.some((o) => o.id === endId)
      if (!endExists) {
        setEndId(objects[1]?.id || objects[0].id)
      }
    } else {
      setStartId('')
      setEndId('')
    }
  }, [objects, startId, endId])

  const startObj = objects.find((o) => o.id === startId)
  const endObj = objects.find((o) => o.id === endId)

  const handleCalculate = () => {
    setError('')
    if (!startObj || !endObj) {
      setError('Select valid start and end objects.')
      return
    }
    if (startObj.id === endObj.id) {
      setError('Start and end must be different objects.')
      return
    }

    const startPos = getWorldPos(startObj, planetStates)
    const endPos = getWorldPos(endObj, planetStates)

    const startPhysM = getTruePhysicalPositionMeters(startObj, planetStates)
    const endPhysM = getTruePhysicalPositionMeters(endObj, planetStates)
    const trueDistanceM = Math.hypot(
      endPhysM[0] - startPhysM[0],
      endPhysM[1] - startPhysM[1],
      endPhysM[2] - startPhysM[2]
    )

    let result
    if (mode === 'velocity') {
      let speedFraction = parseFloat(speedRaw) / 100
      if (!Number.isFinite(speedFraction) || speedFraction <= 0 || speedFraction >= 1) {
        speedFraction = 0.1
        setSpeedRaw('10')
      }
      result = trajectoryConstantVelocity(startPos, endPos, speedFraction, 50, trueDistanceM)
    } else {
      const accelG = parseFloat(accelRaw) || 1
      if (!Number.isFinite(parseFloat(accelRaw)) || parseFloat(accelRaw) <= 0) {
        setAccelRaw(String(accelG))
      }
      result = trajectoryConstantAcceleration(startPos, endPos, accelG, 50, trueDistanceM)
    }
    
    result.startName = startObj.name
    result.endName = endObj.name

    onCalculate?.({ dots: result.dots, stats: result })
  }

  const handleClear = () => {
    setError('')
    onClear?.()
  }

  if (activeStats) {
    return (
      <div className="glass-panel p-3">
        <TravelStatsPanel stats={activeStats} onClear={handleClear} />
      </div>
    )
  }

  return (
    <div className="glass-panel p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-[0.2em] text-cosmic-cyan font-mono">Travel Calculator</h4>
        {activeStats && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-mono text-slate-400 hover:text-cosmic-cyan uppercase tracking-wider"
          >
            Clear Path ×
          </button>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-mono">Start Object</label>
        <select value={startId} onChange={(e) => setStartId(e.target.value)} className="field-input">
          {objects.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-mono">End Object</label>
        <select value={endId} onChange={(e) => setEndId(e.target.value)} className="field-input">
          {objects.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-mono">Travel Mode</label>
        <div className="flex gap-1">
          {[
            ['velocity', 'Constant Velocity'],
            ['acceleration', 'Constant Acceleration'],
          ].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 px-2 py-1 text-[10px] font-mono border transition-colors ${
                mode === m ? 'border-cosmic-accent bg-cosmic-accent/15 text-cosmic-cyan' : 'border-cosmic-border text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'velocity' ? (
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-mono">Speed (% of c)</label>
          <input
            type="text"
            inputMode="decimal"
            value={speedRaw}
            onChange={(e) => setSpeedRaw(e.target.value)}
            className="field-input"
            placeholder="10"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-mono">Acceleration (g)</label>
          <input
            type="text"
            inputMode="decimal"
            value={accelRaw}
            onChange={(e) => setAccelRaw(e.target.value)}
            className="field-input"
            placeholder="1"
          />
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

      <button
        type="button"
        onClick={handleCalculate}
        className="w-full py-1.5 font-display text-xs tracking-[0.2em] uppercase bg-gradient-to-r from-cosmic-accent/20 to-cosmic-violet/20 border border-cosmic-accent/50 hover:border-cosmic-accent transition-colors"
      >
        Calculate Trajectory
      </button>
    </div>
  )
}

export { formatDuration }
