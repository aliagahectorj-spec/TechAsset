using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechAsset.Api.Data;
using TechAsset.Api.Domain;
using TechAsset.Api.Dtos;
using TechAsset.Api.Infrastructure;
using TechAsset.Api.Services;

namespace TechAsset.Api.Controllers;

public static class Perfiles
{
    public const string Admin = Roles.Administrador;
    public const string Personal = Roles.Administrador + "," + Roles.Responsable;
}

[ApiController, Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokens) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest r)
    {
        var correo = r.Correo.Trim().ToLowerInvariant();
        var u = await db.Usuarios.FirstOrDefaultAsync(x => x.Correo == correo);
        if (u is null || !BCrypt.Net.BCrypt.Verify(r.Password, u.PasswordHash))
            return Unauthorized(new { message = "Correo o contraseña incorrectos." });
        if (!u.Estado) return Unauthorized(new { message = "Tu cuenta está deshabilitada. Contacta al administrador." });
        return new LoginResponse(tokens.Crear(u), UsuarioService.ToDto(u));
    }

    [Authorize, HttpGet("me")]
    public async Task<ActionResult<UsuarioDto>> Me()
    {
        var u = await db.Usuarios.FindAsync(User.UserId());
        return u is null || !u.Estado ? Unauthorized() : UsuarioService.ToDto(u);
    }
}

[ApiController, Authorize, Route("api/usuarios")]
public class UsuariosController(UsuarioService svc) : ControllerBase
{
    [HttpGet, Authorize(Roles = Perfiles.Personal)]
    public Task<List<UsuarioDto>> Listar([FromQuery] string? buscar, [FromQuery] string? area, [FromQuery] string? rol, [FromQuery] bool? activo) =>
        svc.ListarAsync(buscar, area, rol, activo);

    [HttpGet("{id:guid}"), Authorize(Roles = Perfiles.Personal)]
    public Task<UsuarioDto> Obtener(Guid id) => svc.ObtenerAsync(id);

    [HttpPost, Authorize(Roles = Perfiles.Admin)]
    public async Task<ActionResult<UsuarioDto>> Crear(UsuarioRequest r)
    {
        var u = await svc.CrearAsync(r, User.UserId());
        return CreatedAtAction(nameof(Obtener), new { id = u.Id }, u);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = Perfiles.Admin)]
    public Task<UsuarioDto> Actualizar(Guid id, UsuarioRequest r) => svc.ActualizarAsync(id, r, User.UserId());

    /// <summary>RN-09: solo Administrador.</summary>
    [HttpPatch("{id:guid}/deshabilitar"), Authorize(Roles = Perfiles.Admin)]
    public Task<UsuarioDto> Deshabilitar(Guid id) => svc.CambiarEstadoAsync(id, false, User.UserId(), User.Rol());

    [HttpPatch("{id:guid}/habilitar"), Authorize(Roles = Perfiles.Admin)]
    public Task<UsuarioDto> Habilitar(Guid id) => svc.CambiarEstadoAsync(id, true, User.UserId(), User.Rol());
}

[ApiController, Authorize, Route("api/equipos")]
public class EquiposController(EquipoService svc) : ControllerBase
{
    [HttpGet]
    public Task<List<EquipoDto>> Listar([FromQuery] string? buscar, [FromQuery] string? estado, [FromQuery] string? categoria) =>
        svc.ListarAsync(buscar, estado, categoria);

    [HttpGet("{id:guid}")]
    public Task<EquipoDto> Obtener(Guid id) => svc.ObtenerAsync(id);

