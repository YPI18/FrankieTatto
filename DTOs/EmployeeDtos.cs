using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace FrankieTattoo.Api.DTOs;

public class EmployeeDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("nombreCompleto")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("telefono")]
    public string? Phone { get; set; }

    [JsonPropertyName("correo")]
    public string? Email { get; set; }

    [JsonPropertyName("puesto")]
    public string Position { get; set; } = string.Empty;
}

public class EmployeeCreateDto
{
    [Required]
    [JsonPropertyName("nombreCompleto")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("telefono")]
    public string? Phone { get; set; }

    [JsonPropertyName("correo")]
    public string? Email { get; set; }

    [Required]
    [JsonPropertyName("puesto")]
    public string Position { get; set; } = string.Empty;
}
