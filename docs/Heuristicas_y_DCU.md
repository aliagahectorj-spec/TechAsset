# Alineación a las heurísticas de usabilidad y al Diseño Centrado en el Usuario (DCU)

Proyecto: TechAsset · Sistema de gestión de inventario y préstamo de equipos tecnológicos

## 1. Diseño Centrado en el Usuario

### 1.1 Etapa 1 · Conocer a los usuarios

| | Administrador | Responsable de TI | Colaborador |
|---|---|---|---|
| **Quién es** | Jefe o encargado de la Gerencia de Tecnología | Técnico que entrega y recibe equipos | Personal de cualquier área que necesita un equipo |
| **Qué necesita** | Control total, indicadores y trazabilidad | Atender solicitudes y devoluciones rápido | Saber qué hay disponible y pedirlo sin trámites |
| **Qué le frustra** | Hojas de cálculo desactualizadas, no saber dónde está un equipo | Duplicidad de registros, préstamos sin responsable | No saber si hay equipos ni cómo va su solicitud |
| **Tareas clave** | Gestionar usuarios y equipos, consultar reportes | Aprobar, registrar préstamos y devoluciones | Consultar equipos, solicitar, ver su historial |
| **Frecuencia** | Diaria | Varias veces al día | Ocasional |

### 1.2 Etapa 2 · Requisitos desde las necesidades
Los 17 requerimientos funcionales y las 10 reglas de negocio del caso. Del análisis de usuarios surgieron además: solicitud con aprobación, cancelación de solicitudes, avisos de vencimiento y página de ayuda.

### 1.3 Etapa 3 · Diseño de la solución
- Navegación que cambia según el rol: cada persona solo ve lo que le corresponde.
- Flujos cortos: solicitar un equipo toma 3 acciones (Equipos → Solicitar → Enviar).
- Un solo lenguaje visual: mismos botones, tablas, formularios y estados en todas las pantallas.

### 1.4 Etapa 4 · Evaluación con usuarios
Ver el plan de la sección 3.

## 2. Heurísticas de Nielsen → dónde se cumplen

| # | Heurística | Cómo se aplica en TechAsset | Dónde |
|---|---|---|---|
| 1 | **Visibilidad del estado del sistema** | Indicadores de carga en botones y tablas; avisos al guardar; estados con color; la cantidad de solicitudes pendientes (o préstamos vencidos) aparece en el menú; cada préstamo activo muestra "faltan N días" o "vencido hace N días" | `Layout.jsx`, `ToastContext.jsx`, `Prestamos.jsx` |
| 2 | **Coincidencia con el mundo real** | Lenguaje de la institución: Solicitar, Devolver, Disponible, Baja, Código patrimonial. Fechas en formato local ("18 nov 2026") | Todas las pantallas, `format.js` |
| 3 | **Control y libertad del usuario** | Cancelar y cerrar con Esc en toda ventana; el colaborador puede **cancelar su solicitud** mientras está pendiente; botón **Limpiar filtros**; los usuarios deshabilitados se pueden volver a habilitar | `Modal.jsx`, `Prestamos.jsx`, `ClearFilters` |
| 4 | **Consistencia y estándares** | Componentes únicos (`Button`, `Input`, `Select`, `Badge`, `DataTable`, `Modal`); mismo patrón de pantalla: título, filtros, tabla, acciones; estados siempre con el mismo color | `components/ui`, `DataTable.jsx` |
| 5 | **Prevención de errores** | Solo se listan equipos Disponibles para prestar; fechas con mínimo permitido; confirmación antes de deshabilitar o eliminar; **aviso al cerrar un formulario con datos sin guardar**; reglas RN-01 a RN-10 aplicadas también en la base de datos | `PrestamoModals.jsx`, `Modal.jsx`, `ConfirmDialog`, `AppDbContext.cs` |
| 6 | **Reconocer antes que recordar** | Listas desplegables en lugar de escribir códigos; menú siempre visible; botón **mostrar/ocultar contraseña**; botones de demostración en el login; opciones de la fila siempre a la vista | `ui/index.jsx`, `LoginModal.jsx` |
| 7 | **Flexibilidad y eficiencia** | Atajo **/** para ir al buscador; búsqueda en vivo; filtros combinables; **exportar a CSV** en equipos, préstamos y reportes; Enter guarda el formulario; pestañas con contadores | `SearchInput`, `Prestamos.jsx`, `Reportes.jsx` |
| 8 | **Diseño estético y minimalista** | Una sola acción principal por pantalla; sin información decorativa; el color se reserva para estados y acciones; gráficos solo donde aportan (dashboard y reportes) | `Dashboard.jsx` |
| 9 | **Ayudar a reconocer, diagnosticar y recuperarse de errores** | Mensaje bajo cada campo con cómo corregirlo; el **foco salta al primer campo con error**; errores del servidor mostrados en el campo correspondiente; mensajes de reglas de negocio en lenguaje claro; reintento ante fallo de carga | `useForm.js`, `ErrorHandlingMiddleware`, `ErrorState` |
| 10 | **Ayuda y documentación** | Página **Ayuda** adaptada al rol (primeros pasos, flujo del préstamo, reglas, significado de estados, atajos y preguntas frecuentes); textos de apoyo bajo los campos; estados vacíos que explican qué hacer | `Ayuda.jsx`, `EmptyState` |

### Accesibilidad básica incluida
- Enlace "Saltar al contenido" para teclado.
- Foco visible en todos los controles; mensajes de error anunciados con `role="alert"`.
- Etiquetas `aria-label` en botones de solo ícono; diálogos con `role="dialog"`.
- Se respeta la preferencia de "reducir movimiento" del sistema.
- Diseño adaptable a celular y escritorio.

## 3. Plan de evaluación con usuarios (Etapa 4 del DCU)

**Participantes:** 5 personas (1 administrador, 1 responsable de TI y 3 colaboradores).
**Método:** pruebas de tarea con pensamiento en voz alta, 20 minutos por persona, seguidas del cuestionario SUS.

| Tarea | Rol | Éxito si… | Tiempo meta |
|---|---|---|---|
| T1. Solicitar una laptop por 7 días | Colaborador | Envía la solicitud sin ayuda | < 1 min |
| T2. Cancelar la solicitud | Colaborador | La encuentra y la cancela | < 30 s |
| T3. Aprobar una solicitud pendiente | Responsable | Usa el aviso del menú | < 1 min |
| T4. Registrar una devolución con observaciones | Responsable | Completa sin errores | < 1 min |
| T5. Registrar un equipo nuevo | Administrador | Lo registra y lo encuentra en el listado | < 1.5 min |
| T6. Saber qué área usa más los equipos | Administrador | Lo lee del dashboard o reportes | < 30 s |

**Métricas:** tasa de éxito (meta ≥ 90 %), tiempo por tarea, errores cometidos y puntaje SUS (meta ≥ 68).
**Registro:** observaciones, problemas encontrados, severidad (alta, media, baja) y mejora propuesta.

## 4. Conclusión para el informe
La interfaz de TechAsset se diseñó a partir de tres perfiles de usuario con necesidades distintas y aplica las 10 heurísticas de Nielsen: informa el estado del sistema, previene errores antes de que ocurran, permite deshacer y cancelar, mantiene un comportamiento coherente en todas las pantallas y ofrece ayuda contextual. Esto reduce el tiempo de aprendizaje, los errores de registro y la dependencia del personal de TI.
