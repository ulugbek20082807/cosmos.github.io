import { useState, useCallback, useEffect } from 'react'

export function ScaleControl({ value, onChange, min = 0.01, max = 100, step = 0.1 }) {
  const [inputVal, setInputVal] = useState(String(value))

  useEffect(() => {
    setInputVal(String(value))
  }, [value])

  const syncInput = useCallback(
    (v) => {
      const clamped = Math.min(max, Math.max(min, v))
      onChange(Number(clamped.toFixed(4)))
      setInputVal(String(Number(clamped.toFixed(4))))
    },
    [min, max, onChange],
  )

  const applyValue = useCallback(
    (raw) => {
      const parsed = parseFloat(raw)
      if (Number.isNaN(parsed) || parsed < min || parsed > max) {
        syncInput(value || 1)
      } else {
        syncInput(parsed)
      }
    },
    [min, max, syncInput, value],
  )

  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">View Scale</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => syncInput(value - step)}
          className="w-8 h-8 glass-panel text-cosmic-cyan hover:bg-cosmic-accent/10 transition-colors font-mono text-lg leading-none"
        >
          −
        </button>
        <input
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={() => applyValue(inputVal)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              applyValue(inputVal)
              e.target.blur()
            }
          }}
          className="flex-1 h-8 bg-black/40 border border-cosmic-border text-center font-mono text-sm text-white focus:outline-none focus:border-cosmic-accent"
          min={min}
          max={max}
          step={step}
        />
        <button
          type="button"
          onClick={() => syncInput(value + step)}
          className="w-8 h-8 glass-panel text-cosmic-cyan hover:bg-cosmic-accent/10 transition-colors font-mono text-lg leading-none"
        >
          +
        </button>
      </div>
      <p className="text-[9px] text-slate-500 font-mono">1 unit = 1,000,000 km · scale {value}×</p>
    </div>
  )
}

export function TimeControl({
  playing,
  onTogglePlay,
  timeScale,
  onTimeScaleChange,
  simTime,
  onResetTime,
  formatTime,
  presets = [0, 1, 60, 3600, 86400, 2592000, 31536000, 3153600000],
  formatPreset = (p) => {
    if (p === 0) return 'OFF'
    if (p === 1) return '1 sec/s'
    if (p === 60) return '1 min/s'
    if (p === 3600) return '1 hr/s'
    if (p === 86400) return '1 day/s'
    if (p === 2592000) return '1 mo/s'
    if (p === 31536000) return '1 yr/s'
    if (p === 3153600000) return '1 cent/s'
    return `${p}×`
  },
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">Simulation Time</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="px-3 h-8 glass-panel text-xs font-mono uppercase tracking-wider hover:border-cosmic-accent transition-colors"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={onResetTime}
          className="px-3 h-8 glass-panel text-xs font-mono uppercase tracking-wider hover:border-cosmic-accent transition-colors text-slate-400"
        >
          Reset
        </button>
        <span className="font-mono text-sm text-cosmic-cyan ml-auto">{formatTime(simTime)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onTimeScaleChange(p)}
            className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${
              timeScale === p
                ? 'border-cosmic-accent bg-cosmic-accent/15 text-cosmic-cyan'
                : 'border-cosmic-border text-slate-500 hover:text-slate-300'
            }`}
          >
            {formatPreset(p)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SearchControl({ onSearch, highlightName }) {
  const [query, setQuery] = useState('')
  const [notFound, setNotFound] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    const found = onSearch(query)
    setNotFound(!found)
  }

  return (
    <form onSubmit={handleSearch} className="space-y-1">
      <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">Object Search</label>
      <div className="flex gap-1 min-w-0">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setNotFound(false) }}
          placeholder="Sun, Mars, Andromeda..."
          className="flex-1 min-w-0 h-8 px-2 bg-black/40 border border-cosmic-border text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cosmic-accent"
        />
        <button
          type="submit"
          className="px-2 h-8 glass-panel text-[10px] font-mono uppercase tracking-wider hover:border-cosmic-accent whitespace-nowrap"
        >
          Go
        </button>
      </div>
      {highlightName && (
        <p className="text-[9px] text-cosmic-cyan font-mono">Tracking: {highlightName}</p>
      )}
      {notFound && query.trim() && (
        <p className="text-[9px] text-amber-400 font-mono">No match for &quot;{query}&quot;</p>
      )}
    </form>
  )
}
