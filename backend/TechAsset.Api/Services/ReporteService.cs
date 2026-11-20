using Microsoft.EntityFrameworkCore;
using TechAsset.Api.Data;
using TechAsset.Api.Domain;
using TechAsset.Api.Dtos;

namespace TechAsset.Api.Services;

public class ReporteService(AppDbContext db)
{
    // Un préstamo "registrado" es el que llegó a entregarse (Activo o Devuelto).
    private IQueryable<Prestamo> Registrados() =>
        db.Prestamos.AsNoTracking().Where(p => p.Estado == EstadosPrestamo.Activo || p.Estado == EstadosPrestamo.Devuelto);

    public async Task<DashboardDto> DashboardAsync()
    {
        var hoy = DateOnly.FromDateTime(DateTime.Now);
        var porEstado = (await db.Equipos.AsNoTracking().GroupBy(e => e.Estado).Select(g => new { g.Key, N = g.Count() }).ToListAsync())
            .ToDictionary(x => x.Key, x => x.N);
        int N(string s) => porEstado.GetValueOrDefault(s);

        var porArea = (await Registrados().GroupBy(p => p.Usuario.Area).Select(g => new { Area = g.Key, Total = g.Count() }).ToListAsync())
            .OrderByDescending(x => x.Total).ToList();

        var desde = new DateOnly(hoy.Year, hoy.Month, 1).AddMonths(-5);
        var fechas = await Registrados().Where(p => p.FechaPrestamo >= desde).Select(p => p.FechaPrestamo).ToListAsync();
        var meses = Enumerable.Range(0, 6).Select(i => desde.AddMonths(i)).Select(m =>
            new MesDto(m.ToString("MMM yy", new System.Globalization.CultureInfo("es-PE")),
                fechas.Count(f => f.Year == m.Year && f.Month == m.Month))).ToList();

        var categorias = await db.Equipos.AsNoTracking().GroupBy(e => e.Categoria)
            .Select(g => new { g.Key, N = g.Count() }).ToListAsync();

        return new DashboardDto(
            TotalEquipos: porEstado.Values.Sum(),
            Disponibles: N(EstadosEquipo.Disponible), Prestados: N(EstadosEquipo.Prestado),
            Mantenimiento: N(EstadosEquipo.Mantenimiento), Baja: N(EstadosEquipo.Baja),
            TotalPrestamos: await Registrados().CountAsync(),
            PrestamosActivos: await db.Prestamos.CountAsync(p => p.Estado == EstadosPrestamo.Activo),
            Pendientes: await db.Prestamos.CountAsync(p => p.Estado == EstadosPrestamo.Pendiente),
            Vencidos: await db.Prestamos.CountAsync(p => p.Estado == EstadosPrestamo.Activo && p.FechaDevolucion < hoy),
            AreaMayorUso: porArea.Count > 0 ? new ConteoDto(porArea[0].Area, porArea[0].Total) : null,
            PrestamosPorMes: meses,
            EquiposPorEstado: EstadosEquipo.Todos.Select(s => new ConteoDto(s, N(s))).ToList(),
            EquiposPorCategoria: categorias.OrderByDescending(c => c.N).Select(c => new ConteoDto(c.Key, c.N)).ToList());
    }

    /// <summary>RF-15</summary>
    public async Task<List<EquipoUsoDto>> EquiposMasUtilizadosAsync(int top)
    {
        var uso = await Registrados().GroupBy(p => p.EquipoId).Select(g => new { Id = g.Key, Total = g.Count() })
            .OrderByDescending(x => x.Total).Take(Math.Clamp(top, 1, 50)).ToListAsync();
        var ids = uso.Select(u => u.Id).ToList();
        var equipos = await db.Equipos.AsNoTracking().Where(e => ids.Contains(e.Id)).ToDictionaryAsync(e => e.Id);
        return uso.Select(u => new EquipoUsoDto(u.Id, equipos[u.Id].CodigoPatrimonial, equipos[u.Id].Nombre, equipos[u.Id].Categoria, u.Total)).ToList();
    }

    /// <summary>RF-16</summary>
    public async Task<List<ConteoDto>> PrestamosPorAreaAsync() =>
        (await Registrados().GroupBy(p => p.Usuario.Area).Select(g => new { g.Key, N = g.Count() }).ToListAsync())
        .OrderByDescending(x => x.N).Select(x => new ConteoDto(x.Key, x.N)).ToList();

    /// <summary>RF-14 (resumen por estado; el detalle se consulta en /api/equipos?estado=)</summary>
    public async Task<List<ConteoDto>> EquiposPorEstadoAsync()
    {
        var d = (await db.Equipos.AsNoTracking().GroupBy(e => e.Estado).Select(g => new { g.Key, N = g.Count() }).ToListAsync())
            .ToDictionary(x => x.Key, x => x.N);
        return EstadosEquipo.Todos.Select(s => new ConteoDto(s, d.GetValueOrDefault(s))).ToList();
    }

    public Task<List<string>> AreasAsync() => db.Usuarios.AsNoTracking().Select(u => u.Area).Distinct().OrderBy(a => a).ToListAsync();
}
