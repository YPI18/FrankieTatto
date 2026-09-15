using System.Linq.Expressions;
using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.DTOs;
using FrankieTattoo.Api.Enums;
using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/products?type=Tattoo  (público)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll([FromQuery] ServiceType? type)
    {
        var query = _context.Products.Include(p => p.Category).AsQueryable();

        if (type.HasValue)
            query = query.Where(p => p.Type == type.Value);

        var products = await query.OrderBy(p => p.Id).Select(ProjectToDto).ToListAsync();
        return Ok(products);
    }

    // GET /api/products/low-stock  (Admin, Employee)
    [HttpGet("low-stock")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetLowStock()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.Stock <= p.LowStockThreshold)
            .Select(ProjectToDto)
            .ToListAsync();

        return Ok(products);
    }

    // GET /api/products/{id}  (público)
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.Id == id)
            .Select(ProjectToDto)
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound();

        return Ok(product);
    }

    // POST /api/products  (Admin, Employee)
    [HttpPost]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ProductDto>> Create(ProductCreateDto dto)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest("La categoría indicada no existe.");

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            Price = dto.Price,
            Stock = dto.Stock,
            LowStockThreshold = dto.LowStockThreshold,
            Type = dto.Type,
            CategoryId = dto.CategoryId
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return Ok(new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            ImageUrl = product.ImageUrl,
            Price = product.Price,
            Stock = product.Stock,
            LowStockThreshold = product.LowStockThreshold,
            Type = product.Type,
            CategoryId = product.CategoryId
        });
    }

    // POST /api/products/{id}/adjust-stock  (Admin, Employee)
    [HttpPost("{id}/adjust-stock")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> AdjustStock(int id, AdjustStockDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound();

        if (dto.Type == StockMovementType.Decrease && product.Stock < dto.Quantity)
            return BadRequest("No hay suficiente stock para esa reducción.");

        product.Stock += dto.Type == StockMovementType.Increase ? dto.Quantity : -dto.Quantity;

        _context.StockMovements.Add(new StockMovement
        {
            ProductId = product.Id,
            Type = dto.Type,
            Quantity = dto.Quantity,
            Reason = dto.Reason
        });

        await _context.SaveChangesAsync();

        return Ok(new { product.Id, product.Stock });
    }

    // PUT /api/products/{id}  (Admin, Employee)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ProductDto>> Update(int id, ProductCreateDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound();

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest("La categoría indicada no existe.");

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.ImageUrl = dto.ImageUrl;
        product.Price = dto.Price;
        product.Stock = dto.Stock;
        product.LowStockThreshold = dto.LowStockThreshold;
        product.Type = dto.Type;
        product.CategoryId = dto.CategoryId;

        await _context.SaveChangesAsync();

        return Ok(new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            ImageUrl = product.ImageUrl,
            Price = product.Price,
            Stock = product.Stock,
            LowStockThreshold = product.LowStockThreshold,
            Type = product.Type,
            CategoryId = product.CategoryId
        });
    }

    // DELETE /api/products/{id}  (Admin, Employee)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        // Reajustar la secuencia de ID en PostgreSQL para que no queden saltos
        try
        {
            var maxId = await _context.Products.MaxAsync(p => (int?)p.Id) ?? 0;
            if (maxId > 0)
            {
                await _context.Database.ExecuteSqlAsync($"SELECT setval('\"Products_Id_seq\"', {maxId});");
            }
            else
            {
                await _context.Database.ExecuteSqlRawAsync("ALTER SEQUENCE \"Products_Id_seq\" RESTART WITH 1;");
            }
        }
        catch { }

        return NoContent();
    }

    // Expression (no un método normal) para que EF Core la traduzca a SQL en el Select().
    private static readonly Expression<Func<Product, ProductDto>> ProjectToDto = p => new ProductDto
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        ImageUrl = p.ImageUrl,
        Price = p.Price,
        Stock = p.Stock,
        LowStockThreshold = p.LowStockThreshold,
        Type = p.Type,
        CategoryId = p.CategoryId,
        CategoryName = p.Category != null ? p.Category.Name : null
    };
}

