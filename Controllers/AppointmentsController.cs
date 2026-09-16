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
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    // Horarios estándar del estudio (Lunes a Sábado)
    private static readonly string[] StandardSlots = { "10:00", "11:30", "14:00", "15:30", "17:00", "18:30" };

    public AppointmentsController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/appointments (Admin, Empleados)
    [HttpGet]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAll()
    {
        var appointments = await _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Employee)
            .OrderByDescending(a => a.ScheduledAt)
            .Select(a => new AppointmentDto
            {
                Id = a.Id,
                ScheduledAt = a.ScheduledAt,
                Type = a.Type,
                Status = a.Status,
                Notes = a.Notes,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer != null ? a.Customer.FullName : null,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee != null ? a.Employee.FullName : null,
                ConsentFormId = a.ConsentFormId
            })
            .ToListAsync();

        return Ok(appointments);
    }

    // GET /api/appointments/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<AppointmentDto>> GetById(int id)
    {
        var a = await _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (a == null)
            return NotFound();

        return Ok(new AppointmentDto
        {
            Id = a.Id,
            ScheduledAt = a.ScheduledAt,
            Type = a.Type,
            Status = a.Status,
            Notes = a.Notes,
            CustomerId = a.CustomerId,
            CustomerName = a.Customer != null ? a.Customer.FullName : null,
            EmployeeId = a.EmployeeId,
            EmployeeName = a.Employee != null ? a.Employee.FullName : null,
            ConsentFormId = a.ConsentFormId
        });
    }

    // GET /api/appointments/availability?date=2026-09-10&type=Tattoo
    [HttpGet("availability")]
    public async Task<ActionResult<IEnumerable<AppointmentSlotDto>>> GetAvailability([FromQuery] string date, [FromQuery] ServiceType type = ServiceType.Tattoo)
    {
        if (!DateOnly.TryParse(date, out var parsedDate))
        {
            return BadRequest("El formato de fecha debe ser YYYY-MM-DD.");
        }

        var startOfDayUtc = DateTime.SpecifyKind(parsedDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var endOfDayUtc = DateTime.SpecifyKind(parsedDate.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);

        // Obtenemos citas activas (no canceladas) para ese día
        var bookedAppointments = await _context.Appointments
            .Where(a => a.ScheduledAt >= startOfDayUtc && a.ScheduledAt <= endOfDayUtc && a.Status != AppointmentStatus.Cancelled)
            .ToListAsync();

        var slots = new List<AppointmentSlotDto>();
        foreach (var slotStr in StandardSlots)
        {
            var slotTime = TimeOnly.Parse(slotStr);
            var slotUtc = DateTime.SpecifyKind(parsedDate.ToDateTime(slotTime), DateTimeKind.Utc);

            bool isOccupied = bookedAppointments.Any(a => Math.Abs((a.ScheduledAt - slotUtc).TotalMinutes) < 45);

            slots.Add(new AppointmentSlotDto
            {
                Date = parsedDate.ToString("yyyy-MM-dd"),
                Time = slotStr,
                Label = $"{slotStr} hs",
                Available = !isOccupied
            });
        }

        return Ok(slots);
    }

    // GET /api/appointments/recommended?type=Tattoo
    [HttpGet("recommended")]
    public async Task<ActionResult<IEnumerable<AppointmentSlotDto>>> GetRecommended([FromQuery] ServiceType type = ServiceType.Tattoo)
    {
        var suggestions = new List<AppointmentSlotDto>();
        var now = DateTime.UtcNow;
        var startDate = DateOnly.FromDateTime(now.AddDays(1)); // Comenzamos a sugerir desde mañana

        // Revisar hasta los próximos 14 días para encontrar 4 horarios libres
        for (int dayOffset = 0; dayOffset < 14 && suggestions.Count < 4; dayOffset++)
        {
            var checkDate = startDate.AddDays(dayOffset);

            // Si es domingo, omitimos (estudio cerrado)
            if (checkDate.DayOfWeek == DayOfWeek.Sunday)
                continue;

            var startOfDayUtc = DateTime.SpecifyKind(checkDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
            var endOfDayUtc = DateTime.SpecifyKind(checkDate.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);

            var booked = await _context.Appointments
                .Where(a => a.ScheduledAt >= startOfDayUtc && a.ScheduledAt <= endOfDayUtc && a.Status != AppointmentStatus.Cancelled)
                .ToListAsync();

            foreach (var slotStr in StandardSlots)
            {
                var slotTime = TimeOnly.Parse(slotStr);
                var slotUtc = DateTime.SpecifyKind(checkDate.ToDateTime(slotTime), DateTimeKind.Utc);

                bool isOccupied = booked.Any(a => Math.Abs((a.ScheduledAt - slotUtc).TotalMinutes) < 45);
                if (!isOccupied)
                {
                    string dayName = checkDate.DayOfWeek switch
                    {
                        DayOfWeek.Monday => "Lunes",
                        DayOfWeek.Tuesday => "Martes",
                        DayOfWeek.Wednesday => "Miércoles",
                        DayOfWeek.Thursday => "Jueves",
                        DayOfWeek.Friday => "Viernes",
                        DayOfWeek.Saturday => "Sábado",
                        _ => "Día"
                    };

                    suggestions.Add(new AppointmentSlotDto
                    {
                        Date = checkDate.ToString("yyyy-MM-dd"),
                        Time = slotStr,
                        Label = $"{dayName} {checkDate:dd/MM} - {slotStr}",
                        Available = true
                    });

                    if (suggestions.Count >= 4) break;
                }
            }
        }

        return Ok(suggestions);
    }

    // POST /api/appointments/book (Público, usado por el Chatbot)
    [HttpPost("book")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AppointmentBookingResponseDto>> BookPublic(AppointmentBookingRequestDto dto)
    {
        if (!DateOnly.TryParse(dto.Date, out var parsedDate) || !TimeOnly.TryParse(dto.Time, out var parsedTime))
        {
            return BadRequest(new AppointmentBookingResponseDto
            {
                Success = false,
                Occupied = false,
                Message = "Formato de fecha u hora no válido (use YYYY-MM-DD y HH:mm)."
            });
        }

        var requestedUtc = DateTime.SpecifyKind(parsedDate.ToDateTime(parsedTime), DateTimeKind.Utc);

        // 1. Validar que no sea una fecha pasada
        if (requestedUtc < DateTime.UtcNow.AddMinutes(-30))
        {
            return BadRequest(new AppointmentBookingResponseDto
            {
                Success = false,
                Occupied = false,
                Message = "No es posible agendar citas en fechas u horarios pasados."
            });
        }

        // 2. Verificar si ya existe una cita en ese horario (+- 45 min)
        var sameDayStartUtc = DateTime.SpecifyKind(parsedDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var sameDayEndUtc = DateTime.SpecifyKind(parsedDate.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);

        var existingAppointments = await _context.Appointments
            .Where(a => a.ScheduledAt >= sameDayStartUtc && a.ScheduledAt <= sameDayEndUtc && a.Status != AppointmentStatus.Cancelled)
            .ToListAsync();

        bool isOccupied = existingAppointments.Any(a => Math.Abs((a.ScheduledAt - requestedUtc).TotalMinutes) < 45);

        if (isOccupied)
        {
            // Buscar las próximas 3 alternativas libres para sugerir
            var suggestions = await FindAvailableSlotsAround(parsedDate, dto.Type, 3);

            return Conflict(new AppointmentBookingResponseDto
            {
                Success = false,
                Occupied = true,
                Message = "⚠️ La fecha y hora seleccionada ya se encuentra ocupada por otra cita.",
                Suggestions = suggestions
            });
        }

        // 3. Obtener o registrar al Cliente
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Phone == dto.Phone || (!string.IsNullOrEmpty(dto.Email) && c.Email == dto.Email));

        if (customer == null)
        {
            customer = new Customer
            {
                FullName = dto.FullName.Trim(),
                Phone = dto.Phone.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim()
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }
        else if (string.IsNullOrEmpty(customer.Phone))
        {
            customer.Phone = dto.Phone.Trim();
            await _context.SaveChangesAsync();
        }

        // 4. Crear la Cita
        var appointment = new Appointment
        {
            CustomerId = customer.Id,
            ScheduledAt = requestedUtc,
            Type = dto.Type,
            Status = AppointmentStatus.Pending,
            Notes = dto.Notes?.Trim()
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return Ok(new AppointmentBookingResponseDto
        {
            Success = true,
            Occupied = false,
            AppointmentId = appointment.Id,
            ScheduledText = $"{parsedDate:yyyy-MM-dd} a las {dto.Time}",
            Message = "¡Cita registrada con éxito en el sistema!"
        });
    }

    // POST /api/appointments (Panel Interno)
    [HttpPost]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<AppointmentDto>> Create(AppointmentCreateDto dto)
    {
        var scheduledUtc = DateTime.SpecifyKind(dto.ScheduledAt, DateTimeKind.Utc);

        var appointment = new Appointment
        {
            CustomerId = dto.CustomerId,
            EmployeeId = dto.EmployeeId,
            ScheduledAt = scheduledUtc,
            Type = dto.Type,
            Status = AppointmentStatus.Pending,
            Notes = dto.Notes
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, new AppointmentDto
        {
            Id = appointment.Id,
            ScheduledAt = appointment.ScheduledAt,
            Type = appointment.Type,
            Status = appointment.Status,
            Notes = appointment.Notes,
            CustomerId = appointment.CustomerId,
            EmployeeId = appointment.EmployeeId
        });
    }

    // PATCH /api/appointments/{id}/status (Panel Interno)
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> UpdateStatus(int id, AppointmentStatusUpdateDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            return NotFound();

        appointment.Status = dto.Status;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE /api/appointments/{id} (Panel Interno)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Delete(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            return NotFound();

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Helper para encontrar alternativas libres
    private async Task<List<AppointmentSlotDto>> FindAvailableSlotsAround(DateOnly baseDate, ServiceType type, int maxSuggestions)
    {
        var suggestions = new List<AppointmentSlotDto>();
        for (int offset = 0; offset < 7 && suggestions.Count < maxSuggestions; offset++)
        {
            var checkDate = baseDate.AddDays(offset);
            if (checkDate.DayOfWeek == DayOfWeek.Sunday) continue;

            var startOfDayUtc = DateTime.SpecifyKind(checkDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
            var endOfDayUtc = DateTime.SpecifyKind(checkDate.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);

            var booked = await _context.Appointments
                .Where(a => a.ScheduledAt >= startOfDayUtc && a.ScheduledAt <= endOfDayUtc && a.Status != AppointmentStatus.Cancelled)
                .ToListAsync();

            foreach (var slotStr in StandardSlots)
            {
                var slotTime = TimeOnly.Parse(slotStr);
                var slotUtc = DateTime.SpecifyKind(checkDate.ToDateTime(slotTime), DateTimeKind.Utc);

                if (slotUtc <= DateTime.UtcNow) continue;

                bool isOccupied = booked.Any(a => Math.Abs((a.ScheduledAt - slotUtc).TotalMinutes) < 45);
                if (!isOccupied)
                {
                    string dayName = checkDate.DayOfWeek switch
                    {
                        DayOfWeek.Monday => "Lun",
                        DayOfWeek.Tuesday => "Mar",
                        DayOfWeek.Wednesday => "Mié",
                        DayOfWeek.Thursday => "Jue",
                        DayOfWeek.Friday => "Vie",
                        DayOfWeek.Saturday => "Sáb",
                        _ => "Día"
                    };

                    suggestions.Add(new AppointmentSlotDto
                    {
                        Date = checkDate.ToString("yyyy-MM-dd"),
                        Time = slotStr,
                        Label = $"{dayName} {checkDate:dd/MM} a las {slotStr}",
                        Available = true
                    });

                    if (suggestions.Count >= maxSuggestions) break;
                }
            }
        }
        return suggestions;
    }
}
