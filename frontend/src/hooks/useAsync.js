import { useEffect, useState, useCallback } from 'react'

/** Carga datos asíncronos con estados de carga/error y recarga manual. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let vivo = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => vivo && setState({ data, loading: false, error: null }))
      .catch((error) => vivo && setState((s) => ({ ...s, loading: false, error })))
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}

export function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}
