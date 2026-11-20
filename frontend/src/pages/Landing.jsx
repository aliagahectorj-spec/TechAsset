import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { LogIn, ScanLine, ShieldCheck, History } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'
import LoginModal from '../components/LoginModal'

const PUNTOS = [
  { icon: ScanLine, texto: 'Disponibilidad y ubicación de cada equipo' },
  { icon: ShieldCheck, texto: 'Reglas de préstamo aplicadas automáticamente' },
  { icon: History, texto: 'Historial completo de movimientos' },
]

/** Pantalla principal pública: ilustración de equipos tecnológicos de fondo, logo y botón para iniciar sesión. */
export default function Landing() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [abierto, setAbierto] = useState(params.get('login') === '1')

  if (user) return <Navigate to={user.rol === ROLES.COLAB ? '/equipos' : '/'} replace />

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-ink-950 text-white">
      <img src="/fondo-techasset.png" alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/75 via-ink-950/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/60 to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-lg">
          <img src="/logo-techasset.png" alt="Logo de TechAsset" className="h-12 w-auto" />
          <div className="hidden border-l border-slate-200 pl-3 sm:block">
            <p className="text-lg font-extrabold leading-none text-ink-900">TechAsset</p>
            <p className="mt-1 text-xs text-slate-500">Inventario de equipos</p>
          </div>
        </div>
        <button onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-ink-900 shadow-lg transition-colors hover:bg-teal-50">
          <LogIn className="h-4 w-4" />Inicia sesión
        </button>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-5 py-10 sm:px-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">Cada equipo tiene un código, un responsable y un destino.</h1>
          <p className="mt-6 max-w-xl text-lg text-slate-200">
            Administra el inventario tecnológico y controla el préstamo de laptops, monitores, proyectores y equipos de red, sin hojas de cálculo.
          </p>
          <button onClick={() => setAbierto(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-sm font-bold shadow-lg transition-colors hover:bg-teal-600">
            <LogIn className="h-4 w-4" />Inicia sesión
          </button>
        </div>
      </main>

      <footer className="relative z-10 px-5 pb-8 sm:px-10">
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-100">
          {PUNTOS.map(({ icon: Icon, texto }) => (
            <li key={texto} className="flex items-center gap-2.5"><Icon className="h-5 w-5 text-teal-300" />{texto}</li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-slate-400">Universidad Peruana Los Andes · Facultad de Ingeniería</p>
      </footer>

      <LoginModal open={abierto} onClose={() => setAbierto(false)} />
    </div>
  )
}
