using Microsoft.EntityFrameworkCore;
using TechAsset.Api.Data;
using TechAsset.Api.Domain;
using TechAsset.Api.Dtos;
using TechAsset.Api.Infrastructure;

namespace TechAsset.Api.Services;

public class UsuarioService(AppDbContext db, MovimientoService mov)
{
    public static UsuarioDto ToDto(Usuario u) => new(u.Id, u.Nombres, u.Apellidos, u.Correo, u.Area, u.Rol, u.Estado, u.CreadoEn);

    public async Task<List<UsuarioDto>> ListarAsync(string? buscar, string? area, string? rol, bool? activo)
    {
        var q = db.Usuarios.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var b = $"%{buscar.Trim()}%";
            q = q.Where(u => EF.Functions.ILike(u.Nombres + " " + u.Apellidos, b) || EF.Functions.ILike(u.Correo, b));
        }
        if (!string.IsNullOrWhiteSpace(area)) q = q.Where(u => u.Area == area);
        if (!string.IsNullOrWhiteSpace(rol)) q = q.Where(u => u.Rol == rol);
        if (activo is not null) q = q.Where(u => u.Estado == activo);
        return await q.OrderBy(u => u.Apellidos).ThenBy(u => u.Nombres).Select(u => ToDto(u)).ToListAsync();
    }

    public async Task<UsuarioDto> ObtenerAsync(Guid id) => ToDto(await BuscarAsync(id));

    public async Task<UsuarioDto> CrearAsync(UsuarioRequest r, Guid actorId)
    {
        await ValidarAsync(r, null);
        if (string.IsNullOrWhiteSpace(r.Password)) throw new ReglaNegocioException("La contraseña es obligatoria.", "password");
        var u = new Usuario
        {
            Nombres = r.Nombres.Trim(), Apellidos = r.Apellidos.Trim(), Correo = r.Correo.Trim().ToLowerInvariant(),
            Area = r.Area.Trim(), Rol = r.Rol, PasswordHash = BCrypt.Net.BCrypt.HashPassword(r.Password)
        };
        db.Usuarios.Add(u);
        mov.Registrar("Registro", "Usuario", u.Id, $"Se registró al usuario {u.NombreCompleto} ({u.Rol}).", actorId);
        await db.SaveChangesAsync();
        return ToDto(u);
    }

    public async Task<UsuarioDto> ActualizarAsync(Guid id, UsuarioRequest r, Guid actorId)
    {
        var u = await BuscarAsync(id);
        await ValidarAsync(r, id);
        u.Nombres = r.Nombres.Trim(); u.Apellidos = r.Apellidos.Trim(); u.Correo = r.Correo.Trim().ToLowerInvariant();
        u.Area = r.Area.Trim(); u.Rol = r.Rol;
        if (!string.IsNullOrWhiteSpace(r.Password)) u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(r.Password);
        mov.Registrar("Actualización", "Usuario", u.Id, $"Se actualizaron los datos de {u.NombreCompleto}.", actorId);
        await db.SaveChangesAsync();
        return ToDto(u);
    }

    /// <summary>RN-09: solo el Administrador puede deshabilitar usuarios.</summary>
    public async Task<UsuarioDto> CambiarEstadoAsync(Guid id, bool habilitar, Guid actorId, string actorRol)
    {
        if (actorRol != Roles.Administrador) throw new ReglaNegocioException("Solo el Administrador puede habilitar o deshabilitar usuarios.");
        var u = await BuscarAsync(id);
        if (!habilitar)
        {
            if (u.Id == actorId) throw new ReglaNegocioException("No puedes deshabilitar tu propia cuenta.");
            if (await db.Prestamos.AnyAsync(p => p.UsuarioId == id && p.Estado == EstadosPrestamo.Activo))
                throw new ReglaNegocioException("El usuario tiene préstamos activos. Registra primero las devoluciones.");
        }
        u.Estado = habilitar;
        mov.Registrar(habilitar ? "Habilitación" : "Deshabilitación", "Usuario", u.Id,
            $"Se {(habilitar ? "habilitó" : "deshabilitó")} al usuario {u.NombreCompleto}.", actorId);
        await db.SaveChangesAsync();
        return ToDto(u);
    }

    private async Task<Usuario> BuscarAsync(Guid id) =>
        await db.Usuarios.FindAsync(id) ?? throw new NoEncontradoException("El usuario no existe.");

    private async Task ValidarAsync(UsuarioRequest r, Guid? idActual)
    {
        if (!Roles.Todos.Contains(r.Rol)) throw new ReglaNegocioException("Selecciona un rol válido.", "rol");
        var correo = r.Correo.Trim().ToLowerInvariant();
        if (await db.Usuarios.AnyAsync(u => u.Correo == correo && u.Id != idActual)) // RN-08
            throw new ReglaNegocioException("Ya existe un usuario con ese correo.", "correo");
    }
}
