using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> GetSummary()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var weekAgo = today.AddDays(-7);

        var appointmentsToday = await _context.Appointments
            .Where(a => a.ScheduledAt >= today && a.ScheduledAt < tomorrow && a.Status != AppointmentStatus.Cancelled)
            .CountAsync();

        var lowStockProducts = await _context.Products
            .Where(p => p.Stock <= p.LowStockThreshold)
            .CountAsync();

        var weeklySales = await _context.Orders
            .Where(o => o.CreatedAt >= weekAgo && o.Status == OrderStatus.Completed)
            .SumAsync(o => o.Total);

        var lowStockNames = await _context.Products
            .Where(p => p.Stock <= p.LowStockThreshold)
            .Select(p => p.Name)
            .Take(3)
            .ToListAsync();

        string aiMessage = $"¡Buen día! Hoy tienes {appointmentsToday} citas programadas. ";

        if (lowStockProducts > 0)
        {
            aiMessage += $"Tienes {lowStockProducts} productos con stock bajo (ej. {string.Join(", ", lowStockNames)}). ";
        }
        else
        {
            aiMessage += "Tu inventario está perfecto. ";
        }

        aiMessage += $"En los últimos 7 días has sumado ${weeklySales:0.00} en ventas completadas. ¡Sigue así!";

        // Chart Data logic (last 7 days)
        var last7Days = Enumerable.Range(0, 7).Select(i => today.AddDays(-i)).Reverse().ToList();
        var chartLabels = last7Days.Select(d => d.ToString("dd/MM")).ToList();

        var ordersList = await _context.Orders
            .Where(o => o.CreatedAt >= today.AddDays(-6) && o.Status == OrderStatus.Completed)
            .ToListAsync();
            
        var appointmentsList = await _context.Appointments
            .Where(a => a.ScheduledAt >= today.AddDays(-6) && a.Status != AppointmentStatus.Cancelled)
            .ToListAsync();

        var salesChartData = last7Days.Select(d => ordersList.Where(o => o.CreatedAt.Date == d.Date).Sum(o => o.Total)).ToList();
        var appointmentsChartData = last7Days.Select(d => appointmentsList.Count(a => a.ScheduledAt.Date == d.Date)).ToList();

        return Ok(new
        {
            appointmentsToday,
            lowStockProducts,
            weeklySales,
            aiMessage,
            chartLabels,
            salesChartData,
            appointmentsChartData
        });
    }
}
