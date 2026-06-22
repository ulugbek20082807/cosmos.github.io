import { HashRouter, Routes, Route } from 'react-router-dom'
import { Loader } from '@react-three/drei'
import Home from './pages/Home'
import RealCosmos from './pages/RealCosmos'
import Sandbox from './pages/Sandbox'

export default function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/real-cosmos" element={<RealCosmos />} />
          <Route path="/sandbox" element={<Sandbox />} />
        </Routes>
      </HashRouter>
      <Loader 
        containerStyles={{ background: 'var(--color-cosmic-void)', zIndex: 9999 }} 
        innerStyles={{ 
          background: 'rgba(8, 14, 28, 0.8)', 
          border: '1px solid var(--color-cosmic-border)', 
          padding: '30px 40px', 
          borderRadius: '12px', 
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 32px rgba(59, 158, 255, 0.15)'
        }}
        barStyles={{ background: 'var(--color-cosmic-accent)', height: '4px' }}
        dataInterpolation={(p) => `Establishing Uplink... ${p.toFixed(0)}%`}
        dataStyles={{ 
          color: '#c8d6e8', 
          fontFamily: 'var(--font-display)', 
          letterSpacing: '3px', 
          fontSize: '18px',
          textTransform: 'uppercase',
          marginBottom: '15px'
        }}
      />
    </>
  )
}
