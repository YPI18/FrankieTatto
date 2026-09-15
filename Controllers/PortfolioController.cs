using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.DTOs;
using FrankieTattoo.Api.Enums;
using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/portfolio")]
public class PortfolioController : ControllerBase
{
    private readonly AppDbContext _context;

    public PortfolioController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PortfolioItemDto>>> GetAll([FromQuery] ServiceType? category)
    {
        var query = _context.PortfolioItems.AsQueryable();

        if (category.HasValue)
            query = query.Where(p => p.Category == category.Value);

        var items = await query.OrderBy(p => p.Id).ToListAsync();

        var dtos = items.Select(p => new PortfolioItemDto
        {
            Id = p.Id,
            Title = p.Title,
            ImageUrl = p.ImageUrl,
            Category = p.Category,
            CreatedAt = p.CreatedAt
        });

        return Ok(dtos);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<PortfolioItemDto>> Create(PortfolioItemCreateDto dto)
    {
        var item = new PortfolioItem
        {
            Title = dto.Title,
            ImageUrl = dto.ImageUrl,
            Category = dto.Category,
            CreatedAt = DateTime.UtcNow
        };

        _context.PortfolioItems.Add(item);
        await _context.SaveChangesAsync();

        return Ok(new PortfolioItemDto
        {
            Id = item.Id,
            Title = item.Title,
            ImageUrl = item.ImageUrl,
            Category = item.Category,
            CreatedAt = item.CreatedAt
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PortfolioItemDto>> GetById(int id)
    {
        var item = await _context.PortfolioItems.FindAsync(id);
        if (item == null) return NotFound();

        return Ok(new PortfolioItemDto
        {
            Id = item.Id,
            Title = item.Title,
            ImageUrl = item.ImageUrl,
            Category = item.Category,
            CreatedAt = item.CreatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<PortfolioItemDto>> Update(int id, PortfolioItemUpdateDto dto)
    {
        var item = await _context.PortfolioItems.FindAsync(id);
        if (item == null) return NotFound();

        item.Title = dto.Title;
        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            item.ImageUrl = dto.ImageUrl;
        }
        if (dto.Category.HasValue)
        {
            item.Category = dto.Category.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(new PortfolioItemDto
        {
            Id = item.Id,
            Title = item.Title,
            ImageUrl = item.ImageUrl,
            Category = item.Category,
            CreatedAt = item.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.PortfolioItems.FindAsync(id);
        if (item == null) return NotFound();

        _context.PortfolioItems.Remove(item);
        await _context.SaveChangesAsync();

        // Reajustar la secuencia de ID en PostgreSQL para que no queden saltos
        try
        {
            var maxId = await _context.PortfolioItems.MaxAsync(p => (int?)p.Id) ?? 0;
            if (maxId > 0)
            {
                await _context.Database.ExecuteSqlAsync($"SELECT setval('\"PortfolioItems_Id_seq\"', {maxId});");
            }
            else
            {
                await _context.Database.ExecuteSqlRawAsync("ALTER SEQUENCE \"PortfolioItems_Id_seq\" RESTART WITH 1;");
            }
        }
        catch { }

        return NoContent();
    }
}
