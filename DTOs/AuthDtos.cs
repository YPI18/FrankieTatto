using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace FrankieTattoo.Api.DTOs;

public class RegisterDto
{
    [Required]
    [JsonPropertyName("nombreCompleto")]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress]
    [JsonPropertyName("correo")]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    [JsonPropertyName("contrasena")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("telefono")]
    public string? Phone { get; set; }
}

public class LoginDto
{
    [Required, EmailAddress]
    [JsonPropertyName("correo")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("contrasena")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("codigo2fa")]
    public string? TwoFactorCode { get; set; }
}

public class Enable2faDto
{
    [Required]
    [JsonPropertyName("codigo")]
    public string Code { get; set; } = string.Empty;
}

public class TwoFactorResponseDto
{
    [JsonPropertyName("requiere2fa")]
    public bool RequiresTwoFactor { get; set; }
}

public class AuthResponseDto
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("correo")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("nombreCompleto")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("idCliente")]
    public int? CustomerId { get; set; }

    [JsonPropertyName("telefono")]
    public string? Phone { get; set; }

    [JsonPropertyName("roles")]
    public IList<string> Roles { get; set; } = new List<string>();
}
