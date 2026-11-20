namespace TechAsset.Api.Domain;

public static class Roles
{
    public const string Administrador = "Administrador";
    public const string Responsable = "Responsable";
    public const string Colaborador = "Colaborador";
    public static readonly string[] Todos = [Administrador, Responsable, Colaborador];
}

public static class EstadosEquipo
{
    public const string Disponible = "Disponible";
    public const string Prestado = "Prestado";
    public const string Mantenimiento = "Mantenimiento";
    public const string Baja = "Baja";
    public static readonly string[] Todos = [Disponible, Prestado, Mantenimiento, Baja];
    /// <summary>Estados que se pueden asignar manualmente (Prestado lo controlan los préstamos).</summary>
    public static readonly string[] Manuales = [Disponible, Mantenimiento, Baja];
}

public static class EstadosPrestamo
{
    public const string Pendiente = "Pendiente";
    public const string Activo = "Activo";
    public const string Devuelto = "Devuelto";
    public const string Rechazado = "Rechazado";
    public const string Cancelado = "Cancelado";
}

public static class Categorias
{
    public static readonly string[] Todas =
        ["Laptop", "Computadora de escritorio", "Monitor", "Impresora", "Tablet", "Proyector", "Equipo de red"];
}

public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nombres { get; set; } = "";
    public string Apellidos { get; set; } = "";
    public string Correo { get; set; } = "";
    public string Area { get; set; } = "";
    public bool Estado { get; set; } = true;
    public string Rol { get; set; } = Roles.Colaborador;
    public string PasswordHash { get; set; } = "";
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public List<Prestamo> Prestamos { get; set; } = [];
    public string NombreCompleto => $"{Nombres} {Apellidos}";
}

public class Equipo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CodigoPatrimonial { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Categoria { get; set; } = "";
    public string Marca { get; set; } = "";
    public string Estado { get; set; } = EstadosEquipo.Disponible;
    public string? Ubicacion { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public List<Prestamo> Prestamos { get; set; } = [];
}

public class Prestamo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateOnly FechaPrestamo { get; set; }
    /// <summary>Fecha de devolución programada (RN-04: posterior a FechaPrestamo).</summary>
    public DateOnly FechaDevolucion { get; set; }
    public DateOnly? FechaDevolucionReal { get; set; }
    public string? Motivo { get; set; }
    /// <summary>Observaciones de la devolución (RN-10) o motivo de rechazo.</summary>
    public string? Observacion { get; set; }
    public string Estado { get; set; } = EstadosPrestamo.Pendiente;
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public Guid EquipoId { get; set; }
    public Equipo Equipo { get; set; } = null!;
    /// <summary>RN-05: responsable de TI que aprueba / registra el préstamo.</summary>
    public Guid? ResponsableId { get; set; }
    public Usuario? Responsable { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}

public class Movimiento
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public string Tipo { get; set; } = "";
    public string Entidad { get; set; } = "";
    public Guid? EntidadId { get; set; }
    public string Descripcion { get; set; } = "";
    public Guid? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
}
