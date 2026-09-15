using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace FrankieTattoo.Api.DTOs;

public class CustomerDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("nombreCompleto")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("telefono")]
    public string? Phone { get; set; }

    [JsonPropertyName("correo")]
    public string? Email { get; set; }

    [JsonPropertyName("internalNotes")]
    public string? InternalNotes { get; set; }
}

public class CustomerCreateDto
{
    [Required]
    [JsonPropertyName("nombreCompleto")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("telefono")]
    public string? Phone { get; set; }

    [JsonPropertyName("correo")]
    public string? Email { get; set; }

    [JsonPropertyName("internalNotes")]
    public string? InternalNotes { get; set; }
}
