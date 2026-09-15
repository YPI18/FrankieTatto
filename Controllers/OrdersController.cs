using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.DTOs;
using FrankieTattoo.Api.Enums;
using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/orders  (Admin, Employee)
    [HttpGet]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
    {
        var orders = await _context.Orders
            .OrderBy(o => o.Id)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                CreatedAt = o.CreatedAt,
                Status = o.Status,
                Total = o.Total,
                DeliveryType = o.DeliveryType,
                ShippingAddress = o.ShippingAddress,
                ShippingCity = o.ShippingCity,
                ShippingCost = o.ShippingCost,
                CustomerId = o.CustomerId
            })
            .ToListAsync();

        return Ok(orders);
    }

    // GET /api/orders/{id}  (Admin, Employee)
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return NotFound();

        return Ok(new OrderDto
        {
            Id = order.Id,
            CreatedAt = order.CreatedAt,
            Status = order.Status,
            Total = order.Total,
            DeliveryType = order.DeliveryType,
            ShippingAddress = order.ShippingAddress,
            ShippingCity = order.ShippingCity,
            ShippingCost = order.ShippingCost,
            CustomerId = order.CustomerId
        });
    }

    // POST /api/orders  (Cualquier cliente / invitado al comprar) — descuenta stock automáticamente
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<OrderDto>> Create(OrderCreateDto dto)
    {
        var customerExists = await _context.Customers.FindAsync(dto.CustomerId);
        if (customerExists == null)
            return BadRequest("El cliente indicado no existe.");

        if (dto.Items == null || dto.Items.Count == 0)
            return BadRequest("El pedido necesita al menos un producto.");

        // Determinación segura y cálculo en servidor del costo de envío
        string deliveryType = dto.DeliveryType?.Trim().ToLowerInvariant() switch
        {
            "delivery_servientrega" => "delivery_servientrega",
            "delivery_local" => "delivery_local",
            _ => "pickup"
        };

        decimal shippingCost = 0m;
        string? shippingCity = null;
        string? shippingAddress = dto.ShippingAddress?.Trim();

        if (deliveryType == "delivery_servientrega")
        {
            shippingCost = 5.00m;
            shippingCity = string.IsNullOrWhiteSpace(dto.ShippingCity) ? "Nacional" : dto.ShippingCity.Trim();
            if (string.IsNullOrWhiteSpace(shippingAddress))
                return BadRequest("La dirección y referencia de entrega son obligatorias para envíos por Servientrega.");
        }
        else if (deliveryType == "delivery_local")
        {
            shippingCost = 2.00m;
            shippingCity = "Ibarra";
            if (string.IsNullOrWhiteSpace(shippingAddress))
                return BadRequest("La dirección y referencia de entrega son obligatorias para envíos a domicilio.");
        }

        var order = new Order 
        { 
            CustomerId = dto.CustomerId, 
            Status = OrderStatus.Pending,
            DeliveryType = deliveryType,
            ShippingCity = shippingCity,
            ShippingAddress = shippingAddress,
            ShippingCost = shippingCost
        };

        decimal total = 0;

        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0)
                return BadRequest("La cantidad de cada producto debe ser mayor a cero.");

            var product = await _context.Products.FindAsync(item.ProductId);
            if (product == null)
                return BadRequest($"El producto {item.ProductId} no existe.");

            if (product.Stock < item.Quantity)
                return BadRequest($"No hay suficiente stock de '{product.Name}'.");

            product.Stock -= item.Quantity;

            _context.StockMovements.Add(new StockMovement
            {
                ProductId = product.Id,
                Type = StockMovementType.Decrease,
                Quantity = item.Quantity,
                Reason = "Venta (pedido)"
            });

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });

            total += product.Price * item.Quantity;
        }

        order.Total = total + shippingCost;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(new OrderDto
        {
            Id = order.Id,
            CreatedAt = order.CreatedAt,
            Status = order.Status,
            Total = order.Total,
            DeliveryType = order.DeliveryType,
            ShippingAddress = order.ShippingAddress,
            ShippingCity = order.ShippingCity,
            ShippingCost = order.ShippingCost,
            CustomerId = order.CustomerId
        });
    }

    // PATCH /api/orders/{id}/status  (Admin, Employee)
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> UpdateStatus(int id, OrderStatusUpdateDto dto)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return NotFound();

        order.Status = dto.Status;
        await _context.SaveChangesAsync();

        return Ok(new { order.Id, order.Status });
    }

    // DELETE /api/orders/{id}  (Admin, Employee) — devuelve el stock descontado
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
            return NotFound();

        foreach (var item in order.Items)
        {
            var product = await _context.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.Stock += item.Quantity;
                _context.StockMovements.Add(new StockMovement
                {
                    ProductId = product.Id,
                    Type = StockMovementType.Increase,
                    Quantity = item.Quantity,
                    Reason = "Pedido borrado"
                });
            }
        }

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

