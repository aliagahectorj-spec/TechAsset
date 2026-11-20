using Microsoft.EntityFrameworkCore;
using TechAsset.Api.Domain;

namespace TechAsset.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<Prestamo> Prestamos => Set<Prestamo>();
    public DbSet<Movimiento> Movimientos => Set<Movimiento>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Usuario>(e =>
        {
            e.ToTable("usuarios");
            e.Property(x => x.Nombres).HasMaxLength(100).IsRequired();
            e.Property(x => x.Apellidos).HasMaxLength(100).IsRequired();
            e.Property(x => x.Correo).HasMaxLength(150).IsRequired();
            e.Property(x => x.Area).HasMaxLength(100).IsRequired();
            e.Property(x => x.Rol).HasMaxLength(30).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(100).IsRequired();
            e.Ignore(x => x.NombreCompleto);
            e.HasIndex(x => x.Correo).IsUnique(); // RN-08
        });

        b.Entity<Equipo>(e =>
        {
            e.ToTable("equipos");
            e.Property(x => x.CodigoPatrimonial).HasMaxLength(50).IsRequired();
            e.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
            e.Property(x => x.Categoria).HasMaxLength(50).IsRequired();
            e.Property(x => x.Marca).HasMaxLength(50).IsRequired();
            e.Property(x => x.Estado).HasMaxLength(30).IsRequired();
            e.Property(x => x.Ubicacion).HasMaxLength(120);
            e.HasIndex(x => x.CodigoPatrimonial).IsUnique(); // RN-07
        });

        b.Entity<Prestamo>(e =>
        {
            e.ToTable("prestamos", t => t.HasCheckConstraint("ck_prestamos_fechas", "\"FechaDevolucion\" > \"FechaPrestamo\"")); // RN-04
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
            e.Property(x => x.Motivo).HasMaxLength(300);
            e.Property(x => x.Observacion).HasColumnType("text");
            e.HasOne(x => x.Usuario).WithMany(u => u.Prestamos).HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Equipo).WithMany(q => q.Prestamos).HasForeignKey(x => x.EquipoId).OnDelete(DeleteBehavior.Restrict); // RN-06
            e.HasOne(x => x.Responsable).WithMany().HasForeignKey(x => x.ResponsableId).OnDelete(DeleteBehavior.Restrict);
            // RN-01: un equipo solo puede tener un préstamo activo
            e.HasIndex(x => x.EquipoId).IsUnique().HasFilter("\"Estado\" = 'Activo'").HasDatabaseName("ux_prestamo_activo_por_equipo");
            e.HasIndex(x => x.Estado);
        });

        b.Entity<Movimiento>(e =>
        {
            e.ToTable("movimientos");
            e.Property(x => x.Tipo).HasMaxLength(40).IsRequired();
            e.Property(x => x.Entidad).HasMaxLength(30).IsRequired();
            e.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => x.Fecha);
        });
    }
}
