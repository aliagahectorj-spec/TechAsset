import { useState } from 'react'
import { Plus, Pencil, RefreshCw, Trash2, Hand, MapPin, Download } from 'lucide-react'
import { api } from '../lib/api'
import { useAsync, useDebounce } from '../hooks/useAsync'
import { useForm } from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { CATEGORIAS, ESTADOS_EQUIPO, ESTADOS_MANUALES, PERSONAL, ROLES } from '../lib/constants'
import { rules } from '../lib/validators'
import { Alert, AssetTag, Badge, Button, ClearFilters, EmptyState, FilterSelect, Input, PageHeader, Select, SearchInput } from '../components/ui'
import { descargarCSV } from '../lib/format'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'
import { PrestamoModal } from '../components/PrestamoModals'

function EquipoModal({ equipo, onClose, onDone }) {
  const editando = !!equipo
  const toast = useToast()
  const form = useForm(
    { codigoPatrimonial: equipo?.codigoPatrimonial ?? '', nombre: equipo?.nombre ?? '', categoria: equipo?.categoria ?? '', marca: equipo?.marca ?? '', ubicacion: equipo?.ubicacion ?? '' },
    {
      codigoPatrimonial: [rules.required('El código patrimonial es obligatorio.'), rules.pattern(/^[A-Za-z0-9-]{3,50}$/, 'Usa 3 a 50 letras, números o guiones.')],
      nombre: [rules.required('El nombre es obligatorio.'), rules.max(100)],
      categoria: [rules.required('La categoría es obligatoria.')],
      marca: [rules.required('La marca es obligatoria.'), rules.max(50)],
      ubicacion: [rules.max(120)],
    },
  )
  const guardar = form.handleSubmit(async (v) => {
    const body = { ...v, ubicacion: v.ubicacion || null }
    if (editando) await api.put(`/equipos/${equipo.id}`, body)
    else await api.post('/equipos', body)
    toast.success(editando ? 'Equipo actualizado.' : 'Equipo registrado.')
    onDone()
  })
  return (
    <Modal open onClose={onClose} dirty={form.dirty} title={editando ? 'Editar equipo' : 'Registrar equipo'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={guardar} loading={form.submitting}>{editando ? 'Guardar cambios' : 'Registrar equipo'}</Button></>}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input label="Código patrimonial" required placeholder="LAP-0010" hint="Debe ser único en toda la empresa." {...form.bind('codigoPatrimonial')} />
        <Input label="Nombre" required placeholder="Laptop ThinkPad T14" {...form.bind('nombre')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Categoría" required placeholder="Selecciona" options={CATEGORIAS} {...form.bind('categoria')} />
          <Input label="Marca" required {...form.bind('marca')} />
        </div>
        <Input label="Ubicación" placeholder="Almacén central, Piso 2…" {...form.bind('ubicacion')} />
      </form>
    </Modal>
  )
}

function EstadoModal({ equipo, onClose, onDone }) {
  const toast = useToast()
  const prestado = equipo.estado === 'Prestado'
  const form = useForm({ estado: equipo.estado }, { estado: [rules.required('Selecciona un estado.')] })
  const guardar = form.handleSubmit(async (v) => {
    await api.patch(`/equipos/${equipo.id}/estado`, { estado: v.estado })
    toast.success('Estado actualizado.')
    onDone()
  })
  return (
    <Modal open onClose={onClose} dirty={form.dirty} title="Actualizar estado" subtitle={`${equipo.codigoPatrimonial} · ${equipo.nombre}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button>{!prestado && <Button onClick={guardar} loading={form.submitting}>Guardar estado</Button>}</>}>
      {prestado
        ? <Alert tone="amber">El equipo está prestado a {equipo.prestadoA}. Registra primero la devolución desde Préstamos.</Alert>
        : <form onSubmit={guardar} noValidate className="space-y-4">
            {form.formError && <Alert>{form.formError}</Alert>}
            <Select label="Nuevo estado" options={ESTADOS_MANUALES} {...form.bind('estado')} hint="Los equipos en Mantenimiento o Baja no se pueden prestar." />
          </form>}
    </Modal>
  )
}

export default function Equipos() {
  const { user, hasRole } = useAuth()
  const toast = useToast()
  const personal = PERSONAL.includes(user.rol)
  const [buscar, setBuscar] = useState('')
  const [categoria, setCategoria] = useState('')
  const [estado, setEstado] = useState('')
  const [modal, setModal] = useState(null)
  const [estadoModal, setEstadoModal] = useState(null)
  const [solicitar, setSolicitar] = useState(null)
  const [eliminar, setEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const q = useDebounce(buscar)
  const { data, loading, error, reload } = useAsync(() => api.get('/equipos', { buscar: q, categoria, estado }), [q, categoria, estado])

  const borrar = async () => {
    setEliminando(true)
    try { await api.del(`/equipos/${eliminar.id}`); toast.success('Equipo eliminado.'); setEliminar(null); reload() }
    catch (e) { toast.error(e.message); setEliminar(null) } finally { setEliminando(false) }
  }

  const columns = [
    { key: 'cod', header: 'Código', render: (e) => <AssetTag>{e.codigoPatrimonial}</AssetTag> },
    { key: 'nombre', header: 'Equipo', render: (e) => <div><p className="font-semibold text-ink-900">{e.nombre}</p><p className="text-xs text-slate-500">{e.marca}</p></div> },
    { key: 'categoria', header: 'Categoría' },
    { key: 'ubicacion', header: 'Ubicación', render: (e) => e.prestadoA
      ? <span className="text-slate-600">Con {e.prestadoA}</span>
      : <span className="inline-flex items-center gap-1 text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" />{e.ubicacion || '—'}</span> },
    { key: 'estado', header: 'Estado', render: (e) => <Badge estado={e.estado}>{e.estado}</Badge> },
    { key: 'usos', header: 'Usos', className: 'text-right tabular-nums', render: (e) => e.totalPrestamos },
    { key: 'acc', header: '', className: 'text-right', render: (e) => (
      <div className="flex justify-end gap-1">
        {!personal && e.estado === 'Disponible' && <Button size="sm" icon={Hand} onClick={() => setSolicitar(e)}>Solicitar</Button>}
        {personal && <>
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setModal({ equipo: e })} aria-label="Editar" title="Editar" />
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => setEstadoModal(e)} aria-label="Cambiar estado" title="Cambiar estado" />
          {hasRole(ROLES.ADMIN) && <Button size="sm" variant="ghost" icon={Trash2} className="!text-rose-600" onClick={() => setEliminar(e)} aria-label="Eliminar" title="Eliminar" />}
        </>}
      </div>) },
  ]

  const hayFiltros = !!(buscar || categoria || estado)
  const limpiar = () => { setBuscar(''); setCategoria(''); setEstado('') }
  const vacio = hayFiltros
    ? <EmptyState title="Ningún equipo coincide" text="Prueba con otra búsqueda o quita los filtros." action={<Button variant="secondary" onClick={limpiar}>Limpiar filtros</Button>} />
    : <EmptyState title="Aún no hay equipos" text={personal ? 'Registra el primero para empezar a controlar el inventario.' : 'Todavía no hay equipos registrados.'}
        action={personal && <Button icon={Plus} onClick={() => setModal({})}>Registrar equipo</Button>} />
  const exportar = () => descargarCSV('equipos', [
    { header: 'Código', value: (e) => e.codigoPatrimonial }, { header: 'Equipo', value: (e) => e.nombre }, { header: 'Categoría', value: (e) => e.categoria },
    { header: 'Marca', value: (e) => e.marca }, { header: 'Estado', value: (e) => e.estado }, { header: 'Ubicación', value: (e) => e.prestadoA ? `Con ${e.prestadoA}` : e.ubicacion }], data)

  return (
    <>
      <PageHeader title={personal ? 'Inventario de equipos' : 'Equipos disponibles'}
        subtitle={personal ? 'Todos los activos tecnológicos, su estado y dónde están.' : 'Consulta qué equipos puedes solicitar.'}
        actions={<><Button variant="secondary" icon={Download} disabled={!data?.length} onClick={exportar}>Exportar CSV</Button>{personal && <Button icon={Plus} onClick={() => setModal({})}>Registrar equipo</Button>}</>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={buscar} onChange={setBuscar} placeholder="Buscar por código, nombre o marca" />
        <FilterSelect value={categoria} onChange={setCategoria} options={CATEGORIAS} placeholder="Todas las categorías" />
        <FilterSelect value={estado} onChange={setEstado} options={ESTADOS_EQUIPO} placeholder="Todos los estados" />
        <ClearFilters show={hayFiltros} onClick={limpiar} />
      </div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} empty={vacio} />
      {modal && <EquipoModal equipo={modal.equipo} onClose={() => setModal(null)} onDone={() => { setModal(null); reload() }} />}
      {estadoModal && <EstadoModal equipo={estadoModal} onClose={() => setEstadoModal(null)} onDone={() => { setEstadoModal(null); reload() }} />}
      {solicitar && <PrestamoModal mode="solicitar" equipoId={solicitar.id} onClose={() => setSolicitar(null)} onDone={() => { setSolicitar(null); reload() }} />}
      <ConfirmDialog open={!!eliminar} onClose={() => setEliminar(null)} onConfirm={borrar} loading={eliminando} danger confirmText="Eliminar equipo"
        title="Eliminar equipo" message={`Se eliminará ${eliminar?.codigoPatrimonial} · ${eliminar?.nombre}. Si el equipo tiene historial de préstamos no se podrá eliminar; en ese caso dalo de baja.`} />
    </>
  )
}
