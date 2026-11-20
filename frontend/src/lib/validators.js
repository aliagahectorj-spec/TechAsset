// Validaciones de frontend reutilizables (espejo de las reglas del backend).
const vacio = (v) => v === undefined || v === null || String(v).trim() === ''

export const rules = {
  required: (msg = 'Este campo es obligatorio.') => (v) => (vacio(v) ? msg : null),
  email: (msg = 'Ingresa un correo válido.') => (v) => (vacio(v) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : msg),
  max: (n) => (v) => (!vacio(v) && String(v).length > n ? `Máximo ${n} caracteres.` : null),
  min: (n) => (v) => (!vacio(v) && String(v).length < n ? `Mínimo ${n} caracteres.` : null),
  pattern: (re, msg) => (v) => (vacio(v) || re.test(v) ? null : msg),
  password: (msg = 'Mínimo 8 caracteres con letras y números.') => (v) => (vacio(v) || /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v) ? null : msg),
  notBefore: (getMin, msg) => (v, all) => (vacio(v) || v >= getMin(all) ? null : msg),
  after: (getRef, msg) => (v, all) => (vacio(v) || !getRef(all) || v > getRef(all) ? null : msg),
}

export function validate(values, schema) {
  const errors = {}
  for (const [campo, reglas] of Object.entries(schema)) {
    for (const regla of reglas) {
      const msg = regla(values[campo], values)
      if (msg) { errors[campo] = msg; break }
    }
  }
  return errors
}
