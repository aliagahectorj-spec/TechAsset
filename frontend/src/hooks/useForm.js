import { useState, useCallback, useRef } from 'react'
import { validate } from '../lib/validators'

const enfocarPrimerError = () => setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0)

/** Formulario reutilizable: estado, validación en cliente, errores del backend, cambios sin guardar y foco en el error. */
export function useForm(initial, schema = {}) {
  const inicial = useRef(JSON.stringify(initial))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const dirty = JSON.stringify(values) !== inicial.current

  const setField = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e))
  }, [])

  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    error: errors[name],
    onChange: (e) => setField(name, e.target.value),
  })

  const handleSubmit = (onValid) => async (e) => {
    e?.preventDefault()
    setFormError(null)
    const clientErrors = validate(values, schema)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) { enfocarPrimerError(); return }
    setSubmitting(true)
    try {
      await onValid(values)
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length) { setErrors(err.errors); setFormError(null); enfocarPrimerError() }
      else setFormError(err.message || 'No se pudo completar la operación.')
    } finally {
      setSubmitting(false)
    }
  }

  return { values, errors, formError, submitting, dirty, setField, bind, handleSubmit }
}
