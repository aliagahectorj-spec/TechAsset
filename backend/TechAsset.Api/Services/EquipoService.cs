using Microsoft.EntityFrameworkCore;
using TechAsset.Api.Data;
using TechAsset.Api.Domain;
using TechAsset.Api.Dtos;
using TechAsset.Api.Infrastructure;

namespace TechAsset.Api.Services;

public class EquipoService(AppDbContext db, MovimientoService mov)
{
    private IQueryable<EquipoDto> Proyectar(IQueryable<Equipo> q) => q.Select(e => new EquipoDto(
        e.Id, e.CodigoPatrimonial, e.Nombre, e.Categoria, e.Marca, e.Estado, e.Ubicacion,
        e.Prestamos.Count(p => p.Estado == EstadosPrestamo.Activo || p.Estado == EstadosPrestamo.Devuelto),
        e.Prestamos.Where(p => p.Estado == EstadosPrestamo.Activo).Select(p => p.Usuario.Nombres + " " + p.Usuario.Apellidos).FirstOrDefault()));

    public async Task<List<EquipoDto>> ListarAsync(string? buscar, string? estado, string? categoria)
    {
        var q = db.Equipos.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var b = $"%{buscar.Trim()}%";
            q = q.Where(e => EF.Functions.ILike(e.Nombre, b) || EF.Functions.ILike(e.CodigoPatrimonial, b) || EF.Functions.ILike(e.Marca, b));
        }
        if (!string.IsNullOrWhiteSpace(estado)) q = q.Where(e => e.Estado == estado);
        if (!string.IsNullOrWhiteSpace(categoria)) q = q.Where(e => e.Categoria == categoria);
        return await Proyectar(q.OrderBy(e => e.CodigoPatrimonial)).ToListAsync();
    }

    public async Task<EquipoDto> ObtenerAsync(Guid id) =>
        await Proyectar(db.Equipos.AsNoTracking().Where(e => e.Id == id)).FirstOrDefaultAsync()
        ?? throw new NoEncontradoException("El equipo no existe.");

    public async Task<EquipoDto> CrearAsync(EquipoRequest r, Guid actorId)
    {
        await ValidarAsync(r, null);
        var e = new Equipo
        {
            CodigoPatrimonial = r.CodigoPatrimonial.Trim().ToUpperInvariant(), Nombre = r.Nombre.Trim(), Categoria = r.Categoria,
            Marca = r.Marca.Trim(), Ubicacion = r.Ubicacion?.Trim(), Estado = EstadosEquipo.Disponible
        };
        db.Equipos.Add(e);
        mov.Registrar("Registro", "Equipo", e.Id, $"Se registró el equipo {e.CodigoPatrimonial} · {e.Nombre}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(e.Id);
    }

    public async Task<EquipoDto> ActualizarAsync(Guid id, EquipoRequest r, Guid actorId)
    {
        var e = await BuscarAsync(id);
        await ValidarAsync(r, id);
        e.CodigoPatrimonial = r.CodigoPatrimonial.Trim().ToUpperInvariant(); e.Nombre = r.Nombre.Trim();
        e.Categoria = r.Categoria; e.Marca = r.Marca.Trim(); e.Ubicacion = r.Ubicacion?.Trim();
        mov.Registrar("Actualización", "Equipo", e.Id, $"Se actualizaron los datos del equipo {e.CodigoPatrimonial}.", actorId);
        await db.SaveChangesAsync();
        return await ObtenerAsync(id);
    }

    /// <summary>RF-08. El estado "Prestado" solo cambia mediante préstamos y devoluciones.</summary>
    public async Task<EquipoDto> CambiarEstadoAsync(Guid id, string nuevo, Guid actorId)
    {
        var e = await BuscarAsync(id);
        if (!EstadosEquipo.Manuales.Contains(nuevo))
            throw new ReglaNegocioException("Solo puedes asignar Disponible, Mantenimiento o Baja. “Prestado” depende de los préstamos.", "estado");
        if (e.Estado == EstadosEquipo.Prestado)
            throw new ReglaNegocioException("El equipo está prestado. Registra primero la devolución.", "estado");
        if (e.Estado != nuevo)
        {
            mov.Registrar("Cambio de estado", "Equipo", e.Id, $"El equipo {e.CodigoPatrimonial} cambió de {e.Estado} a {nuevo}.", actorId);
            e.Estado = nuevo;
            await db.SaveChangesAsync();
        }
        return await ObtenerAsync(id);
    }

    /// <summary>RN-06: no se puede eliminar un equipo con historial de préstamos.</summary>
    public async Task EliminarAsync(Guid id, Guid actorId)
    {
        var e = await BuscarAsync(id);
        if (await db.Prestamos.AnyAsync(p => p.EquipoId == id))
            throw new ReglaNegocioException("No se puede eliminar un equipo con historial de préstamos. Puedes darlo de baja.");
        db.Equipos.Remove(e);
        mov.Registrar("Eliminación", "Equipo", null, $"Se eliminó el equipo {e.CodigoPatrimonial} · {e.Nombre}.", actorId);
        await db.SaveChangesAsync();
    }

    private async Task<Equipo> BuscarAsync(Guid id) =>
        await db.Equipos.FindAsync(id) ?? throw new NoEncontradoException("El equipo no existe.");

    private async Task ValidarAsync(EquipoRequest r, Guid? idActual)
    {
        if (!Categorias.Todas.Contains(r.Categoria)) throw new ReglaNegocioException("Selecciona una categoría válida.", "categoria");
        var codigo = r.CodigoPatrimonial.Trim().ToUpperInvariant();
        if (await db.Equipos.AnyAsync(e => e.CodigoPatrimonial == codigo && e.Id != idActual)) // RN-07
            throw new ReglaNegocioException("Ya existe un equipo con ese código patrimonial.", "codigoPatrimonial");
    }
}
