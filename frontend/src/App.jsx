import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { PERSONAL } from './lib/constants'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/Usuarios'
import Equipos from './pages/Equipos'
import Prestamos from './pages/Prestamos'
import Reportes from './pages/Reportes'
import Movimientos from './pages/Movimientos'
import Ayuda from './pages/Ayuda'

function Protegida({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/inicio" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/equipos" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/inicio" element={<Landing />} />
      <Route path="/login" element={<Navigate to="/inicio?login=1" replace />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route index element={<Protegida roles={PERSONAL}><Dashboard /></Protegida>} />
        <Route path="equipos" element={<Equipos />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="usuarios" element={<Protegida roles={PERSONAL}><Usuarios /></Protegida>} />
        <Route path="reportes" element={<Protegida roles={PERSONAL}><Reportes /></Protegida>} />
        <Route path="ayuda" element={<Ayuda />} />
        <Route path="movimientos" element={<Protegida roles={PERSONAL}><Movimientos /></Protegida>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
