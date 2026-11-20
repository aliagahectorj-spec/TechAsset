import { useMemo, useState } from 'react'
import { Plus, Check, X, Undo2, Hand, MessageSquareText, Download, Ban } from 'lucide-react'
import { api } from '../lib/api'
import { useAsync, useDebounce } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PERSONAL } from '../lib/constants'
import { descargarCSV, estaVencido, fmtFecha, textoPlazo } from '../lib/format'
import { AssetTag, Badge, Button, ClearFilters, EmptyState, FilterSelect, Input, PageHeader, SearchInput, Tabs } from '../components/ui'
import { ConfirmDialog } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { DevolucionModal, PrestamoModal, RechazarModal } from '../components/PrestamoModals'

export default function Prestamos() {
  const { user } = useAuth()
  const toast = useToast()
  const personal = PERSONAL.includes(user.rol)
  const [tab, setTab] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const [area, setArea] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [modal, setModal] = useState(null) // 'registrar' | 'solicitar' | {tipo, prestamo}
  const [aprobando, setAprobando] = useState(null)
  const [cancelando, setCancelando] = useState(false)
  const q = useDebounce(buscar)

  const { data, loading, error, reload } = useAsync(() => api.get('/prestamos', { buscar: q, area, desde, hasta }), [q, area, desde, hasta])
  const areas = useAsync(() => (personal ? api.get('/reportes/areas') : Promise.resolve([])), [personal])

  const filas = useMemo(() => {
    const l = data || []
    return {
      todos: l,
      pendientes: l.filter((p) => p.estado === 'Pendiente'),
      activos: l.filter((p) => p.estado === 'Activo'),
      vencidos: l.filter(estaVencido),
      historial: l.filter((p) => ['Devuelto', 'Rechazado', 'Cancelado'].includes(p.estado)),
    }
  }, [data])

  const aprobar = async (p) => {
    setAprobando(p.id)
    try { await api.post(`/prestamos/${p.id}/aprobar`); toast.success('Préstamo aprobado.'); reload() }
    catch (e) { toast.error(e.message) } finally { setAprobando(null) }
  }
  const cerrar = () => setModal(null)
  const hecho = () => { setModal(null); reload() }
  const cancelar = async () => {
    setCancelando(true)
    try { await api.post(`/prestamos/${modal.prestamo.id}/cancelar`); toast.success('Solicitud cancelada.'); hecho() }
    catch (e) { toast.error(e.message); setModal(null) } finally { setCancelando(false) }
  }

  const hayFiltros = !!(buscar || area || desde || hasta)
  const limpiar = () => { setBuscar(''); setArea(''); setDesde(''); setHasta('') }
  const vacio = hayFiltros
    ? <EmptyState title="Ningún préstamo coincide" text="Prueba con otra búsqueda o cambia las fechas." action={<Button variant="secondary" onClick={limpiar}>Limpiar filtros</Button>} />
    : <EmptyState title="Sin préstamos en esta vista" text={personal ? 'Cuando registres o apruebes préstamos aparecerán aquí.' : 'Cuando solicites un equipo aparecerá aquí.'}
        action={<Button icon={personal ? Plus : Hand} onClick={() => setModal(personal ? 'registrar' : 'solicitar')}>{personal ? 'Registrar préstamo' : 'Solicitar equipo'}</Button>} />
  const exportar = () => descargarCSV('prestamos', [
    { header: 'Código', value: (p) => p.codigoPatrimonial }, { header: 'Equipo', value: (p) => p.equipo }, { header: 'Colaborador', value: (p) => p.usuario },
    { header: 'Área', value: (p) => p.area }, { header: 'Fecha de préstamo', value: (p) => p.fechaPrestamo }, { header: 'Devolución prevista', value: (p) => p.fechaDevolucion },
    { header: 'Devolución real', value: (p) => p.fechaDevolucionReal }, { header: 'Estado', value: (p) => (estaVencido(p) ? 'Vencido' : p.estado) },
    { header: 'Responsable', value: (p) => p.responsable }, { header: 'Observación', value: (p) => p.observacion }], filas[tab])

  const columns = [
    { key: 'equipo', header: 'Equipo', render: (p) => <div className="flex flex-col items-start gap-1"><AssetTag>{p.codigoPatrimonial}</AssetTag><span className="text-[13px] text-slate-600">{p.equipo}</span></div> },
    ...(personal ? [{ key: 'usuario', header: 'Colaborador', render: (p) => <div><p className="font-semibold text-ink-900">{p.usuario}</p><p className="text-xs text-slate-500">{p.area}</p></div> }] : []),
    { key: 'f1', header: 'Préstamo', render: (p) => fmtFecha(p.fechaPrestamo) },
    { key: 'f2', header: 'Devolución', render: (p) => p.fechaDevolucionReal
      ? <div><p>{fmtFecha(p.fechaDevolucionReal)}</p><p className="text-xs text-slate-400">prevista {fmtFecha(p.fechaDevolucion)}</p></div>
      : <div>
          <span className={estaVencido(p) ? 'font-semibold text-rose-600' : ''}>{fmtFecha(p.fechaDevolucion)}</span>
          {p.estado === 'Activo' && <p className={`text-xs ${estaVencido(p) ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{textoPlazo(p.fechaDevolucion)}</p>}
        </div> },
    { key: 'resp', header: 'Responsable', render: (p) => p.responsable || <span className="text-slate-400">Sin asignar</span> },
    { key: 'estado', header: 'Estado', render: (p) => (
      <div className="flex flex-col items-start gap-1">
        {estaVencido(p) ? <Badge estado="Vencido">Vencido</Badge> : <Badge estado={p.estado}>{p.estado}</Badge>}
        {p.observacion && <span className="flex max-w-[16rem] items-start gap-1 text-xs text-slate-500" title={p.observacion}><MessageSquareText className="mt-0.5 h-3 w-3 shrink-0" /><span className="line-clamp-2">{p.observacion}</span></span>}
      </div>) },
    ...(personal ? [{ key: 'acc', header: '', className: 'text-right', render: (p) => (
      <div className="flex justify-end gap-1.5">
        {p.estado === 'Pendiente' && <>
          <Button size="sm" icon={Check} loading={aprobando === p.id} onClick={() => aprobar(p)}>Aprobar</Button>
          <Button size="sm" variant="secondary" icon={X} onClick={() => setModal({ tipo: 'rechazar', prestamo: p })}>Rechazar</Button>
        </>}
        {p.estado === 'Activo' && <Button size="sm" variant="secondary" icon={Undo2} onClick={() => setModal({ tipo: 'devolver', prestamo: p })}>Devolver</Button>}
      </div>) }] : []),
    ...(!personal ? [{ key: 'acc2', header: '', className: 'text-right', render: (p) => (p.estado === 'Pendiente'
      ? <Button size="sm" variant="secondary" icon={Ban} onClick={() => setModal({ tipo: 'cancelar', prestamo: p })}>Cancelar solicitud</Button> : null) }] : []),
  ]

  const tabs = [
    { value: 'todos', label: 'Todos', count: filas.todos.length },
    ...(personal ? [{ value: 'pendientes', label: 'Pendientes', count: filas.pendientes.length }] : []),
    { value: 'activos', label: 'Activos', count: filas.activos.length },
    { value: 'vencidos', label: 'Vencidos', count: filas.vencidos.length },
    { value: 'historial', label: 'Historial', count: filas.historial.length },
  ]

  return (
    <>
      <PageHeader title={personal ? 'Préstamos' : 'Mis préstamos'}
        subtitle={personal ? 'Aprueba solicitudes, registra préstamos y devoluciones, y consulta el historial.' : 'Tus solicitudes, préstamos activos e historial.'}
        actions={<>
          <Button variant="secondary" icon={Download} disabled={!filas[tab].length} onClick={exportar}>Exportar CSV</Button>
          {personal
            ? <Button icon={Plus} onClick={() => setModal('registrar')}>Registrar préstamo</Button>
            : <Button icon={Hand} onClick={() => setModal('solicitar')}>Solicitar equipo</Button>}
        </>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={buscar} onChange={setBuscar} placeholder={personal ? 'Buscar por colaborador o equipo' : 'Buscar por equipo'} />
        {personal && <FilterSelect value={area} onChange={setArea} options={areas.data || []} placeholder="Todas las áreas" />}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-40"><Input type="date" aria-label="Desde" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <span>a</span>
          <div className="w-40"><Input type="date" aria-label="Hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        </div>
        <ClearFilters show={hayFiltros} onClick={limpiar} />
      </div>
      <div className="mb-4"><Tabs tabs={tabs} value={tab} onChange={setTab} /></div>
      <DataTable columns={columns} rows={filas[tab]} loading={loading} error={error} onRetry={reload} empty={vacio} />

      {modal === 'registrar' && <PrestamoModal mode="registrar" onClose={cerrar} onDone={hecho} />}
      {modal === 'solicitar' && <PrestamoModal mode="solicitar" onClose={cerrar} onDone={hecho} />}
      {modal?.tipo === 'devolver' && <DevolucionModal prestamo={modal.prestamo} onClose={cerrar} onDone={hecho} />}
      <ConfirmDialog open={modal?.tipo === 'cancelar'} onClose={cerrar} onConfirm={cancelar} loading={cancelando} danger confirmText="Sí, cancelar"
        title="Cancelar solicitud" message={`Se retirará tu solicitud de ${modal?.prestamo?.codigoPatrimonial} · ${modal?.prestamo?.equipo}. Podrás volver a solicitarlo cuando quieras.`} />
      {modal?.tipo === 'rechazar' && <RechazarModal prestamo={modal.prestamo} onClose={cerrar} onDone={hecho} />}
    </>
  )
}
