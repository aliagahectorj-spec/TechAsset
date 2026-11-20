using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TechAsset.Api.Infrastructure;

/// <summary>Violación de una regla de negocio (HTTP 400). Puede indicar el campo afectado.</summary>
public class ReglaNegocioException(string message, string? campo = null) : Exception(message)
{
    public string? Campo { get; } = campo;
}

public class NoEncontradoException(string message) : Exception(message);

/// <summary>Convierte cualquier excepción en una respuesta JSON uniforme: { message, errors }.</summary>
public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> log)
{
    public async Task Invoke(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (ReglaNegocioException ex)
        {
            object? errors = ex.Campo is null ? null : new Dictionary<string, string> { [ex.Campo] = ex.Message };
            await Write(ctx, HttpStatusCode.BadRequest, ex.Message, errors);
        }
        catch (NoEncontradoException ex) { await Write(ctx, HttpStatusCode.NotFound, ex.Message); }
        catch (DbUpdateException ex)
        {
            log.LogWarning(ex, "Conflicto de base de datos");
            await Write(ctx, HttpStatusCode.Conflict, "La operación entra en conflicto con datos existentes (registro duplicado o relacionado).");
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Error no controlado");
            await Write(ctx, HttpStatusCode.InternalServerError, "Ocurrió un error inesperado en el servidor.");
        }
    }

    private static Task Write(HttpContext ctx, HttpStatusCode code, string message, object? errors = null)
    {
        ctx.Response.StatusCode = (int)code;
        ctx.Response.ContentType = "application/json";
        return ctx.Response.WriteAsync(JsonSerializer.Serialize(new { message, errors },
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}

public static class ValidationResponse
{
    public static IActionResult Build(ActionContext ctx)
    {
        var errors = ctx.ModelState.Where(e => e.Value!.Errors.Count > 0).ToDictionary(
            e => string.IsNullOrEmpty(e.Key) ? "_" : char.ToLowerInvariant(e.Key[0]) + e.Key[1..],
            e => e.Value!.Errors[0].ErrorMessage);
        return new BadRequestObjectResult(new { message = "Revisa los campos marcados.", errors });
    }
}

public static class ClaimsExtensions
{
    public static Guid UserId(this ClaimsPrincipal p) => Guid.Parse(p.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    public static string Rol(this ClaimsPrincipal p) => p.FindFirst(ClaimTypes.Role)!.Value;
}
