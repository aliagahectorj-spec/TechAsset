import { forwardRef, useEffect, useRef, useState } from 'react'
import { Loader2, Search, AlertCircle, Inbox, Eye, EyeOff, FilterX } from 'lucide-react'
import { TONO_ESTADO } from '../../lib/constants'

const cx = (...c) => c.filter(Boolean).join(' ')

// ---------- Botón ----------
const BTN = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
}
export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className, ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2.5 text-sm',
        BTN[variant], className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}

// ---------- Campos de formulario ----------
const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500'

export function Field({ label, error, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {error ? <span role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600"><AlertCircle className="h-3.5 w-3.5" />{error}</span>
        : hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export const Input = forwardRef(function Input({ label, error, hint, required, className, type, ...props }, ref) {
  const [ver, setVer] = useState(false)
  const esClave = type === 'password'
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        <input ref={ref} {...props} type={esClave && ver ? 'text' : type} aria-invalid={!!error}
          className={cx(inputBase, error ? 'border-rose-400' : 'border-slate-300', esClave && 'pr-11', className)} />
        {esClave && (
          <button type="button" tabIndex={-1} onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600">
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Field>
  )
})

export function Select({ label, error, hint, required, options, placeholder, children, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <select {...props} aria-invalid={!!error} className={cx(inputBase, 'appearance-auto', error ? 'border-rose-400' : 'border-slate-300')}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options?.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
        {children}
      </select>
    </Field>
  )
}

export function Textarea({ label, error, hint, required, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <textarea rows={3} {...props} aria-invalid={!!error} className={cx(inputBase, 'resize-none', error ? 'border-rose-400' : 'border-slate-300')} />
    </Field>
  )
}

/** Búsqueda con atajo de teclado: presiona "/" en cualquier parte de la pantalla para escribir. */
export function SearchInput({ value, onChange, placeholder = 'Buscar…' }) {
  const ref = useRef(null)
  useEffect(() => {
    const atajo = (e) => {
      const enCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (e.key === '/' && !enCampo && !document.querySelector('[role=dialog]')) { e.preventDefault(); ref.current?.focus() }
    }
    document.addEventListener('keydown', atajo)
    return () => document.removeEventListener('keydown', atajo)
  }, [])
  return (
    <div className="relative min-w-[14rem] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className={cx(inputBase, 'border-slate-300 pl-9 pr-9')} />
      {!value && <kbd title="Atajo: presiona / para buscar" className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-300 bg-slate-50 px-1.5 text-[11px] font-semibold text-slate-400 sm:block">/</kbd>}
    </div>
  )
}

export function ClearFilters({ show, onClick }) {
  return show ? <Button size="sm" variant="ghost" icon={FilterX} onClick={onClick}>Limpiar filtros</Button> : null
}

export function FilterSelect({ value, onChange, options, placeholder, label }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label || placeholder}
      className={cx(inputBase, 'w-auto min-w-[10rem] border-slate-300')}>
      <option value="">{placeholder}</option>
      {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  )
}

// ---------- Visuales ----------
const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/20',
}
export function Badge({ children, tone, estado }) {
  const t = TONES[tone || TONO_ESTADO[estado || children] || 'slate']
  return <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', t)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{children}
  </span>
}

/** Código patrimonial presentado como etiqueta de activo. */
export function AssetTag({ children }) {
  return <span className="inline-block rounded-md border border-slate-300 border-l-[3px] border-l-teal-700 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">{children}</span>
}

export function Card({ className, children, ...p }) {
  return <div {...p} className={cx('rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,27,45,.05)]', className)}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Spinner({ label = 'Cargando…' }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-teal-700" />{label}</div>
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3"><Inbox className="h-6 w-6 text-slate-400" /></div>
      <p className="font-semibold text-slate-700">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Alert({ children, tone = 'rose' }) {
  const t = tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900'
  return <div role="alert" className={cx('flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm', t)}><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{children}</span></div>
}

export function ErrorState({ error, onRetry }) {
  return <div className="p-6"><Alert>{error?.message || 'No se pudo cargar la información.'} <button onClick={onRetry} className="ml-1 font-semibold underline">Reintentar</button></Alert></div>
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-200/60 p-1" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
            value === t.value ? 'bg-white text-ink-900 shadow-sm' : 'text-slate-600 hover:text-ink-900')}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs text-slate-400">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'teal' }) {
  const bg = { teal: 'bg-teal-50 text-teal-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', emerald: 'bg-emerald-50 text-emerald-700', rose: 'bg-rose-50 text-rose-700', slate: 'bg-slate-100 text-slate-600' }[tone]
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className={cx('rounded-lg p-2', bg)}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>}
    </Card>
  )
}
