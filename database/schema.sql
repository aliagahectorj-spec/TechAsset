-- TechAsset · esquema PostgreSQL (referencia / instalación manual).
-- La API crea estas mismas tablas automáticamente al arrancar (EnsureCreated),
-- así que este script solo es necesario si quieres crear la base a mano.
-- Uso:  psql -U postgres -c "CREATE DATABASE techasset;"  &&  psql -U postgres -d techasset -f database/schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
    "Id"           uuid PRIMARY KEY,
    "Nombres"      varchar(100) NOT NULL,
    "Apellidos"    varchar(100) NOT NULL,
    "Correo"       varchar(150) NOT NULL,
    "Area"         varchar(100) NOT NULL,
    "Estado"       boolean      NOT NULL DEFAULT TRUE,
    "Rol"          varchar(30)  NOT NULL,
    "PasswordHash" varchar(100) NOT NULL,
    "CreadoEn"     timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_usuarios_Correo" ON usuarios ("Correo");                -- RN-08

CREATE TABLE IF NOT EXISTS equipos (
    "Id"                uuid PRIMARY KEY,
    "CodigoPatrimonial" varchar(50)  NOT NULL,
    "Nombre"            varchar(100) NOT NULL,
    "Categoria"         varchar(50)  NOT NULL,
    "Marca"             varchar(50)  NOT NULL,
    "Estado"            varchar(30)  NOT NULL,
    "Ubicacion"         varchar(120),
    "CreadoEn"          timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_equipos_CodigoPatrimonial" ON equipos ("CodigoPatrimonial"); -- RN-07

CREATE TABLE IF NOT EXISTS prestamos (
    "Id"                  uuid PRIMARY KEY,
    "FechaPrestamo"       date        NOT NULL,
    "FechaDevolucion"     date        NOT NULL,
    "FechaDevolucionReal" date,
    "Motivo"              varchar(300),
    "Observacion"         text,
    "Estado"              varchar(20) NOT NULL,
    "UsuarioId"           uuid        NOT NULL REFERENCES usuarios ("Id") ON DELETE RESTRICT,
    "EquipoId"            uuid        NOT NULL REFERENCES equipos  ("Id") ON DELETE RESTRICT,  -- RN-06
    "ResponsableId"       uuid        REFERENCES usuarios ("Id") ON DELETE RESTRICT,           -- RN-05
    "CreadoEn"            timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_prestamos_fechas CHECK ("FechaDevolucion" > "FechaPrestamo")                 -- RN-04
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_prestamo_activo_por_equipo ON prestamos ("EquipoId") WHERE "Estado" = 'Activo'; -- RN-01
CREATE INDEX IF NOT EXISTS "IX_prestamos_Estado" ON prestamos ("Estado");
CREATE INDEX IF NOT EXISTS "IX_prestamos_UsuarioId" ON prestamos ("UsuarioId");

CREATE TABLE IF NOT EXISTS movimientos (
    "Id"          uuid PRIMARY KEY,
    "Fecha"       timestamptz  NOT NULL,
    "Tipo"        varchar(40)  NOT NULL,
    "Entidad"     varchar(30)  NOT NULL,
    "EntidadId"   uuid,
    "Descripcion" varchar(500) NOT NULL,
    "UsuarioId"   uuid REFERENCES usuarios ("Id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IX_movimientos_Fecha" ON movimientos ("Fecha");
