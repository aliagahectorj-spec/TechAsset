import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { rules } from '../lib/validators'
import { Alert, Button, Input } from './ui'
import { Modal } from './Modal'

const DEMO = [
  { rol: 'Administrador', correo: 'admin@innovatech.com', password: 'Admin123*' },
  { rol: 'Responsable de TI', correo: 'tecnologia@innovatech.com', password: 'Tecno123*' },
  { rol: 'Colaborador', correo: 'colaborador@innovatech.com', password: 'Colab123*' },
]

/** Ventana de inicio de sesión que se abre sobre la pantalla principal. */
export default function LoginModal({ open, onClose }) {
  const { login } = useAuth()
  const form = useForm({ correo: '', password: '' }, {
    correo: [rules.required('Ingresa tu correo.'), rules.email()],
    password: [rules.required('Ingresa tu contraseña.')],
  })
  const entrar = form.handleSubmit((v) => login(v.correo, v.password))

  return (
    <Modal open={open} onClose={onClose} title="Inicia sesión" subtitle="Usa tu correo institucional para entrar a TechAsset.">
      <img src="/logo-techasset.png" alt="Logo de TechAsset" className="mx-auto mb-5 h-20 w-auto" />
      <form onSubmit={entrar} noValidate className="space-y-4">
        {form.formError && <Alert>{form.formError}</Alert>}
        <Input label="Correo" type="email" autoFocus autoComplete="username" placeholder="nombre@innovatech.com" {...form.bind('correo')} />
        <Input label="Contraseña" type="password" autoComplete="current-password" placeholder="••••••••" {...form.bind('password')} />
        <Button type="submit" loading={form.submitting} className="w-full">Entrar</Button>
      </form>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-3.5">
        <p className="text-[13px] font-semibold text-slate-600">Cuentas de demostración</p>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {DEMO.map((d) => (
            <button key={d.rol} type="button" onClick={() => { form.setField('correo', d.correo); form.setField('password', d.password) }}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 py-2 text-left text-[13px] hover:bg-teal-50">
              <span className="font-semibold text-slate-700">{d.rol}</span>
              <span className="truncate text-slate-500">{d.correo}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
