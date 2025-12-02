import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Cercas from './pages/Cercas';
import Buscar from './pages/Buscar';
import Motoristas from './pages/Motoristas'
import Alertas from './pages/Alertas';
import Veiculos from './pages/Veículos';
import Registros from './pages/Registros';
import Inicio from './pages/Inicio';
import './styles/global.css'

function App() {

  return (
    <>
      <BrowserRouter basename="">
        <Routes>
          <Route path='/' element={<Inicio />} />
          <Route path='/cercas' element={<Cercas />} />
          <Route path='/motoristas' element={<Motoristas />} />
          <Route path='/veiculos' element={<Veiculos />} />
          <Route path='/alertas' element={<Alertas />} />
          <Route path='/registros' element={<Registros />} />
          <Route path='/buscar' element={<Buscar />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
