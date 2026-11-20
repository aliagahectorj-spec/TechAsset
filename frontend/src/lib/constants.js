export const ROLES = { ADMIN: 'Administrador', TI: 'Responsable', COLAB: 'Colaborador' }
export const ROL_LABEL = { Administrador: 'Administrador', Responsable: 'Responsable de TI', Colaborador: 'Colaborador' }
export const PERSONAL = [ROLES.ADMIN, ROLES.TI]

export const CATEGORIAS = ['Laptop', 'Computadora de escritorio', 'Monitor', 'Impresora', 'Tablet', 'Proyector', 'Equipo de red']
export const ESTADOS_EQUIPO = ['Disponible', 'Prestado', 'Mantenimiento', 'Baja']
export const ESTADOS_MANUALES = ['Disponible', 'Mantenimiento', 'Baja']
export const ESTADOS_PRESTAMO = ['Pendiente', 'Activo', 'Devuelto', 'Rechazado', 'Cancelado']

export const TONO_ESTADO = {
  Disponible: 'emerald', Prestado: 'blue', Mantenimiento: 'amber', Baja: 'slate',
  Pendiente: 'amber', Activo: 'blue', Devuelto: 'emerald', Rechazado: 'rose', Cancelado: 'slate', Vencido: 'rose',
}
export const COLOR_ESTADO = { Disponible: '#059669', Prestado: '#2563eb', Mantenimiento: '#d97706', Baja: '#94a3b8' }
