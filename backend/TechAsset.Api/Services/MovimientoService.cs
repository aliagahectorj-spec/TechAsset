using Microsoft.EntityFrameworkCore;
using TechAsset.Api.Data;
using TechAsset.Api.Domain;
using TechAsset.Api.Dtos;

namespace TechAsset.Api.Services;

/// <summary>Bitácora de movimientos (RF-17). Se guarda en la misma transacción que la operación.</summary>
public class MovimientoService(AppDbContext db)
{
    public void Registrar(string tipo, string entidad, Guid? entidadId, string descripcion, Guid? actorId) =>
        db.Movimientos.Add(new Movimiento { Tipo = tipo, Entidad = entidad, EntidadId = entidadId, Descripcion = descripcion, UsuarioId = actorId });

    public async Task<List<MovimientoDto>> ListarAsync(string? tipo, string? entidad, string? buscar, DateOnly? desde, DateOnly? hasta)
    {
        var q = db.Movimientos.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(tipo)) q = q.Where(m => m.Tipo == tipo);
        if (!string.IsNullOrWhiteSpace(entidad)) q = q.Where(m => m.Entidad == entidad);
        if (!string.IsNullOrWhiteSpace(buscar)) q = q.Where(m => EF.Functions.ILike(m.Descripcion, $"%{buscar.Trim()}%"));
        if (desde is not null) q = q.Where(m => m.Fecha >= desde.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        if (hasta is not null) q = q.Where(m => m.Fecha < hasta.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        return await q.OrderByDescending(m => m.Fecha).Take(500)
            .Select(m => new MovimientoDto(m.Id, m.Fecha, m.Tipo, m.Entidad, m.EntidadId, m.Descripcion,
                m.Usuario == null ? null : m.Usuario.Nombres + " " + m.Usuario.Apellidos))
            .ToListAsync();
    }
}
