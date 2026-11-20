using TechAsset.Api.Domain;

namespace TechAsset.Api.Data;

/// <summary>Datos de demostración. Solo se ejecuta si la base está vacía.</summary>
public static class DataSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Usuarios.Any()) return;

        Usuario U(string n, string a, string c, string area, string rol, string pass) => new()
        { Nombres = n, Apellidos = a, Correo = c, Area = area, Rol = rol, PasswordHash = BCrypt.Net.BCrypt.HashPassword(pass) };

        var admin = U("Lucía", "Mendoza Rivas", "admin@innovatech.com", "Gerencia de Tecnología", Roles.Administrador, "Admin123*");
        var ti = U("Carlos", "Quispe Huamán", "tecnologia@innovatech.com", "Gerencia de Tecnología", Roles.Responsable, "Tecno123*");
        var c1 = U("Andrea", "Salazar Ponce", "colaborador@innovatech.com", "Desarrollo", Roles.Colaborador, "Colab123*");
        var c2 = U("Diego", "Ramos Vega", "diego.ramos@innovatech.com", "Desarrollo", Roles.Colaborador, "Colab123*");
        var c3 = U("Valeria", "Torres Núñez", "valeria.torres@innovatech.com", "Marketing", Roles.Colaborador, "Colab123*");
        var c4 = U("Jorge", "Paredes Luna", "jorge.paredes@innovatech.com", "Recursos Humanos", Roles.Colaborador, "Colab123*");
        var c5 = U("Camila", "Rojas Díaz", "camila.rojas@innovatech.com", "Finanzas", Roles.Colaborador, "Colab123*");
        var c6 = U("Mateo", "Castillo Soto", "mateo.castillo@innovatech.com", "Soporte", Roles.Colaborador, "Colab123*");
        db.Usuarios.AddRange(admin, ti, c1, c2, c3, c4, c5, c6);

        Equipo E(string cod, string nom, string cat, string marca, string ubic, string estado = EstadosEquipo.Disponible) => new()
        { CodigoPatrimonial = cod, Nombre = nom, Categoria = cat, Marca = marca, Ubicacion = ubic, Estado = estado };

        var e = new[]
        {
            E("LAP-0001", "Laptop ThinkPad T14", "Laptop", "Lenovo", "Almacén central"),
            E("LAP-0002", "Laptop MacBook Pro 14", "Laptop", "Apple", "Almacén central"),
            E("LAP-0003", "Laptop Latitude 5440", "Laptop", "Dell", "Almacén central"),
            E("LAP-0004", "Laptop EliteBook 840", "Laptop", "HP", "Almacén central"),
            E("PC-0001", "Desktop OptiPlex 7010", "Computadora de escritorio", "Dell", "Sala de desarrollo"),
            E("MON-0001", "Monitor UltraSharp 27", "Monitor", "Dell", "Almacén central"),
            E("MON-0002", "Monitor Odyssey 32", "Monitor", "Samsung", "Almacén central"),
            E("IMP-0001", "Impresora LaserJet Pro", "Impresora", "HP", "Piso 2 · Administración"),
            E("TAB-0001", "Tablet iPad Air", "Tablet", "Apple", "Almacén central"),
            E("TAB-0002", "Tablet Galaxy Tab S9", "Tablet", "Samsung", "Almacén central"),
            E("PRO-0001", "Proyector PowerLite", "Proyector", "Epson", "Sala de reuniones A"),
            E("RED-0001", "Switch Catalyst 2960", "Equipo de red", "Cisco", "Data center"),
            E("LAP-0005", "Laptop ProBook 450", "Laptop", "HP", "Taller de TI", EstadosEquipo.Mantenimiento),
            E("MON-0003", "Monitor P2419H", "Monitor", "Dell", "Taller de TI", EstadosEquipo.Baja),
        };
        db.Equipos.AddRange(e);

        var hoy = DateOnly.FromDateTime(DateTime.Now);
        Prestamo P(Usuario u, Equipo q, int ini, int fin, string estado, string? obs = null, int? real = null) => new()
        {
            Usuario = u, Equipo = q, FechaPrestamo = hoy.AddDays(ini), FechaDevolucion = hoy.AddDays(fin), Estado = estado,
            Responsable = ti, Observacion = obs, FechaDevolucionReal = real is null ? null : hoy.AddDays(real.Value),
            Motivo = "Trabajo en campo", CreadoEn = DateTime.UtcNow.AddDays(ini)
        };

        var prestamos = new List<Prestamo>
        {
            P(c1, e[0], -75, -60, EstadosPrestamo.Devuelto, "Sin novedades.", -61),
            P(c2, e[0], -55, -40, EstadosPrestamo.Devuelto, "Devuelta con cargador.", -41),
            P(c3, e[1], -50, -35, EstadosPrestamo.Devuelto, "Pantalla con un rayón leve.", -36),
            P(c3, e[8], -33, -20, EstadosPrestamo.Devuelto, "Todo conforme.", -21),
            P(c4, e[10], -28, -26, EstadosPrestamo.Devuelto, "Control remoto incluido.", -26),
            P(c5, e[2], -24, -10, EstadosPrestamo.Devuelto, "Sin observaciones.", -11),
            P(c6, e[0], -20, -8, EstadosPrestamo.Devuelto, "Teclado limpio, sin daños.", -9),
            P(c1, e[5], -15, -2, EstadosPrestamo.Devuelto, "Monitor en buen estado.", -3),
            P(c2, e[1], -12, 8, EstadosPrestamo.Activo),
            P(c5, e[3], -9, -1, EstadosPrestamo.Activo),   // vencido
            P(c6, e[9], -3, 12, EstadosPrestamo.Activo),
        };
        e[1].Estado = EstadosEquipo.Prestado; e[3].Estado = EstadosEquipo.Prestado; e[9].Estado = EstadosEquipo.Prestado;
        prestamos.Add(new Prestamo
        {
            Usuario = c4, Equipo = e[6], FechaPrestamo = hoy.AddDays(1), FechaDevolucion = hoy.AddDays(6),
            Estado = EstadosPrestamo.Pendiente, Motivo = "Presentación con clientes"
        });
        db.Prestamos.AddRange(prestamos);

        foreach (var x in e)
            db.Movimientos.Add(new Movimiento { Tipo = "Registro", Entidad = "Equipo", EntidadId = x.Id, UsuarioId = ti.Id,
                Descripcion = $"Se registró el equipo {x.CodigoPatrimonial} · {x.Nombre}.", Fecha = DateTime.UtcNow.AddDays(-90) });
        foreach (var p in prestamos.Where(p => p.Estado != EstadosPrestamo.Pendiente))
        {
            db.Movimientos.Add(new Movimiento { Tipo = "Préstamo", Entidad = "Prestamo", EntidadId = p.Id, UsuarioId = ti.Id,
                Descripcion = $"Se prestó {p.Equipo.CodigoPatrimonial} · {p.Equipo.Nombre} a {p.Usuario.NombreCompleto}.", Fecha = DateTime.UtcNow.AddDays(p.FechaPrestamo.DayNumber - hoy.DayNumber) });
            if (p.Estado == EstadosPrestamo.Devuelto)
                db.Movimientos.Add(new Movimiento { Tipo = "Devolución", Entidad = "Prestamo", EntidadId = p.Id, UsuarioId = ti.Id,
                    Descripcion = $"{p.Usuario.NombreCompleto} devolvió {p.Equipo.CodigoPatrimonial}; el equipo quedó Disponible.",
                    Fecha = DateTime.UtcNow.AddDays(p.FechaDevolucionReal!.Value.DayNumber - hoy.DayNumber) });
        }
        db.SaveChanges();
    }
}
