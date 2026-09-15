using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.DTOs;

public class ProductDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("nombre")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("descripcion")]
    public string? Description { get; set; }

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("precio")]
    public decimal Price { get; set; }

    [JsonPropertyName("inventario")]
    public int Stock { get; set; }

    [JsonPropertyName("limiteAlertaInventario")]
    public int LowStockThreshold { get; set; }

    [JsonPropertyName("tipoServicio")]
    public ServiceType Type { get; set; }

    [JsonPropertyName("idCategoria")]
    public int CategoryId { get; set; }

    [JsonPropertyName("nombreCategoria")]
    public string? CategoryName { get; set; }
}

public class ProductCreateDto
{
    [Required]
    [JsonPropertyName("nombre")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("descripcion")]
    public string? Description { get; set; }

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [Range(0, double.MaxValue)]
    [JsonPropertyName("precio")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    [JsonPropertyName("inventario")]
    public int Stock { get; set; }

    [JsonPropertyName("limiteAlertaInventario")]
    public int LowStockThreshold { get; set; } = 5;

    [Required]
    [JsonPropertyName("tipoServicio")]
    public ServiceType Type { get; set; }

    [Required]
    [JsonPropertyName("idCategoria")]
    public int CategoryId { get; set; }
}

public class AdjustStockDto
{
    [Required]
    [JsonPropertyName("tipoMovimiento")]
    public StockMovementType Type { get; set; }

    [Range(1, int.MaxValue)]
    [JsonPropertyName("cantidad")]
    public int Quantity { get; set; }

    [JsonPropertyName("motivo")]
    public string? Reason { get; set; }
}
