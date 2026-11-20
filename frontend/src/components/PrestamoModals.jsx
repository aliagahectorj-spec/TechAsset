import { Modal } from './Modal'
import { Alert, Button, Input, Select, Textarea } from './ui'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { useForm } from '../hooks/useForm'
import { useToast } from '../context/ToastContext'
import { rules } from '../lib/validators'
import { hoyISO, sumarDias } from '../lib/format'

/** Registrar préstamo (personal de TI) o solicitarlo (colaborador): mismo formulario, distinto endpoint. */
export function PrestamoModal({ mode, equipoId = '', onClose, onDone }) {
  const solicitud = mode === 'solicitar'
  const toast = useToast()
  const usuarios = useAsync(() => (solicitud ? Promise.resolve([]) : api.get('/usuarios', { activo: true })), [solicitud])
  const equipos = useAsync(() => api.get('/equipos', { estado: 'Disponible' }))

  const form = useForm(
    { usuarioId: '', equipoId, fechaPrestamo: hoyISO(), fechaDevolucion: sumarDias(hoyISO(), 7), motivo: '' },
    {
      ...(solicitud ? {} : { usuarioId: [rules.required('Selecciona un colaborador.')] }),
      equipoId: [rules.required('Selecciona un equipo.')],
      fechaPrestamo: [rules.required('Indica la fecha de préstamo.'), rules.notBefore(() => hoyISO(), 'La fecha de préstamo no puede ser anterior a hoy.')],
      fechaDevolucion: [rules.required('Indica la fecha de devolución.'), rules.after((v) => v.fechaPrestamo, 'Debe ser posterior a la fecha de préstamo.')],
      motivo: [rules.max(300)],
    },
  )

  const guardar = form.handleSubmit(async (v) => {
    const body = { equipoId: v.equipoId, fechaPrestamo: v.fechaPrestamo, fechaDevolucion: v.fechaDevolucion, motivo: v.motivo || null }
    if (solicitud) await api.post('/prestamos/solicitar', body)
    else await api.post('/prestamos', { ...body, usuarioId: v.usuarioId })
    toast.success(solicitud ? 'Solicitud enviada. Un responsable de TI la revisará.' : 'Préstamo registrado.')
    onDone()
  })

  return (
    <Modal open onClose={onClose} dirty={form.dirty} title={solicitud ? 'Solicitar equipo' : 'Registrar préstamo'}
      subtitle={solicitud ? 'Tu solicitud quedará pendiente de aprobación.' : 'El préstamo quedará activo y a tu nombre como responsable.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={guardar} loading={form.submitting}>{solicitud ? 'Enviar solicitud' : 'Registrar préstamo'}</Button></>}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        {form.formError && <Alert>{form.formError}</Alert>}
        {!solicitud && (
          <Select label="Colaborador" required placeholder="Selecciona un colaborador" {...form.bind('usuarioId')}
            options={(usuarios.data || []).map((u) => ({ value: u.id, label: `${u.nombres} ${u.apellidos} · ${u.area}` }))} />
        )}
        <Select label="Equipo" required placeholder={equipos.loading ? 'Cargando…' : 'Selecciona un equipo disponible'} {...form.bind('equipoId')}
          hint={!equipos.loading && !equipos.data?.length ? 'No hay equipos disponibles en este momento.' : undefined}
          options={(equipos.data || []).map((e) => ({ value: e.id, label: `${e.codigoPatrimonial} · ${e.nombre}` }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha de préstamo" type="date" required min={hoyISO()} {...form.bind('fechaPrestamo')} />
          <Input label="Fecha de devolución" type="date" required min={sumarDias(form.values.fechaPrestamo || hoyISO(), 1)} {...form.bind('fechaDevolucion')} />
        </div>
        <Textarea label="Motivo" placeholder="Ej. Trabajo en campo, presentación a cliente…" {...form.bind('motivo')} />
      </form>
    </Modal>
  )
}

/** Devolución: las observaciones son obligatorias (RN-10). */
export function DevolucionModal({ prestamo, onClose, onDone }) {
  const toast = useToast()
  const form = useForm(
    { observaciones: '', fechaDevolucionReal: hoyISO(), estadoEquipo: 'Disponible' },
    {
      observaciones: [rules.required('Las observaciones son obligatorias.'), rules.max(1000)],
      fechaDevolucionReal: [
        rules.required('Indica la fecha de devolución.'),
        rules.notBefore(() => prestamo.fechaPrestamo, 'No puede ser anterior al préstamo.'),
        (v) => (v > hoyISO() ? 'No puede ser una fecha futura.' : null),
      ],
    },
  )
  const guardar = form.handleSubmit(async (v) => {
    await api.post(`/prestamos/${prestamo.id}/devolucion`, { observaciones: v.observaciones, fechaDevolucionReal: v.fechaDevolucionReal, estadoEquipo: v.estadoEquipo })
    toast.success('Devolución registrada.')
    onDone()
  })
  return (
    <Modal open onClose={onClose} dirty={form.dirty} title="Registrar devolución" subtitle={`${prestamo.codigoPatrimonial} · ${prestamo.equipo} — ${prestamo.usuario}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={guardar} loading={form.submitting}>Registrar devolución</Button></>}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        {form.formError && <Alert>{form.formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha de devolución" type="date" required max={hoyISO()} min={prestamo.fechaPrestamo} {...form.bind('fechaDevolucionReal')} />
          <Select label="Estado del equipo" {...form.bind('estadoEquipo')} options={[{ value: 'Disponible', label: 'Disponible' }, { value: 'Mantenimiento', label: 'Requiere mantenimiento' }]} />
        </div>
        <Textarea label="Observaciones" required placeholder="Estado físico, accesorios entregados, daños…" {...form.bind('observaciones')} />
      </form>
    </Modal>
  )
}

export function RechazarModal({ prestamo, onClose, onDone }) {
  const toast = useToast()
  const form = useForm({ motivo: '' }, { motivo: [rules.max(500)] })
  const guardar = form.handleSubmit(async (v) => {
    await api.post(`/prestamos/${prestamo.id}/rechazar`, { motivo: v.motivo || null })
    toast.success('Solicitud rechazada.')
    onDone()
  })
  return (
    <Modal open onClose={onClose} dirty={form.dirty} title="Rechazar solicitud" subtitle={`${prestamo.codigoPatrimonial} · ${prestamo.usuario}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="danger" onClick={guardar} loading={form.submitting}>Rechazar</Button></>}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        {form.formError && <Alert>{form.formError}</Alert>}
        <Textarea label="Motivo del rechazo" placeholder="Opcional. El colaborador lo verá en su historial." {...form.bind('motivo')} />
      </form>
    </Modal>
  )
}
