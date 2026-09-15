using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.DTOs;

public class PortfolioItemDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public ServiceType Category { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}

public class PortfolioItemCreateDto
{
    [Required]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("category")]
    public ServiceType Category { get; set; }
}

public class PortfolioItemUpdateDto
{
    [Required]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("category")]
    public ServiceType? Category { get; set; }
}
