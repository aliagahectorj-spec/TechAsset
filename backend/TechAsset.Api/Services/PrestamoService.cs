using Microsoft.EntityFrameworkCore;
using TechAsset.Api.Data;
using TechAsset.Api.Domain;
using TechAsset.Api.Dtos;
using TechAsset.Api.Infrastructure;

namespace TechAsset.Api.Services;

public class PrestamoFiltro
{
    public string? Estado { get; set; }
    public string? Buscar { get; set; }
    public string? Area { get; set; }
    public DateOnly? Desde { get; set; }
    public DateOnly? Hasta { get; set; }
    public bool? Vencidos { get; set; }
}

public class PrestamoService(AppDbContext db, MovimientoService mov)
{
    private static DateOnly Hoy => DateOnly.FromDateTime(DateTime.Now);

    private static IQueryable<PrestamoDto> Proyectar(IQueryable<Prestamo> q) => q.Select(p => new PrestamoDto(
        p.Id, p.FechaPrestamo, p.FechaDevolucion, p.FechaDevolucionReal, p.Estado, p.Motivo, p.Observacion,
        p.UsuarioId, p.Usuario.Nombres + " " + p.Usuario.Apellidos, p.Usuario.Area,
        p.EquipoId, p.Equipo.Nombre, p.Equipo.CodigoPatrimonial,
        p.ResponsableId, p.Responsable == null ? null : p.Responsable.Nombres + " " + p.Responsable.Apellidos));

    // ---------- Consultas (RF-11, RF-12) ----------
    public async Task<List<PrestamoDto>> ListarAsync(PrestamoFiltro f, Guid actorId, string actorRol)
    {
        var q = db.Prestamos.AsNoTracking().AsQueryable();
        if (actorRol == Roles.Colaborador) q = q.Where(p => p.UsuarioId == actorId); // el colaborador solo ve su historial
        if (!string.IsNullOrWhiteSpace(f.Estado)) q = q.Where(p => p.Estado == f.Estado);
        if (!string.IsNullOrWhiteSpace(f.Area)) q = q.Where(p => p.Usuario.Area == f.Area);
        if (f.Desde is not null) q = q.Where(p => p.FechaPrestamo >= f.Desde);
        if (f.Hasta is not null) q = q.Where(p => p.FechaPrestamo <= f.Hasta);
        if (f.Vencidos == true) { var hoy = Hoy; q = q.Where(p => p.Estado == EstadosPrestamo.Activo && p.FechaDevolucion < hoy); }
        if (!string.IsNullOrWhiteSpace(f.Buscar))
        {
            var b = $"%{f.Buscar.Trim()}%";
            q = q.Where(p => EF.Functions.ILike(p.Usuario.Nombres + " " + p.Usuario.Apellidos, b)
                || EF.Functions.ILike(p.Equipo.Nombre, b) || EF.Functions.ILike(p.Equipo.CodigoPatrimonial, b));
        }
        return await Proyectar(q.OrderByDescending(p => p.FechaPrestamo).ThenByDescending(p => p.CreadoEn)).ToListAsync();
    }

