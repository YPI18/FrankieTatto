using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/upload")]
[EnableRateLimiting("auth")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly ILogger<UploadController> _logger;
    private static readonly HttpClient _httpClient = new();

    public UploadController(IWebHostEnvironment env, IConfiguration config, ILogger<UploadController> logger)
    {
        _env = env;
        _config = config;
        _logger = logger;
    }

    [HttpPost]
    [RequestSizeLimit(100 * 1024 * 1024)] // Límite de 100 MB para fotos y videos
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No se proporcionó ningún archivo.");

        bool isStaff = User.IsInRole("Admin") || User.IsInRole("Employee");

        // Si no es personal del estudio (ej. cliente subiendo comprobante de pago), restringir estrictamente a fotos y máx 10 MB
        var allowedImageExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var allowedStaffExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm", ".m4v" };

        var allowedExtensions = isStaff ? allowedStaffExtensions : allowedImageExtensions;
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
            return BadRequest(isStaff 
                ? "El archivo debe ser una imagen (jpg, png, webp) o video válido (mp4, mov, webm)." 
                : "Solo se permiten imágenes (jpg, png, webp). Para subir videos debes iniciar sesión como Administrador.");

        if (!isStaff && file.Length > 10 * 1024 * 1024)
            return BadRequest("El archivo no debe superar los 10 MB. Para archivos mayores de 10 MB inicia sesión como Administrador.");

        // Crear nombre único
        var fileName = $"{Guid.NewGuid()}{extension}";

        // 1. Intentar subir directamente a Supabase Storage (Almacenamiento permanente en la nube)
        var supabaseUrl = _config["Supabase:Url"] ?? Environment.GetEnvironmentVariable("Supabase__Url");
        var supabaseKey = _config["Supabase:Key"] ?? Environment.GetEnvironmentVariable("Supabase__Key");
        var bucket = _config["Supabase:Bucket"] ?? Environment.GetEnvironmentVariable("Supabase__Bucket") ?? "uploads";

        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            try
            {
                var uploadEndpoint = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucket}/{fileName}";
                using var request = new HttpRequestMessage(HttpMethod.Post, uploadEndpoint);
                request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                request.Headers.Add("apikey", supabaseKey);

                using var stream = file.OpenReadStream();
                using var content = new StreamContent(stream);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(GetContentType(extension));
                request.Content = content;

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var publicUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucket}/{fileName}";
                    _logger.LogInformation("Archivo subido exitosamente a Supabase Storage: {Url}", publicUrl);
                    return Ok(new { url = publicUrl });
                }

                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Fallo subida a Supabase Storage ({Status}): {Error}. Se usará almacenamiento local.", response.StatusCode, errorBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al conectar con Supabase Storage. Se usará almacenamiento local.");
            }
        }

        // 2. Almacenamiento local de respaldo (Fallback)
        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");

        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Devolver la URL relativa local
        var url = $"/uploads/{fileName}";
        return Ok(new { url });
    }

    private static string GetContentType(string extension) => extension.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        ".mp4" => "video/mp4",
        ".mov" => "video/quicktime",
        ".webm" => "video/webm",
        ".m4v" => "video/x-m4v",
        _ => "application/octet-stream"
    };
}
