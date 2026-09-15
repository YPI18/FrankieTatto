using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace FrankieTattoo.Api.DTOs;

public class CategoryDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("nombre")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("descripcion")]
    public string? Description { get; set; }
}

public class CategoryCreateDto
{
    [Required]
    [JsonPropertyName("nombre")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("descripcion")]
    public string? Description { get; set; }
}
