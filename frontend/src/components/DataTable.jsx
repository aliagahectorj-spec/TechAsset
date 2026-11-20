import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, EmptyState, Spinner, ErrorState } from './ui'

/** Tabla reutilizable con carga, error, vacío y paginación en cliente. */
export function DataTable({ columns, rows, loading, error, onRetry, empty, pageSize = 10, rowKey = (r) => r.id }) {
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [rows])
  if (loading && !rows?.length) return <Card><Spinner /></Card>
  if (error) return <Card><ErrorState error={error} onRetry={onRetry} /></Card>
  if (!rows?.length) return <Card>{empty || <EmptyState title="Sin resultados" text="Prueba con otros filtros." />}</Card>

  const pages = Math.ceil(rows.length / pageSize)
  const visible = rows.slice(page * pageSize, page * pageSize + pageSize)
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[13px] text-slate-500">
              {columns.map((c) => <th key={c.key} className={`whitespace-nowrap px-4 py-3 font-semibold ${c.className || ''}`}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((r) => (
              <tr key={rowKey(r)} className="transition-colors hover:bg-slate-50/70">
                {columns.map((c) => <td key={c.key} className={`px-4 py-3 align-middle text-slate-700 ${c.className || ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[13px] text-slate-500">
        <span>{rows.length} {rows.length === 1 ? 'registro' : 'registros'}</span>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-2 font-medium text-slate-700">{page + 1} / {pages}</span>
            <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-40" aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </Card>
  )
}
