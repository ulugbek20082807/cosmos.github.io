import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RealCosmos from './pages/RealCosmos'
import Sandbox from './pages/Sandbox'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/real-cosmos" element={<RealCosmos />} />
        <Route path="/sandbox" element={<Sandbox />} />
      </Routes>
    </HashRouter>
  )
}
