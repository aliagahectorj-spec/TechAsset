import { useState } from 'react'
import { api } from '../lib/api'
import { useAsync, useDebounce } from '../hooks/useAsync'
import { fmtFechaHora } from '../lib/format'
import { Badge, ClearFilters, FilterSelect, Input, PageHeader, SearchInput } from '../components/ui'
import { DataTable } from '../components/DataTable'

const TONO = { Registro: 'teal', Préstamo: 'blue', Solicitud: 'amber', Aprobación: 'emerald', Rechazo: 'rose', Cancelación: 'slate', Devolución: 'emerald', 'Cambio de estado': 'amber', Actualización: 'slate', Eliminación: 'rose', Deshabilitación: 'rose', Habilitación: 'emerald' }
const TIPOS = Object.keys(TONO)

export default function Movimientos() {
  const [buscar, setBuscar] = useState('')
  const [tipo, setTipo] = useState('')
  const [entidad, setEntidad] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const q = useDebounce(buscar)
  const { data, loading, error, reload } = useAsync(() => api.get('/movimientos', { buscar: q, tipo, entidad, desde, hasta }), [q, tipo, entidad, desde, hasta])

  const columns = [
    { key: 'f', header: 'Fecha', className: 'whitespace-nowrap', render: (m) => fmtFechaHora(m.fecha) },
    { key: 't', header: 'Movimiento', render: (m) => <Badge tone={TONO[m.tipo] || 'slate'}>{m.tipo}</Badge> },
    { key: 'e', header: 'Entidad', render: (m) => m.entidad },
    { key: 'd', header: 'Detalle', render: (m) => m.descripcion },
    { key: 'u', header: 'Realizado por', className: 'whitespace-nowrap', render: (m) => m.usuario || '—' },
  ]
  return (
    <>
      <PageHeader title="Historial de movimientos" subtitle="Bitácora de todo lo que ocurre con usuarios, equipos y préstamos. Se muestran los 500 movimientos más recientes." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={buscar} onChange={setBuscar} placeholder="Buscar en el detalle" />
        <FilterSelect value={tipo} onChange={setTipo} options={TIPOS} placeholder="Todos los movimientos" />
        <FilterSelect value={entidad} onChange={setEntidad} options={[{ value: 'Usuario', label: 'Usuarios' }, { value: 'Equipo', label: 'Equipos' }, { value: 'Prestamo', label: 'Préstamos' }]} placeholder="Todas las entidades" />
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-40"><Input type="date" aria-label="Desde" value={desde} onChange={(e) => setDesde(e.target.value)} /></div><span>a</span>
          <div className="w-40"><Input type="date" aria-label="Hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        </div>
        <ClearFilters show={!!(buscar || tipo || entidad || desde || hasta)} onClick={() => { setBuscar(''); setTipo(''); setEntidad(''); setDesde(''); setHasta('') }} />
      </div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} pageSize={15} />
    </>
  )
}