    [HttpPost, Authorize(Roles = Perfiles.Personal)]
    public async Task<ActionResult<EquipoDto>> Crear(EquipoRequest r)
    {
        var e = await svc.CrearAsync(r, User.UserId());
        return CreatedAtAction(nameof(Obtener), new { id = e.Id }, e);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = Perfiles.Personal)]
    public Task<EquipoDto> Actualizar(Guid id, EquipoRequest r) => svc.ActualizarAsync(id, r, User.UserId());

    [HttpPatch("{id:guid}/estado"), Authorize(Roles = Perfiles.Personal)]
    public Task<EquipoDto> CambiarEstado(Guid id, CambiarEstadoRequest r) => svc.CambiarEstadoAsync(id, r.Estado, User.UserId());

    [HttpDelete("{id:guid}"), Authorize(Roles = Perfiles.Admin)]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        await svc.EliminarAsync(id, User.UserId());
        return NoContent();
    }
}

[ApiController, Authorize, Route("api/prestamos")]
public class PrestamosController(PrestamoService svc) : ControllerBase
{
    [HttpGet]
    public Task<List<PrestamoDto>> Listar([FromQuery] PrestamoFiltro filtro) => svc.ListarAsync(filtro, User.UserId(), User.Rol());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PrestamoDto>> Obtener(Guid id)
    {
        var p = await svc.ObtenerAsync(id);
        if (User.Rol() == Roles.Colaborador && p.UsuarioId != User.UserId()) return Forbid();
        return p;
    }

    [HttpPost, Authorize(Roles = Perfiles.Personal)]
    public async Task<ActionResult<PrestamoDto>> Registrar(RegistrarPrestamoRequest r)
    {
        var p = await svc.RegistrarAsync(r, User.UserId());
        return CreatedAtAction(nameof(Obtener), new { id = p.Id }, p);
    }

    [HttpPost("solicitar")]
    public async Task<ActionResult<PrestamoDto>> Solicitar(SolicitarPrestamoRequest r)
    {
        var p = await svc.SolicitarAsync(r, User.UserId());
        return CreatedAtAction(nameof(Obtener), new { id = p.Id }, p);
    }

    [HttpPost("{id:guid}/cancelar")]
    public Task<PrestamoDto> Cancelar(Guid id) => svc.CancelarAsync(id, User.UserId(), User.Rol());

    [HttpPost("{id:guid}/aprobar"), Authorize(Roles = Perfiles.Personal)]
    public Task<PrestamoDto> Aprobar(Guid id) => svc.AprobarAsync(id, User.UserId());

    [HttpPost("{id:guid}/rechazar"), Authorize(Roles = Perfiles.Personal)]
    public Task<PrestamoDto> Rechazar(Guid id, RechazarRequest r) => svc.RechazarAsync(id, r, User.UserId());

    [HttpPost("{id:guid}/devolucion"), Authorize(Roles = Perfiles.Personal)]
    public Task<PrestamoDto> Devolver(Guid id, DevolucionRequest r) => svc.DevolverAsync(id, r, User.UserId());
}

[ApiController, Authorize(Roles = Perfiles.Personal), Route("api")]
public class ReportesController(ReporteService reportes, MovimientoService movimientos) : ControllerBase
{
    [HttpGet("reportes/dashboard")]
    public Task<DashboardDto> Dashboard() => reportes.DashboardAsync();

    [HttpGet("reportes/equipos-por-estado")]
    public Task<List<ConteoDto>> EquiposPorEstado() => reportes.EquiposPorEstadoAsync();

    [HttpGet("reportes/equipos-mas-utilizados")]
    public Task<List<EquipoUsoDto>> MasUtilizados([FromQuery] int top = 10) => reportes.EquiposMasUtilizadosAsync(top);

    [HttpGet("reportes/prestamos-por-area")]
    public Task<List<ConteoDto>> PorArea() => reportes.PrestamosPorAreaAsync();

    [HttpGet("reportes/areas")]
    public Task<List<string>> Areas() => reportes.AreasAsync();

    [HttpGet("movimientos")]
    public Task<List<MovimientoDto>> Movimientos([FromQuery] string? tipo, [FromQuery] string? entidad, [FromQuery] string? buscar,
        [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta) => movimientos.ListarAsync(tipo, entidad, buscar, desde, hasta);
}