    // ---------- RF-09: registrar préstamo (lo hace el personal de TI; queda activo) ----------
    public async Task<PrestamoDto> RegistrarAsync(RegistrarPrestamoRequest r, Guid actorId)
    {
        ValidarFechas(r.FechaPrestamo!.Value, r.FechaDevolucion!.Value);
        var usuario = await UsuarioActivoAsync(r.UsuarioId!.Value);
        var equipo = await EquipoPrestableAsync(r.EquipoId!.Value);

        var p = new Prestamo
        {
            FechaPrestamo = r.FechaPrestamo.Value, FechaDevolucion = r.FechaDevolucion.Value, Motivo = r.Motivo?.Trim(),
            UsuarioId = usuario.Id, EquipoId = equipo.Id, ResponsableId = actorId, Estado = EstadosPrestamo.Activo // RN-05
        };
        equipo.Estado = EstadosEquipo.Prestado;
        db.Prestamos.Add(p);
        mov.Registrar("Préstamo", "Prestamo", p.Id, $"Se prestó {equipo.CodigoPatrimonial} · {equipo.Nombre} a {usuario.NombreCompleto}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(p.Id);
    }

    // ---------- Solicitud del colaborador (queda pendiente de aprobación) ----------
    public async Task<PrestamoDto> SolicitarAsync(SolicitarPrestamoRequest r, Guid actorId)
    {
        ValidarFechas(r.FechaPrestamo!.Value, r.FechaDevolucion!.Value);
        var usuario = await UsuarioActivoAsync(actorId);
        var equipo = await EquipoPrestableAsync(r.EquipoId!.Value);
        if (await db.Prestamos.AnyAsync(x => x.EquipoId == equipo.Id && x.UsuarioId == actorId && x.Estado == EstadosPrestamo.Pendiente))
            throw new ReglaNegocioException("Ya tienes una solicitud pendiente para este equipo.", "equipoId");

        var p = new Prestamo
        {
            FechaPrestamo = r.FechaPrestamo.Value, FechaDevolucion = r.FechaDevolucion.Value, Motivo = r.Motivo?.Trim(),
            UsuarioId = usuario.Id, EquipoId = equipo.Id, Estado = EstadosPrestamo.Pendiente
        };
        db.Prestamos.Add(p);
        mov.Registrar("Solicitud", "Prestamo", p.Id, $"{usuario.NombreCompleto} solicitó {equipo.CodigoPatrimonial} · {equipo.Nombre}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(p.Id);
    }

    public async Task<PrestamoDto> AprobarAsync(Guid id, Guid actorId)
    {
        var p = await CargarAsync(id);
        if (p.Estado != EstadosPrestamo.Pendiente) throw new ReglaNegocioException("Solo se pueden aprobar solicitudes pendientes.");
        if (!p.Usuario.Estado) throw new ReglaNegocioException("El usuario solicitante está deshabilitado.");
        await EquipoPrestableAsync(p.EquipoId);
        if (p.FechaPrestamo < Hoy) p.FechaPrestamo = Hoy;
        if (p.FechaDevolucion <= p.FechaPrestamo) throw new ReglaNegocioException("La fecha de devolución ya no es posterior a la fecha de préstamo. Rechaza la solicitud y pide una nueva.");
        p.Estado = EstadosPrestamo.Activo;
        p.ResponsableId = actorId; // RN-05
        p.Equipo.Estado = EstadosEquipo.Prestado;
        mov.Registrar("Aprobación", "Prestamo", p.Id, $"Se aprobó el préstamo de {p.Equipo.CodigoPatrimonial} a {p.Usuario.NombreCompleto}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(id);
    }

    public async Task<PrestamoDto> RechazarAsync(Guid id, RechazarRequest r, Guid actorId)
    {
        var p = await CargarAsync(id);
        if (p.Estado != EstadosPrestamo.Pendiente) throw new ReglaNegocioException("Solo se pueden rechazar solicitudes pendientes.");
        p.Estado = EstadosPrestamo.Rechazado;
        p.ResponsableId = actorId;
        p.Observacion = r.Motivo?.Trim();
        mov.Registrar("Rechazo", "Prestamo", p.Id, $"Se rechazó la solicitud de {p.Equipo.CodigoPatrimonial} de {p.Usuario.NombreCompleto}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(id);
    }

    /// <summary>El colaborador puede retirar su propia solicitud mientras siga pendiente.</summary>
    public async Task<PrestamoDto> CancelarAsync(Guid id, Guid actorId, string actorRol)
    {
        var p = await CargarAsync(id);
        if (actorRol == Roles.Colaborador && p.UsuarioId != actorId)
            throw new ReglaNegocioException("Solo puedes cancelar tus propias solicitudes.");
        if (p.Estado != EstadosPrestamo.Pendiente)
            throw new ReglaNegocioException("Solo se pueden cancelar solicitudes pendientes.");
        p.Estado = EstadosPrestamo.Cancelado;
        mov.Registrar("Cancelación", "Prestamo", p.Id, $"{p.Usuario.NombreCompleto} canceló su solicitud de {p.Equipo.CodigoPatrimonial}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(id);
    }

    // ---------- RF-10: devolución ----------
    public async Task<PrestamoDto> DevolverAsync(Guid id, DevolucionRequest r, Guid actorId)
    {
        var p = await CargarAsync(id);
        if (p.Estado != EstadosPrestamo.Activo) throw new ReglaNegocioException("Solo se pueden devolver préstamos activos.");
        if (string.IsNullOrWhiteSpace(r.Observaciones)) // RN-10
            throw new ReglaNegocioException("Toda devolución debe registrar observaciones.", "observaciones");

        var real = r.FechaDevolucionReal ?? Hoy;
        if (real < p.FechaPrestamo) throw new ReglaNegocioException("La fecha de devolución no puede ser anterior al préstamo.", "fechaDevolucionReal");
        if (real > Hoy) throw new ReglaNegocioException("La fecha de devolución no puede ser futura.", "fechaDevolucionReal");

        var estadoEquipo = string.IsNullOrWhiteSpace(r.EstadoEquipo) ? EstadosEquipo.Disponible : r.EstadoEquipo;
        if (estadoEquipo is not (EstadosEquipo.Disponible or EstadosEquipo.Mantenimiento))
            throw new ReglaNegocioException("El equipo solo puede quedar Disponible o en Mantenimiento.", "estadoEquipo");

        p.Estado = EstadosPrestamo.Devuelto;
        p.FechaDevolucionReal = real;
        p.Observacion = r.Observaciones.Trim();
        p.Equipo.Estado = estadoEquipo;
        mov.Registrar("Devolución", "Prestamo", p.Id,
            $"{p.Usuario.NombreCompleto} devolvió {p.Equipo.CodigoPatrimonial}; el equipo quedó {estadoEquipo}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(id);
    }

    public async Task<PrestamoDto> ObtenerAsync(Guid id) =>
        await Proyectar(db.Prestamos.AsNoTracking().Where(p => p.Id == id)).FirstOrDefaultAsync()
        ?? throw new NoEncontradoException("El préstamo no existe.");

    // ---------- Reglas reutilizables ----------
    /// <summary>RN-04: la devolución debe ser posterior al préstamo.</summary>
    private static void ValidarFechas(DateOnly prestamo, DateOnly devolucion)
    {
        if (prestamo < Hoy) throw new ReglaNegocioException("La fecha de préstamo no puede ser anterior a hoy.", "fechaPrestamo");
        if (devolucion <= prestamo) throw new ReglaNegocioException("La fecha de devolución debe ser posterior a la fecha de préstamo.", "fechaDevolucion");
    }

    private async Task<Usuario> UsuarioActivoAsync(Guid id)
    {
        var u = await db.Usuarios.FindAsync(id) ?? throw new ReglaNegocioException("El colaborador no existe.", "usuarioId");
        if (!u.Estado) throw new ReglaNegocioException("El colaborador está deshabilitado.", "usuarioId");
        return u;
    }

    /// <summary>RN-01, RN-02 y RN-03.</summary>
    private async Task<Equipo> EquipoPrestableAsync(Guid id)
    {
        var e = await db.Equipos.FindAsync(id) ?? throw new ReglaNegocioException("El equipo no existe.", "equipoId");
        switch (e.Estado)
        {
            case EstadosEquipo.Mantenimiento: throw new ReglaNegocioException("No se puede prestar un equipo en Mantenimiento.", "equipoId"); // RN-02
            case EstadosEquipo.Baja: throw new ReglaNegocioException("No se puede prestar un equipo dado de Baja.", "equipoId"); // RN-03
        }
        if (e.Estado == EstadosEquipo.Prestado || await db.Prestamos.AnyAsync(p => p.EquipoId == id && p.Estado == EstadosPrestamo.Activo))
            throw new ReglaNegocioException("El equipo ya tiene un préstamo activo.", "equipoId"); // RN-01
        return e;
    }

    private async Task<Prestamo> CargarAsync(Guid id) =>
        await db.Prestamos.Include(p => p.Equipo).Include(p => p.Usuario).FirstOrDefaultAsync(p => p.Id == id)
        ?? throw new NoEncontradoException("El préstamo no existe.");
}
