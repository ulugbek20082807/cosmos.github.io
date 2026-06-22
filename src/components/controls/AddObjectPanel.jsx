import { useState } from 'react'
import { checkPositionCollision } from '../../physics/gravity'

const OBJECT_TYPES = ['star', 'planet', 'moon', 'asteroid', 'black_hole', 'comet', 'custom']
const TEXTURE_PRESETS = ['none', 'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'moon']

const defaultForm = {
  name: '',
  type: 'planet',
  massKg: '',
  radiusKm: '',
  position: ['', '', ''],
  velocity: ['', '', ''],
  color: '#4488cc',
  texturePreset: 'none',
  emissive: false,
  emissiveIntensity: 1.5,
  fixed: false,
}

function parseNum(raw, fallback = 0) {
  const v = parseFloat(raw)
  return Number.isFinite(v) ? v : fallback
}

function parseVec(rawArr, fallback = 0) {
  return rawArr.map((v) => {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : fallback
  })
}

export function AddObjectPanel({ onAdd, onClose, isOpen = true, existingBodies = [] }) {
  const [form, setForm] = useState({ ...defaultForm })
  const [error, setError] = useState('')

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const updateVec = (key, idx, val) =>
    setForm((f) => {
      const arr = [...f[key]]
      arr[idx] = val
      return { ...f, [key]: arr }
    })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Please enter a designation name for the object.')
      return
    }

    const mass = parseNum(form.massKg, 5.972e24)
    const radiusKm = parseNum(form.radiusKm, 6371)
    const position = parseVec(form.position, 0)
    let velocity = parseVec(form.velocity, 0)
    
    // Feature: If velocity is completely 0, give it a comet-like orbital velocity
    // so it orbits the sun instead of falling straight in.
    if (velocity[0] === 0 && velocity[1] === 0 && velocity[2] === 0) {
      const rUnits = Math.sqrt(position[0]**2 + position[1]**2 + position[2]**2)
      if (rUnits > 0) {
        // G*M (Sun) ~ 1.327e20. r in meters = rUnits * 1e6
        const vCirc = Math.sqrt(1.327e14 / rUnits)
        const vComet = vCirc * 0.6 // 60% of circular for a nice elliptical/comet orbit
        
        const normXZ = Math.sqrt(position[0]**2 + position[2]**2) || 1
        velocity = [
          -position[2] / normXZ * vComet,
          vComet * 0.15, // slight vertical inclination
          position[0] / normXZ * vComet
        ]
      }
    }

    const candidate = {
      ...form,
      name: form.name.trim(),
      mass,
      radiusKm,
      position,
      velocity,
      type: form.type,
    }

    const collision = checkPositionCollision(candidate, existingBodies)
    if (collision) {
      setError(collision)
      return
    }

    onAdd({
      ...candidate,
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      texturePreset: form.texturePreset === 'none' ? null : form.texturePreset,
    })
    setForm({ ...defaultForm })
    setError('')
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onClose || (() => {})}
        className="fixed bottom-6 right-6 z-30 px-4 py-2 glass-panel font-display text-xs tracking-widest uppercase text-cosmic-cyan hover:border-cosmic-accent"
      >
        + Create Object
      </button>
    )
  }

  return (
    <div className="glass-panel p-4 w-80 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar space-y-3">
      <div className="flex items-center justify-between border-b border-cosmic-border pb-2">
        <h3 className="font-display text-xs tracking-[0.25em] uppercase text-cosmic-cyan">Create Cosmic Object</h3>
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
      </div>

      {error && (
        <div className="px-2 py-1.5 border border-red-500/40 bg-red-500/10 text-red-300 text-[10px] font-mono leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Designation">
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="field-input"
            placeholder="Object name"
          />
        </Field>

        <Field label="Classification">
          <select value={form.type} onChange={(e) => update('type', e.target.value)} className="field-input">
            {OBJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Mass (kg)">
            <input
              type="text"
              inputMode="decimal"
              value={form.massKg}
              onChange={(e) => update('massKg', e.target.value)}
              className="field-input"
              placeholder="5.972e24"
            />
          </Field>
          <Field label="Radius (km)">
            <input
              type="text"
              inputMode="decimal"
              value={form.radiusKm}
              onChange={(e) => update('radiusKm', e.target.value)}
              className="field-input"
              placeholder="6371"
            />
          </Field>
        </div>

        <Field label="Mass Presets">
          <div className="flex flex-wrap gap-1">
            {[
              ['Earth', '5.972e24'],
              ['Jupiter', '1.898e27'],
              ['Sun', '1.989e30'],
              ['Moon', '7.342e22'],
            ].map(([label, m]) => (
              <button
                key={label}
                type="button"
                onClick={() => update('massKg', m)}
                className="px-1.5 py-0.5 text-[9px] font-mono border border-cosmic-border hover:border-cosmic-accent"
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Position (×10⁶ km)">
          <div className="grid grid-cols-3 gap-1">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div key={axis}>
                <span className="text-[9px] text-slate-500 font-mono">{axis}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.position[i]}
                  onChange={(e) => updateVec('position', i, e.target.value)}
                  className="field-input"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </Field>

        <Field label="Velocity (m/s)">
          <div className="grid grid-cols-3 gap-1">
            {['Vx', 'Vy', 'Vz'].map((axis, i) => (
              <div key={axis}>
                <span className="text-[9px] text-slate-500 font-mono">{axis}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.velocity[i]}
                  onChange={(e) => updateVec('velocity', i, e.target.value)}
                  className="field-input"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </Field>

        <Field label="Surface Color">
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              className="w-10 h-8 bg-transparent border border-cosmic-border cursor-pointer"
            />
            <input
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              className="field-input flex-1 font-mono text-xs"
            />
          </div>
        </Field>

        <Field label="Texture Preset">
          <select
            value={form.texturePreset}
            onChange={(e) => update('texturePreset', e.target.value)}
            className="field-input"
          >
            {TEXTURE_PRESETS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.emissive}
              onChange={(e) => update('emissive', e.target.checked)}
              className="accent-cosmic-accent"
            />
            Emissive (star)
          </label>
          <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.fixed}
              onChange={(e) => update('fixed', e.target.checked)}
              className="accent-cosmic-accent"
            />
            Fixed position
          </label>
        </div>

        {form.emissive && (
          <Field label="Emissive Intensity">
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.1}
              value={form.emissiveIntensity}
              onChange={(e) => update('emissiveIntensity', parseFloat(e.target.value))}
              className="w-full accent-cosmic-accent"
            />
          </Field>
        )}

        <button
          type="submit"
          className="w-full py-2 font-display text-xs tracking-[0.2em] uppercase bg-gradient-to-r from-cosmic-accent/20 to-cosmic-violet/20 border border-cosmic-accent/50 hover:border-cosmic-accent transition-colors"
        >
          Spawn Object
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-mono">{label}</label>
      {children}
    </div>
  )
}

export function ObjectListPanel({ bodies, selectedId, onSelect, onRemove, onFocus, title = 'Objects' }) {
  const visible = bodies.filter((b) => !b.hidden)
  if (visible.length === 0) return null

  return (
    <div className="glass-panel p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
      <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">{title} ({visible.length})</h4>
      {visible.map((b) => (
        <div
          key={b.id}
          className={`flex items-center gap-2 p-1.5 border cursor-pointer transition-colors ${
            selectedId === b.id ? 'border-cosmic-accent bg-cosmic-accent/10' : 'border-transparent hover:border-cosmic-border'
          }`}
          onClick={() => { onSelect(b.id); onFocus?.(b) }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color || '#4488cc' }} />
          <span className="text-xs font-mono flex-1 truncate">{b.name}</span>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(b.id) }}
              className="text-slate-600 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
