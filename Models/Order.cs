using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.Models;

public class Order
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal Total { get; set; }

    public string DeliveryType { get; set; } = "pickup";
    public string? ShippingAddress { get; set; }
    public string? ShippingCity { get; set; }
    public decimal ShippingCost { get; set; } = 0;

    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
