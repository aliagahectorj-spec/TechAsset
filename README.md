# TechAsset · Inventario y préstamo de equipos tecnológicos

Caso práctico integrador — Construcción de Software · Innovatech Solutions S.A.C.

| Capa | Tecnología |
|---|---|
| Backend | ASP.NET Core 8 · Entity Framework Core · Swagger · JWT |
| Base de datos | PostgreSQL 16 (Docker o instalación local) |
| Frontend | React 18 · Vite · Tailwind CSS 4 · Recharts |

## 1. Requisitos
- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (o PostgreSQL instalado localmente)
- Visual Studio Code (extensiones recomendadas: *C# Dev Kit*, *ES7+ React snippets*, *Tailwind CSS IntelliSense*)

## 2. Arranque (3 terminales en VS Code: Ctrl + ñ)

**Terminal 1 · Base de datos**
```bash
docker compose up -d --wait
```
Crea PostgreSQL en `localhost:5432` (usuario `postgres`, clave `postgres`, base `techasset`).
Sin Docker: instala PostgreSQL, ejecuta `CREATE DATABASE techasset;` y ajusta la cadena en `backend/TechAsset.Api/appsettings.json`.

**Terminal 2 · Backend**
```bash
cd backend/TechAsset.Api
dotnet run
```
Al iniciar, la API **crea las tablas** automáticamente y carga **datos de demostración**.
Swagger: http://localhost:5080/swagger

**Terminal 3 · Frontend**
```bash
cd frontend
npm install
npm run dev
```
Abre http://localhost:5173

## 3. Cuentas de demostración
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@innovatech.com | Admin123* |
| Responsable de TI | tecnologia@innovatech.com | Tecno123* |
| Colaborador | colaborador@innovatech.com | Colab123* |

## 4. Tablas de la base de datos
`usuarios`, `equipos`, `prestamos`, `movimientos` — ver `database/schema.sql` (el mismo esquema que genera la API).
Se agregaron a las tablas referenciales: `Rol` y `PasswordHash` (usuarios), `Ubicacion` (equipos), `Estado`, `Motivo`, `FechaDevolucionReal` y `ResponsableId` (préstamos, necesarios para RN-05 y el flujo de aprobación) y la tabla `movimientos` (RF-17).

## 5. Requerimientos funcionales → dónde están
| RF | Funcionalidad | Backend | Pantalla |
|---|---|---|---|
| RF-01 a RF-04 | Registrar, actualizar, consultar y deshabilitar usuarios | `UsuariosController` / `UsuarioService` | Usuarios |
| RF-05 a RF-08 | Registrar, actualizar, consultar equipos y cambiar estado | `EquiposController` / `EquipoService` | Equipos |
| RF-09 | Registrar préstamo (y solicitud + aprobación) | `PrestamosController` / `PrestamoService` | Préstamos |
| RF-10 | Registrar devolución | `POST /api/prestamos/{id}/devolucion` | Préstamos → Devolver |
| RF-11, RF-12 | Historial y préstamos activos | `GET /api/prestamos` | Préstamos (pestañas) |
| RF-13 | Dashboard | `GET /api/reportes/dashboard` | Dashboard |
| RF-14 | Equipos por estado | `GET /api/reportes/equipos-por-estado` | Reportes |
| RF-15 | Equipos más utilizados | `GET /api/reportes/equipos-mas-utilizados` | Reportes |
| RF-16 | Préstamos por área | `GET /api/reportes/prestamos-por-area` | Reportes |
| RF-17 | Historial de movimientos | `GET /api/movimientos` | Movimientos |

## 6. Reglas de negocio → dónde se aplican
| RN | Regla | Aplicación |
|---|---|---|
| RN-01 | Un equipo, un préstamo activo | `PrestamoService.EquipoPrestableAsync` + índice único parcial `ux_prestamo_activo_por_equipo` |
| RN-02 / RN-03 | No prestar equipos en Mantenimiento / Baja | `PrestamoService.EquipoPrestableAsync` |
| RN-04 | Devolución posterior al préstamo | `PrestamoService.ValidarFechas` + `CHECK ck_prestamos_fechas` + validación del formulario |
| RN-05 | Todo préstamo tiene responsable | `ResponsableId` se asigna al registrar o aprobar |
| RN-06 | No eliminar equipos con historial | `EquipoService.EliminarAsync` + FK `RESTRICT` |
| RN-07 | Código patrimonial único | Índice único + validación en `EquipoService` |
| RN-08 | Correo único | Índice único + validación en `UsuarioService` |
| RN-09 | Solo el Administrador deshabilita usuarios | `[Authorize(Roles = "Administrador")]` + verificación en `UsuarioService` |
| RN-10 | Devolución con observaciones | `DevolucionRequest` (`[Required]`) + `PrestamoService.DevolverAsync` + formulario |

## 7. Permisos por rol
- **Administrador**: todo (usuarios, equipos, préstamos, reportes, movimientos).
- **Responsable de TI**: equipos, aprobar/rechazar/registrar préstamos, devoluciones, reportes, consulta de usuarios.
- **Colaborador**: ver equipos disponibles, solicitar préstamos y ver su propio historial.

## 8. Estructura
```
TechAsset/
├─ docker-compose.yml
├─ database/schema.sql
├─ docs/Heuristicas_y_DCU.md
├─ backend/TechAsset.Api/
│  ├─ Domain/          Entidades y constantes (POO)
│  ├─ Data/            DbContext y datos de ejemplo
│  ├─ Dtos/            Contratos con validaciones (backend)
│  ├─ Services/        Lógica y reglas de negocio
│  ├─ Controllers/     Endpoints REST
│  └─ Infrastructure/  Manejo uniforme de errores
└─ frontend/src/
   ├─ components/      Modal, DataTable, Layout, ui/ (Button, Input, Badge…)
   ├─ hooks/           useForm, useAsync
   ├─ lib/             api, validators, format, constants
   ├─ context/         Auth y notificaciones
   └─ pages/           Login, Dashboard, Usuarios, Equipos, Préstamos, Reportes, Movimientos
```

## 9. Estándares aplicados (para el informe técnico)
- Ciclo de vida sugerido: **iterativo-incremental** (módulos: usuarios → equipos → préstamos → reportes).
- Nombres en español de dominio, PascalCase (C#) y camelCase (JS); una responsabilidad por clase.
- Validación doble: frontend (`validators.js` + `useForm`) y backend (DataAnnotations + reglas en servicios). El frontend muestra los errores del backend campo por campo.
- Reutilización: `DataTable`, `Modal`, `Field/Input/Select`, `useForm`, `useAsync`, `PrestamoModal` (registro y solicitud con el mismo componente).
- Refinamiento: reglas de negocio centralizadas en servicios (`ValidarFechas`, `EquipoPrestableAsync`), manejo de errores en un middleware, bitácora en una sola clase.

## 10. Usabilidad (heurísticas de Nielsen y DCU)
El detalle de cómo se aplican las 10 heurísticas, los perfiles de usuario y el plan de pruebas está en [`docs/Heuristicas_y_DCU.md`](docs/Heuristicas_y_DCU.md). Dentro del sistema, la pantalla **Ayuda** explica el uso según el rol.

## 11. Solución de problemas
- *"Esperando a PostgreSQL"* en el log: la base aún arranca; la API reintenta sola.
- Puerto ocupado: cambia `Urls` en `appsettings.json` y el `proxy` en `frontend/vite.config.js`.
- Reiniciar datos de demostración: `docker compose down -v && docker compose up -d --wait`.
