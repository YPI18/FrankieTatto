using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.DTOs;
using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomersController(AppDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll()
    {
        var customers = await _context.Customers
            .OrderBy(c => c.Id)
            .Select(c => new CustomerDto { Id = c.Id, FullName = c.FullName, Phone = c.Phone, Email = c.Email, InternalNotes = c.InternalNotes })
            .ToListAsync();

        return Ok(customers);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null)
            return NotFound();

        return Ok(new CustomerDto { Id = customer.Id, FullName = customer.FullName, Phone = customer.Phone, Email = customer.Email, InternalNotes = customer.InternalNotes });
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<CustomerDto>> Create(CustomerCreateDto dto)
    {
        bool isStaff = User.IsInRole("Admin") || User.IsInRole("Employee");
        var customer = new Customer 
        { 
            FullName = dto.FullName, 
            Phone = dto.Phone, 
            Email = dto.Email, 
            InternalNotes = isStaff ? dto.InternalNotes : null 
        };
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return Ok(new CustomerDto 
        { 
            Id = customer.Id, 
            FullName = customer.FullName, 
            Phone = customer.Phone, 
            Email = customer.Email, 
            InternalNotes = isStaff ? customer.InternalNotes : null 
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<CustomerDto>> Update(int id, CustomerCreateDto dto)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null)
            return NotFound();

        customer.FullName = dto.FullName;
        customer.Phone = dto.Phone;
        customer.Email = dto.Email;
        customer.InternalNotes = dto.InternalNotes;
        await _context.SaveChangesAsync();

        return Ok(new CustomerDto { Id = customer.Id, FullName = customer.FullName, Phone = customer.Phone, Email = customer.Email, InternalNotes = customer.InternalNotes });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _context.Customers
            .Include(c => c.Orders)
                .ThenInclude(o => o.Items)
            .Include(c => c.Appointments)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
            return NotFound();

        // 1. Eliminar pedidos e ítems asociados si existen
        if (customer.Orders.Any())
        {
            foreach (var order in customer.Orders)
            {
                _context.OrderItems.RemoveRange(order.Items);
            }
            _context.Orders.RemoveRange(customer.Orders);
        }

        // 2. Eliminar citas asociadas si existen
        if (customer.Appointments.Any())
        {
            _context.Appointments.RemoveRange(customer.Appointments);
        }

        // 3. Eliminar usuario de acceso (Identity) si está vinculado
        if (!string.IsNullOrEmpty(customer.ApplicationUserId))
        {
            var user = await _userManager.FindByIdAsync(customer.ApplicationUserId);
            if (user != null)
            {
                await _userManager.DeleteAsync(user);
            }
        }

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}


