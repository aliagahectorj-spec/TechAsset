export const hoyISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
export const sumarDias = (iso, n) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
export const fmtFecha = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const fmtFechaHora = (iso) => new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const diasHasta = (iso) => Math.round((new Date(iso + 'T00:00:00') - new Date(hoyISO() + 'T00:00:00')) / 86400000)
export const textoPlazo = (iso) => {
  const n = diasHasta(iso)
  if (n < 0) return `vencido hace ${-n} ${-n === 1 ? 'día' : 'días'}`
  if (n === 0) return 'vence hoy'
  return `faltan ${n} ${n === 1 ? 'día' : 'días'}`
}
export const estaVencido = (p) => p.estado === 'Activo' && p.fechaDevolucion < hoyISO()

export function descargarCSV(nombre, columnas, filas) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [columnas.map((c) => esc(c.header)).join(','), ...filas.map((f) => columnas.map((c) => esc(c.value(f))).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `${nombre}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}
