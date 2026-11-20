import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Laptop, ArrowLeftRight, BarChart3, History, LogOut, Menu, X, LifeBuoy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { api } from '../lib/api'
import { estaVencido } from '../lib/format'
import { PERSONAL, ROL_LABEL } from '../lib/constants'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: PERSONAL, end: true },
  { to: '/equipos', label: 'Equipos', icon: Laptop },
  { to: '/prestamos', label: 'Préstamos', icon: ArrowLeftRight, alerta: true },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: PERSONAL },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, roles: PERSONAL },
  { to: '/movimientos', label: 'Movimientos', icon: History, roles: PERSONAL },
  { to: '/ayuda', label: 'Ayuda', icon: LifeBuoy },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const personal = PERSONAL.includes(user.rol)
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.rol))
  const iniciales = (user.nombres[0] + user.apellidos[0]).toUpperCase()

  // Visibilidad del estado del sistema: el menú avisa de lo que requiere atención.
  const { data: alerta } = useAsync(async () => {
    try {
      const l = await api.get('/prestamos', { estado: personal ? 'Pendiente' : 'Activo' })
      return personal
        ? { n: l.length, tono: 'bg-amber-400 text-ink-950', texto: `${l.length} solicitudes pendientes de aprobar` }
        : { n: l.filter(estaVencido).length, tono: 'bg-rose-500 text-white', texto: 'Tienes préstamos vencidos por devolver' }
    } catch { return null }
  }, [pathname, personal])

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-900 text-slate-300">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3 rounded-xl bg-white p-2.5">
          <img src="/logo-techasset.png" alt="Logo de TechAsset" className="h-12 w-auto" />
          <div>
            <p className="text-lg font-extrabold leading-none text-ink-900">TechAsset</p>
            <p className="mt-1 text-xs text-slate-500">Inventario de equipos</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Navegación principal">
        {items.map(({ to, label, icon: Icon, end, alerta: conAlerta }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-ink-700 text-white shadow-[inset_3px_0_0_#2dd4bf]' : 'hover:bg-ink-800 hover:text-white'}`}>
            <Icon className="h-[18px] w-[18px]" />{label}
            {conAlerta && alerta?.n > 0 && (
              <span title={alerta.texto} aria-label={alerta.texto} className={`ml-auto min-w-[1.4rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${alerta.tono}`}>{alerta.n}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-xl bg-ink-800 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">{iniciales}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.nombres} {user.apellidos}</p>
            <p className="truncate text-xs text-slate-400">{ROL_LABEL[user.rol]}</p>
          </div>
        </div>
        <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-ink-700 py-2 text-[13px] font-semibold text-slate-200 hover:bg-ink-950 hover:text-white">
          <LogOut className="h-4 w-4" />Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-full">
      <a href="#contenido" className="sr-only z-[200] rounded-lg bg-white px-4 py-2 font-semibold text-ink-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar al contenido</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Menú">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <img src="/logo-techasset.png" alt="Logo de TechAsset" className="h-9 w-auto" /><span className="font-extrabold text-ink-900">TechAsset</span>
          {alerta?.n > 0 && <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${alerta.tono}`} title={alerta.texto}>{alerta.n}</span>}
        </header>
        <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none sm:px-8"><Outlet /></main>
      </div>
    </div>
  )
}
