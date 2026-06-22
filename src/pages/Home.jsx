import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

function StarCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let w, h
    const stars = []

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 280; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random(),
        speed: Math.random() * 0.003 + 0.001,
      })
    }

    const draw = () => {
      ctx.fillStyle = '#030508'
      ctx.fillRect(0, 0, w, h)

      const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.6)
      grad.addColorStop(0, 'rgba(20, 40, 80, 0.25)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      stars.forEach((s) => {
        s.a += s.speed
        const opacity = 0.3 + Math.sin(s.a * Math.PI * 2) * 0.3
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 210, 255, ${opacity})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

function HudLine({ className = '' }) {
  return (
    <div className={`absolute h-px bg-gradient-to-r from-transparent via-cosmic-accent/40 to-transparent ${className}`} />
  )
}

export default function Home() {
  return (
    <div className="relative w-full h-full overflow-hidden scanline-overlay">
      <StarCanvas />
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Corner HUD brackets */}
      <div className="absolute top-6 left-6 w-16 h-16 border-l border-t border-cosmic-accent/30" />
      <div className="absolute top-6 right-6 w-16 h-16 border-r border-t border-cosmic-accent/30" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-l border-b border-cosmic-accent/30" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-r border-b border-cosmic-accent/30" />

      <HudLine className="top-20 left-0 right-0" />
      <HudLine className="bottom-20 left-0 right-0" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        <div className="text-center mb-12 max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-cosmic-accent/70 mb-4">
            Navigation Interface v2026.171 · Cosmos Engine
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-[0.08em] uppercase text-white mb-4">
            Cosmos
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cosmic-accent via-cosmic-cyan to-cosmic-violet">
              Simulator
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            Universe simulation with trajectory modeling.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
          <Link
            to="/real-cosmos"
            className="group flex-1 glass-panel p-6 text-left hover:border-cosmic-accent/60 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cosmic-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cosmic-cyan animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cosmic-cyan">Mode 01</span>
              </div>
              <div className="relative z-10">
                <h2 className="font-display text-lg tracking-[0.15em] uppercase text-white mb-2">Solar System</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed min-h-[40px]">
                  Explore realistic scales, planetary orbits, and calculated trajectories.
                </p>
                <div className="mt-4 font-mono text-[10px] text-cosmic-accent/80 uppercase tracking-widest group-hover:text-cosmic-cyan transition-colors">
                  Initialize →
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/sandbox"
            className="group flex-1 glass-panel p-6 text-left hover:border-cosmic-violet/60 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cosmic-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cosmic-violet animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cosmic-violet">Mode 02</span>
              </div>
              <div className="relative z-10">
                <h2 className="font-display text-lg tracking-[0.15em] uppercase text-white mb-2">Empty Universe</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed min-h-[40px]">
                  Create a custom star system. Spawn objects and observe gravity.
                </p>
                <div className="mt-4 font-mono text-[10px] text-cosmic-violet/80 uppercase tracking-widest group-hover:text-cosmic-violet transition-colors">
                  Initialize →
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-6 font-mono text-[9px] uppercase tracking-[0.25em] text-slate-600">
          <span>1 unit = 10⁶ km</span>
          <span className="w-px h-3 bg-slate-700" />
          <span>Three.js · R3F</span>
          <span className="w-px h-3 bg-slate-700" />
          <span>Scale-accurate</span>
        </div>
      </div>
    </div>
  )
}
