import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui'

/**
 * Ventana modal. Con `dirty` pide confirmación antes de descartar cambios cuando se cierra
 * por accidente (Esc, clic fuera o la X). Los botones "Cancelar" cierran directamente.
 */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', dirty = false }) {
  const [descartar, setDescartar] = useState(false)
  const intentarCerrar = useCallback(() => (dirty ? setDescartar(true) : onClose()), [dirty, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') (descartar ? setDescartar(false) : intentarCerrar()) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, intentarCerrar, descartar])

  if (!open) return null
  const w = { md: 'max-w-lg', lg: 'max-w-2xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]" onClick={intentarCerrar} />
      <div className={`anim-pop relative flex max-h-[92vh] w-full ${w} flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={intentarCerrar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 sm:rounded-b-2xl">{footer}</div>}

        {descartar && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/95 p-6 text-center" role="alertdialog" aria-label="Descartar cambios">
            <div className="max-w-xs">
              <p className="text-lg font-bold text-ink-900">¿Descartar los cambios?</p>
              <p className="mt-1 text-sm text-slate-500">Llenaste datos que todavía no se guardaron. Si sales ahora, se perderán.</p>
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="secondary" onClick={() => setDescartar(false)} autoFocus>Seguir editando</Button>
                <Button variant="danger" onClick={onClose}>Descartar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirmar', danger, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button></>}>
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
    </Modal>
  )
}
