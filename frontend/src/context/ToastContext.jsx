import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const quitar = (id) => setItems((l) => l.filter((t) => t.id !== id))
  const push = useCallback((tipo, mensaje) => {
    const id = crypto.randomUUID()
    setItems((l) => [...l, { id, tipo, mensaje }])
    setTimeout(() => quitar(id), 4500)
  }, [])
  const toast = { success: (m) => push('ok', m), error: (m) => push('error', m) }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="anim-toast flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg">
            {t.tipo === 'ok' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />}
            <p className="flex-1 text-sm text-slate-700">{t.mensaje}</p>
            <button onClick={() => quitar(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
