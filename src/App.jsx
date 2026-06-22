import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RealCosmos from './pages/RealCosmos'
import Sandbox from './pages/Sandbox'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/real-cosmos" element={<RealCosmos />} />
        <Route path="/sandbox" element={<Sandbox />} />
      </Routes>
    </BrowserRouter>
  )
}
