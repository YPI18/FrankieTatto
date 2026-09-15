using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.DTOs;
using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/categories  (público)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Id)
            .Select(c => new CategoryDto { Id = c.Id, Name = c.Name, Description = c.Description })
            .ToListAsync();

        return Ok(categories);
    }

    // GET /api/categories/{id}  (público)
    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        return Ok(new CategoryDto { Id = category.Id, Name = category.Name, Description = category.Description });
    }

    // POST /api/categories  (Admin, Employee)
    [HttpPost]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<CategoryDto>> Create(CategoryCreateDto dto)
    {
        var category = new Category { Name = dto.Name, Description = dto.Description };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new CategoryDto { Id = category.Id, Name = category.Name, Description = category.Description });
    }

    // PUT /api/categories/{id}  (Admin, Employee)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<CategoryDto>> Update(int id, CategoryCreateDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        category.Name = dto.Name;
        category.Description = dto.Description;
        await _context.SaveChangesAsync();

        return Ok(new CategoryDto { Id = category.Id, Name = category.Name, Description = category.Description });
    }

    // DELETE /api/categories/{id}  (Admin, Employee)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
            return BadRequest("No se puede borrar: hay productos usando esta categoría.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

