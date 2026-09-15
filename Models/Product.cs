using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int LowStockThreshold { get; set; } = 5;
    public ServiceType Type { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
