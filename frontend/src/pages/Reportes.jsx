import { useState } from 'react'
import { Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { COLOR_ESTADO } from '../lib/constants'
import { descargarCSV } from '../lib/format'
import { AssetTag, Badge, Button, Card, PageHeader, Tabs } from '../components/ui'
import { DataTable } from '../components/DataTable'

function EquiposPorEstado() {
  const [estado, setEstado] = useState('Disponible')
  const resumen = useAsync(() => api.get('/reportes/equipos-por-estado'))
  const lista = useAsync(() => api.get('/equipos', { estado }), [estado])
  const columns = [
    { key: 'c', header: 'Código', render: (e) => <AssetTag>{e.codigoPatrimonial}</AssetTag> },
    { key: 'n', header: 'Equipo', render: (e) => <span className="font-semibold text-ink-900">{e.nombre}</span> },
    { key: 'cat', header: 'Categoría', render: (e) => e.categoria },
    { key: 'm', header: 'Marca', render: (e) => e.marca },
    { key: 'u', header: estado === 'Prestado' ? 'Prestado a' : 'Ubicación', render: (e) => (estado === 'Prestado' ? e.prestadoA : e.ubicacion) || '—' },
  ]
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(resumen.data || []).map((r) => (
          <button key={r.nombre} onClick={() => setEstado(r.nombre)}
            className={`rounded-xl border bg-white p-4 text-left transition-colors ${estado === r.nombre ? 'border-teal-700 ring-2 ring-teal-700/15' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_ESTADO[r.nombre] }} />{r.nombre}</div>
            <p className="mt-1 text-2xl font-extrabold text-ink-900">{r.total}</p>
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-ink-900">Equipos <Badge estado={estado}>{estado}</Badge></p>
        <Button size="sm" variant="secondary" icon={Download} disabled={!lista.data?.length}
          onClick={() => descargarCSV(`equipos-${estado.toLowerCase()}`, [
            { header: 'Código', value: (e) => e.codigoPatrimonial }, { header: 'Equipo', value: (e) => e.nombre }, { header: 'Categoría', value: (e) => e.categoria },
            { header: 'Marca', value: (e) => e.marca }, { header: 'Ubicación', value: (e) => e.ubicacion }], lista.data)}>Exportar CSV</Button>
      </div>
      <DataTable columns={columns} rows={lista.data} loading={lista.loading} error={lista.error} onRetry={lista.reload} />
    </>
  )
}

function MasUtilizados() {
  const { data, loading, error, reload } = useAsync(() => api.get('/reportes/equipos-mas-utilizados', { top: 10 }))
  const max = Math.max(1, ...(data || []).map((d) => d.total))
  const columns = [
    { key: 'pos', header: '#', className: 'w-10 tabular-nums text-slate-400', render: (e) => e.pos },
    { key: 'c', header: 'Código', render: (e) => <AssetTag>{e.codigoPatrimonial}</AssetTag> },
    { key: 'n', header: 'Equipo', render: (e) => <span className="font-semibold text-ink-900">{e.nombre}</span> },
    { key: 'cat', header: 'Categoría', render: (e) => e.categoria },
    { key: 't', header: 'Préstamos', render: (e) => (
      <div className="flex min-w-[10rem] items-center gap-3"><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${(e.total / max) * 100}%` }} /></div><b className="w-6 text-right tabular-nums">{e.total}</b></div>) },
  ]
  const rows = (data || []).map((d, i) => ({ ...d, pos: i + 1 }))
  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="secondary" icon={Download} disabled={!rows.length}
          onClick={() => descargarCSV('equipos-mas-utilizados', [{ header: 'Código', value: (e) => e.codigoPatrimonial }, { header: 'Equipo', value: (e) => e.nombre }, { header: 'Categoría', value: (e) => e.categoria }, { header: 'Préstamos', value: (e) => e.total }], rows)}>Exportar CSV</Button>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={reload} />
    </>
  )
}

function PorArea() {
  const { data, loading, error, reload } = useAsync(() => api.get('/reportes/prestamos-por-area'))
  const columns = [
    { key: 'nombre', header: 'Área', render: (r) => <span className="font-semibold text-ink-900">{r.nombre}</span> },
    { key: 'total', header: 'Préstamos', className: 'text-right tabular-nums', render: (r) => r.total },
  ]
  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="secondary" icon={Download} disabled={!data?.length}
          onClick={() => descargarCSV('prestamos-por-area', [{ header: 'Área', value: (r) => r.nombre }, { header: 'Préstamos', value: (r) => r.total }], data)}>Exportar CSV</Button>
      </div>
      {!!data?.length && (
        <Card className="mb-4 p-5">
          <div style={{ height: Math.max(180, data.length * 44) }}>
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis type="category" dataKey="nombre" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#334155' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v) => [v, 'Préstamos']} />
                <Bar dataKey="total" fill="#0f766e" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} rowKey={(r) => r.nombre} />
    </>
  )
}

export default function Reportes() {
  const [tab, setTab] = useState('estado')
  return (
    <>
      <PageHeader title="Reportes" subtitle="Consultas del inventario y del uso de equipos, con exportación a CSV." />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[
        { value: 'estado', label: 'Equipos por estado' }, { value: 'uso', label: 'Más utilizados' }, { value: 'area', label: 'Préstamos por área' }]} /></div>
      {tab === 'estado' && <EquiposPorEstado />}
      {tab === 'uso' && <MasUtilizados />}
      {tab === 'area' && <PorArea />}
    </>
  )
}
