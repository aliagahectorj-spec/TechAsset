import { useMemo, useState } from 'react'
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useAsync, useDebounce } from '../hooks/useAsync'
import { useForm } from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ROLES, ROL_LABEL } from '../lib/constants'
import { rules } from '../lib/validators'
import { Alert, Badge, Button, ClearFilters, FilterSelect, Input, PageHeader, Select, SearchInput } from '../components/ui'
import { ConfirmDialog, Modal } from '../components/Modal'
import { DataTable } from '../components/DataTable'

function UsuarioModal({ usuario, areas, onClose, onDone }) {
  const editando = !!usuario
  const toast = useToast()
  const form = useForm(
    { nombres: usuario?.nombres ?? '', apellidos: usuario?.apellidos ?? '', correo: usuario?.correo ?? '', area: usuario?.area ?? '', rol: usuario?.rol ?? ROLES.COLAB, password: '' },
    {
      nombres: [rules.required('Los nombres son obligatorios.'), rules.max(100)],
      apellidos: [rules.required('Los apellidos son obligatorios.'), rules.max(100)],
      correo: [rules.required('El correo es obligatorio.'), rules.email(), rules.max(150)],
      area: [rules.required('El área es obligatoria.'), rules.max(100)],
      rol: [rules.required('Selecciona un rol.')],
      password: [...(editando ? [] : [rules.required('La contraseña es obligatoria.')]), rules.password()],
    },
  )
  const guardar = form.handleSubmit(async (v) => {
    const body = { ...v, password: v.password || null }
    if (editando) await api.put(`/usuarios/${usuario.id}`, body)
    else await api.post('/usuarios', body)
    toast.success(editando ? 'Usuario actualizado.' : 'Usuario registrado.')
    onDone()
  })
  return (
    <Modal open onClose={onClose} dirty={form.dirty} title={editando ? 'Editar usuario' : 'Registrar usuario'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={guardar} loading={form.submitting}>{editando ? 'Guardar cambios' : 'Registrar usuario'}</Button></>}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        {form.formError && <Alert>{form.formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombres" required {...form.bind('nombres')} />
          <Input label="Apellidos" required {...form.bind('apellidos')} />
        </div>
        <Input label="Correo" type="email" required placeholder="nombre@innovatech.com" {...form.bind('correo')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Área" required list="areas-lista" {...form.bind('area')} />
          <Select label="Rol" required {...form.bind('rol')} options={Object.entries(ROL_LABEL).map(([value, label]) => ({ value, label }))} />
        </div>
        <datalist id="areas-lista">{areas.map((a) => <option key={a} value={a} />)}</datalist>
        <Input label={editando ? 'Nueva contraseña' : 'Contraseña'} type="password" required={!editando} autoComplete="new-password"
          hint={editando ? 'Déjala vacía para conservar la actual.' : 'Mínimo 8 caracteres con letras y números.'} {...form.bind('password')} />
      </form>
    </Modal>
  )
}

export default function Usuarios() {
  const { hasRole, user: yo } = useAuth()
  const toast = useToast()
  const esAdmin = hasRole(ROLES.ADMIN)
  const [buscar, setBuscar] = useState('')
  const [area, setArea] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState('')
  const [modal, setModal] = useState(null) // { usuario? }
  const [confirmar, setConfirmar] = useState(null)
  const [cambiando, setCambiando] = useState(false)
  const q = useDebounce(buscar)

  const { data, loading, error, reload } = useAsync(
    () => api.get('/usuarios', { buscar: q, area, rol, activo: estado === '' ? '' : estado === 'activo' }), [q, area, rol, estado])
  const todas = useAsync(() => api.get('/reportes/areas'), [data?.length])
  const areas = useMemo(() => todas.data || [], [todas.data])

  const cambiarEstado = async () => {
    setCambiando(true)
    try {
      await api.patch(`/usuarios/${confirmar.id}/${confirmar.estado ? 'deshabilitar' : 'habilitar'}`)
      toast.success(confirmar.estado ? 'Usuario deshabilitado.' : 'Usuario habilitado.')
      setConfirmar(null); reload()
    } catch (e) { toast.error(e.message); setConfirmar(null) } finally { setCambiando(false) }
  }

  const columns = [
    { key: 'nombre', header: 'Usuario', render: (u) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{(u.nombres[0] + u.apellidos[0]).toUpperCase()}</div>
        <div><p className="font-semibold text-ink-900">{u.nombres} {u.apellidos}</p><p className="text-xs text-slate-500">{u.correo}</p></div>
      </div>) },
    { key: 'area', header: 'Área' },
    { key: 'rol', header: 'Rol', render: (u) => <Badge tone={u.rol === ROLES.ADMIN ? 'teal' : u.rol === ROLES.TI ? 'blue' : 'slate'}>{ROL_LABEL[u.rol]}</Badge> },
    { key: 'estado', header: 'Estado', render: (u) => <Badge tone={u.estado ? 'emerald' : 'rose'}>{u.estado ? 'Activo' : 'Deshabilitado'}</Badge> },
    ...(esAdmin ? [{ key: 'acc', header: '', className: 'text-right', render: (u) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setModal({ usuario: u })}>Editar</Button>
        {u.id !== yo.id && (u.estado
          ? <Button size="sm" variant="ghost" icon={UserX} className="!text-rose-600" onClick={() => setConfirmar(u)}>Deshabilitar</Button>
          : <Button size="sm" variant="ghost" icon={UserCheck} className="!text-emerald-700" onClick={() => setConfirmar(u)}>Habilitar</Button>)}
      </div>) }] : []),
  ]

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Personas que pueden usar TechAsset y solicitar equipos."
        actions={esAdmin && <Button icon={Plus} onClick={() => setModal({})}>Registrar usuario</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={buscar} onChange={setBuscar} placeholder="Buscar por nombre o correo" />
        <FilterSelect value={area} onChange={setArea} options={areas} placeholder="Todas las áreas" />
        <FilterSelect value={rol} onChange={setRol} options={Object.entries(ROL_LABEL).map(([value, label]) => ({ value, label }))} placeholder="Todos los roles" />
        <FilterSelect value={estado} onChange={setEstado} options={[{ value: 'activo', label: 'Activos' }, { value: 'inactivo', label: 'Deshabilitados' }]} placeholder="Todos los estados" />
        <ClearFilters show={!!(buscar || area || rol || estado)} onClick={() => { setBuscar(''); setArea(''); setRol(''); setEstado('') }} />
      </div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} />
      {modal && <UsuarioModal usuario={modal.usuario} areas={areas} onClose={() => setModal(null)} onDone={() => { setModal(null); reload() }} />}
      <ConfirmDialog open={!!confirmar} onClose={() => setConfirmar(null)} onConfirm={cambiarEstado} loading={cambiando} danger={confirmar?.estado}
        title={confirmar?.estado ? 'Deshabilitar usuario' : 'Habilitar usuario'} confirmText={confirmar?.estado ? 'Deshabilitar' : 'Habilitar'}
        message={confirmar?.estado
          ? `${confirmar?.nombres} ${confirmar?.apellidos} ya no podrá iniciar sesión ni solicitar equipos. Su historial se conserva.`
          : `${confirmar?.nombres} ${confirmar?.apellidos} podrá volver a iniciar sesión.`} />
    </>
  )
}
