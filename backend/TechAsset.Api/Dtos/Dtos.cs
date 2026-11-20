using System.ComponentModel.DataAnnotations;

namespace TechAsset.Api.Dtos;

// ---------- Auth ----------
public class LoginRequest
{
    [Required(ErrorMessage = "Ingresa tu correo.")] public string Correo { get; set; } = "";
    [Required(ErrorMessage = "Ingresa tu contraseña.")] public string Password { get; set; } = "";
}
public record LoginResponse(string Token, UsuarioDto Usuario);

// ---------- Usuarios ----------
public class UsuarioRequest
{
    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [StringLength(100, ErrorMessage = "Máximo 100 caracteres.")]
    public string Nombres { get; set; } = "";

    [Required(ErrorMessage = "Los apellidos son obligatorios.")]
    [StringLength(100, ErrorMessage = "Máximo 100 caracteres.")]
    public string Apellidos { get; set; } = "";

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "Ingresa un correo válido.")]
    [StringLength(150, ErrorMessage = "Máximo 150 caracteres.")]
    public string Correo { get; set; } = "";

    [Required(ErrorMessage = "El área es obligatoria.")]
    [StringLength(100, ErrorMessage = "Máximo 100 caracteres.")]
    public string Area { get; set; } = "";

    [Required(ErrorMessage = "El rol es obligatorio.")]
    public string Rol { get; set; } = "";

    [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).{8,100}$", ErrorMessage = "Mínimo 8 caracteres con letras y números.")]
    public string? Password { get; set; }
}
public record UsuarioDto(Guid Id, string Nombres, string Apellidos, string Correo, string Area, string Rol, bool Estado, DateTime CreadoEn);

// ---------- Equipos ----------
public class EquipoRequest
{
    [Required(ErrorMessage = "El código patrimonial es obligatorio.")]
    [RegularExpression(@"^[A-Za-z0-9\-]{3,50}$", ErrorMessage = "Usa 3 a 50 letras, números o guiones.")]
    public string CodigoPatrimonial { get; set; } = "";

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, ErrorMessage = "Máximo 100 caracteres.")]
    public string Nombre { get; set; } = "";

    [Required(ErrorMessage = "La categoría es obligatoria.")] public string Categoria { get; set; } = "";

    [Required(ErrorMessage = "La marca es obligatoria.")]
    [StringLength(50, ErrorMessage = "Máximo 50 caracteres.")]
    public string Marca { get; set; } = "";

    [StringLength(120, ErrorMessage = "Máximo 120 caracteres.")] public string? Ubicacion { get; set; }
}
public class CambiarEstadoRequest
{
    [Required(ErrorMessage = "Selecciona un estado.")] public string Estado { get; set; } = "";
}
public record EquipoDto(Guid Id, string CodigoPatrimonial, string Nombre, string Categoria, string Marca, string Estado,
    string? Ubicacion, int TotalPrestamos, string? PrestadoA);

// ---------- Préstamos ----------
public class RegistrarPrestamoRequest
{
    [Required(ErrorMessage = "Selecciona un colaborador.")] public Guid? UsuarioId { get; set; }
    [Required(ErrorMessage = "Selecciona un equipo.")] public Guid? EquipoId { get; set; }
    [Required(ErrorMessage = "Indica la fecha de préstamo.")] public DateOnly? FechaPrestamo { get; set; }
    [Required(ErrorMessage = "Indica la fecha de devolución.")] public DateOnly? FechaDevolucion { get; set; }
    [StringLength(300, ErrorMessage = "Máximo 300 caracteres.")] public string? Motivo { get; set; }
}
public class SolicitarPrestamoRequest
{
    [Required(ErrorMessage = "Selecciona un equipo.")] public Guid? EquipoId { get; set; }
    [Required(ErrorMessage = "Indica la fecha de préstamo.")] public DateOnly? FechaPrestamo { get; set; }
    [Required(ErrorMessage = "Indica la fecha de devolución.")] public DateOnly? FechaDevolucion { get; set; }
    [StringLength(300, ErrorMessage = "Máximo 300 caracteres.")] public string? Motivo { get; set; }
}
public class RechazarRequest
{
    [StringLength(500, ErrorMessage = "Máximo 500 caracteres.")] public string? Motivo { get; set; }
}
public class DevolucionRequest
{
    [Required(ErrorMessage = "Las observaciones son obligatorias.")] // RN-10
    [StringLength(1000, ErrorMessage = "Máximo 1000 caracteres.")]
    public string Observaciones { get; set; } = "";
    public DateOnly? FechaDevolucionReal { get; set; }
    /// <summary>Estado en el que queda el equipo: Disponible (por defecto) o Mantenimiento.</summary>
    public string? EstadoEquipo { get; set; }
}
public record PrestamoDto(Guid Id, DateOnly FechaPrestamo, DateOnly FechaDevolucion, DateOnly? FechaDevolucionReal, string Estado,
    string? Motivo, string? Observacion, Guid UsuarioId, string Usuario, string Area, Guid EquipoId, string Equipo,
    string CodigoPatrimonial, Guid? ResponsableId, string? Responsable);

// ---------- Reportes ----------
public record ConteoDto(string Nombre, int Total);
public record MesDto(string Mes, int Total);
public record EquipoUsoDto(Guid Id, string CodigoPatrimonial, string Nombre, string Categoria, int Total);
public record DashboardDto(int TotalEquipos, int Disponibles, int Prestados, int Mantenimiento, int Baja, int TotalPrestamos,
    int PrestamosActivos, int Pendientes, int Vencidos, ConteoDto? AreaMayorUso, List<MesDto> PrestamosPorMes,
    List<ConteoDto> EquiposPorEstado, List<ConteoDto> EquiposPorCategoria);
public record MovimientoDto(Guid Id, DateTime Fecha, string Tipo, string Entidad, Guid? EntidadId, string Descripcion, string? Usuario);
