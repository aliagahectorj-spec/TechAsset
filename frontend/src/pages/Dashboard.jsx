import { Laptop, CheckCircle2, ArrowLeftRight, Wrench, ClipboardList, Building2, AlertTriangle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { COLOR_ESTADO } from '../lib/constants'
import { Card, ErrorState, PageHeader, Spinner, StatCard } from '../components/ui'

export default function Dashboard() {
  const { data: d, loading, error, reload } = useAsync(() => api.get('/reportes/dashboard'))
  if (loading && !d) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const estados = d.equiposPorEstado.filter((e) => e.total > 0)
  const maxCat = Math.max(1, ...d.equiposPorCategoria.map((c) => c.total))

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Estado actual del inventario tecnológico y la actividad de préstamos." />

      {(d.vencidos > 0 || d.pendientes > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {d.vencidos > 0 && (
            <Link to="/prestamos" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 hover:bg-rose-100/70">
              <AlertTriangle className="h-5 w-5" /><span><b>{d.vencidos}</b> {d.vencidos === 1 ? 'préstamo vencido' : 'préstamos vencidos'} sin devolver</span>
            </Link>
          )}
          {d.pendientes > 0 && (
            <Link to="/prestamos" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100/70">
              <Clock className="h-5 w-5" /><span><b>{d.pendientes}</b> {d.pendientes === 1 ? 'solicitud espera' : 'solicitudes esperan'} aprobación</span>
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Laptop} label="Total de equipos" value={d.totalEquipos} hint={`${d.baja} dados de baja`} />
        <StatCard icon={CheckCircle2} tone="emerald" label="Equipos disponibles" value={d.disponibles} hint="Listos para préstamo" />
        <StatCard icon={ArrowLeftRight} tone="blue" label="Equipos prestados" value={d.prestados} hint="Actualmente asignados" />
        <StatCard icon={Wrench} tone="amber" label="En mantenimiento" value={d.mantenimiento} hint="Fuera de servicio" />
        <StatCard icon={ClipboardList} tone="slate" label="Total de préstamos" value={d.totalPrestamos} hint={`${d.prestamosActivos} activos ahora`} />
        <StatCard icon={Building2} tone="teal" label="Área con mayor uso" value={d.areaMayorUso?.nombre ?? '—'} hint={d.areaMayorUso ? `${d.areaMayorUso.total} préstamos` : 'Sin préstamos aún'} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h3 className="font-bold text-ink-900">Préstamos por mes</h3>
          <p className="mb-4 text-sm text-slate-500">Últimos 6 meses</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={d.prestamosPorMes} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v) => [v, 'Préstamos']} />
                <Bar dataKey="total" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-ink-900">Equipos por estado</h3>
          <div className="relative mx-auto mt-2 h-44 w-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={estados} dataKey="total" nameKey="nombre" innerRadius={52} outerRadius={78} paddingAngle={2} strokeWidth={0}>
                  {estados.map((e) => <Cell key={e.nombre} fill={COLOR_ESTADO[e.nombre]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><p className="text-2xl font-extrabold text-ink-900">{d.totalEquipos}</p><p className="text-xs text-slate-500">equipos</p></div>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {d.equiposPorEstado.map((e) => (
              <li key={e.nombre} className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_ESTADO[e.nombre] }} />{e.nombre}<b className="ml-auto text-ink-900">{e.total}</b>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h3 className="font-bold text-ink-900">Inventario por categoría</h3>
        <div className="mt-4 grid gap-x-10 gap-y-3 md:grid-cols-2">
          {d.equiposPorCategoria.map((c) => (
            <div key={c.nombre}>
              <div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{c.nombre}</span><b className="text-ink-900">{c.total}</b></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${(c.total / maxCat) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
