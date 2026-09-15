using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.DTOs;

public class OrderDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("fechaCreacion")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("estado")]
    public OrderStatus Status { get; set; }

    [JsonPropertyName("total")]
    public decimal Total { get; set; }

    [JsonPropertyName("tipoEntrega")]
    public string DeliveryType { get; set; } = "pickup";

    [JsonPropertyName("direccionEnvio")]
    public string? ShippingAddress { get; set; }

    [JsonPropertyName("ciudadEnvio")]
    public string? ShippingCity { get; set; }

    [JsonPropertyName("costoEnvio")]
    public decimal ShippingCost { get; set; }

    [JsonPropertyName("idCliente")]
    public int CustomerId { get; set; }
}

public class OrderItemCreateDto
{
    [Required]
    [JsonPropertyName("idProducto")]
    public int ProductId { get; set; }

    [Range(1, int.MaxValue)]
    [JsonPropertyName("cantidad")]
    public int Quantity { get; set; }
}

public class OrderCreateDto
{
    [Required]
    [JsonPropertyName("idCliente")]
    public int CustomerId { get; set; }

    [JsonPropertyName("tipoEntrega")]
    [MaxLength(50)]
    public string DeliveryType { get; set; } = "pickup";

    [JsonPropertyName("direccionEnvio")]
    [MaxLength(300)]
    public string? ShippingAddress { get; set; }

    [JsonPropertyName("ciudadEnvio")]
    [MaxLength(100)]
    public string? ShippingCity { get; set; }

    [JsonPropertyName("costoEnvio")]
    public decimal ShippingCost { get; set; }

    [Required, MinLength(1)]
    [JsonPropertyName("articulos")]
    public List<OrderItemCreateDto> Items { get; set; } = new();
}

public class OrderStatusUpdateDto
{
    [Required]
    [JsonPropertyName("estado")]
    public OrderStatus Status { get; set; }
}
