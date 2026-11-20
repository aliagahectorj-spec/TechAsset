import { ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROL_LABEL } from '../lib/constants'
import { Badge, Card, PageHeader } from '../components/ui'

const POR_ROL = {
  Administrador: [
    'Registra a las personas en Usuarios y asígnales un rol.',
    'Registra los equipos en Equipos con su código patrimonial.',
    'Supervisa los préstamos y los vencimientos desde Dashboard y Préstamos.',
    'Consulta Reportes y Movimientos para decidir y auditar.',
  ],
  Responsable: [
    'Revisa las solicitudes pendientes en Préstamos (el número aparece en el menú).',
    'Aprueba o rechaza cada solicitud.',
    'Cuando el equipo regrese, pulsa Devolver y anota las observaciones.',
    'Mantén al día el estado de los equipos (Disponible, Mantenimiento o Baja).',
  ],
  Colaborador: [
    'En Equipos revisa cuáles están Disponibles.',
    'Pulsa Solicitar y elige las fechas de préstamo y devolución.',
    'Espera la aprobación. Mientras esté Pendiente puedes cancelarla.',
    'Devuelve el equipo a TI en la fecha prevista.',
  ],
}

const FLUJO = [
  ['Solicitud', 'Pendiente', 'El colaborador elige un equipo disponible y las fechas.'],
  ['Aprobación', 'Activo', 'TI aprueba; el equipo pasa a estar Prestado y TI queda como responsable.'],
  ['Uso', 'Activo', 'Se muestra cuántos días faltan. Si pasa la fecha, el préstamo figura como Vencido.'],
  ['Devolución', 'Devuelto', 'TI registra la devolución con observaciones y el equipo vuelve a Disponible.'],
]

const REGLAS = [
  'Un equipo solo puede tener un préstamo activo a la vez.',
  'No se prestan equipos en Mantenimiento ni dados de Baja.',
  'La fecha de devolución debe ser posterior a la fecha de préstamo.',
  'Todo préstamo queda a nombre de un responsable de TI.',
  'Toda devolución exige observaciones (estado, accesorios, daños).',
  'Un equipo con historial de préstamos no se elimina: se da de Baja.',
  'El código patrimonial y el correo no se pueden repetir.',
  'Solo el Administrador puede deshabilitar usuarios.',
]

const ESTADOS = [
  ['Disponible', 'Listo para prestar.'], ['Prestado', 'Está con un colaborador.'], ['Mantenimiento', 'En reparación o revisión; no se presta.'], ['Baja', 'Fuera de uso definitivamente.'],
  ['Pendiente', 'Solicitud esperando aprobación.'], ['Activo', 'Préstamo en curso.'], ['Devuelto', 'Préstamo cerrado.'], ['Rechazado', 'TI no aprobó la solicitud.'], ['Cancelado', 'El colaborador retiró su solicitud.'],
]

const PREGUNTAS = [
  ['¿Por qué no aparece un equipo al registrar un préstamo?', 'Solo se listan equipos Disponibles. Revisa su estado en Equipos: puede estar Prestado, en Mantenimiento o de Baja.'],
  ['¿Cómo cambio el estado de un equipo?', 'En Equipos, pulsa el ícono de actualizar de la fila. “Prestado” no se elige a mano: cambia solo con préstamos y devoluciones.'],
  ['¿Puedo eliminar un equipo?', 'Solo el Administrador y únicamente si nunca fue prestado. Si tiene historial, dalo de Baja.'],
  ['¿Qué significa “Vencido”?', 'Es un préstamo activo cuya fecha de devolución prevista ya pasó. Aparece en rojo y en el aviso del menú.'],
  ['Me equivoqué al llenar un formulario', 'Los errores se marcan bajo cada campo con la forma de corregirlos. Si cierras el formulario con datos sin guardar, el sistema te pregunta antes de descartarlos.'],
  ['Olvidé mi contraseña', 'Pide al Administrador que la actualice desde Usuarios → Editar.'],
]

export default function Ayuda() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title="Ayuda" subtitle="Cómo usar TechAsset según tu rol, qué reglas aplica y qué significa cada estado." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-bold text-ink-900">Tus primeros pasos como {ROL_LABEL[user.rol].toLowerCase()}</h2>
          <ol className="mt-4 space-y-3">
            {POR_ROL[user.rol].map((t, i) => (
              <li key={t} className="flex gap-3 text-sm text-slate-700">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{i + 1}</span>{t}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-ink-900">Cómo avanza un préstamo</h2>
          <ol className="mt-4 space-y-3">
            {FLUJO.map(([paso, estado, texto], i) => (
              <li key={paso} className="flex gap-3 text-sm text-slate-700">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                <span><b className="text-ink-900">{paso}</b> <Badge estado={estado}>{estado}</Badge><br />{texto}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-ink-900">Reglas que aplica el sistema</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">{REGLAS.map((r) => <li key={r}>{r}</li>)}</ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-ink-900">Qué significa cada estado</h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-sm text-slate-700">
            {ESTADOS.map(([e, d]) => (<div key={e} className="contents"><dt><Badge estado={e}>{e}</Badge></dt><dd>{d}</dd></div>))}
          </dl>
        </Card>
      </div>

      <Card className="mt-4 p-6">
        <h2 className="font-bold text-ink-900">Atajos</h2>
        <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700">
          <li><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 font-semibold">/</kbd> Ir al buscador de la pantalla</li>
          <li><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 font-semibold">Esc</kbd> Cerrar una ventana</li>
          <li><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 font-semibold">Enter</kbd> Guardar un formulario</li>
          <li><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 font-semibold">Tab</kbd> Moverse entre campos</li>
        </ul>
      </Card>

      <Card className="mt-4 divide-y divide-slate-100">
        <h2 className="p-6 pb-4 font-bold text-ink-900">Preguntas frecuentes</h2>
        {PREGUNTAS.map(([q, a]) => (
          <details key={q} className="group px-6 py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-800">
              {q}<ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{a}</p>
          </details>
        ))}
      </Card>
    </>
  )
}
