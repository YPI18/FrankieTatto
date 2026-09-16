using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.DTOs;
using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/consents")]
public class ConsentFormsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ConsentFormsController> _logger;

    public ConsentFormsController(AppDbContext context, ILogger<ConsentFormsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // POST /api/consents (Público: enviado desde consentimiento.html)
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult> Create(ConsentFormCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // 1. Buscar o crear el cliente asociado por teléfono o nombre
        var cleanPhone = dto.Phone.Trim();
        var cleanName = dto.ClientName.Trim();

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Phone == cleanPhone || c.FullName.ToLower() == cleanName.ToLower());

        if (customer == null)
        {
            customer = new Customer
            {
                FullName = cleanName,
                Phone = cleanPhone,
                InternalNotes = $"Cédula/ID: {dto.IdentificationNumber.Trim()} • Registrado vía Ficha de Consentimiento"
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }

        // 2. Crear la entidad de consentimiento
        var consent = new ConsentForm
        {
            ClientName = cleanName,
            IdentificationNumber = dto.IdentificationNumber.Trim(),
            Phone = cleanPhone,
            Age = dto.Age,
            ProcedureType = dto.ProcedureType,
            BodyArea = dto.BodyArea.Trim(),
            IsAdultConfirmed = dto.IsAdultConfirmed,
            NoAlcoholOrDrugs = dto.NoAlcoholOrDrugs,
            NoSevereConditions = dto.NoSevereConditions,
            NotPregnantOrNursing = dto.NotPregnantOrNursing,
            AcceptsCareProtocol = dto.AcceptsCareProtocol,
            SignatureData = dto.SignatureData,
            SignedAt = DateTime.UtcNow,
            CustomerId = customer.Id
        };

        // 3. Vincular con cita existente (si vino especificada o si tiene una cita próxima)
        if (dto.AppointmentId.HasValue)
        {
            var appointment = await _context.Appointments.FindAsync(dto.AppointmentId.Value);
            if (appointment != null)
            {
                consent.AppointmentId = appointment.Id;
            }
        }
        else
        {
            // Buscar la cita más cercana (futura o de hoy) de este cliente
            var nowUtc = DateTime.UtcNow.AddHours(-12);
            var nearbyAppointment = await _context.Appointments
                .Where(a => a.CustomerId == customer.Id && a.ScheduledAt >= nowUtc && a.ConsentFormId == null)
                .OrderBy(a => a.ScheduledAt)
                .FirstOrDefaultAsync();

            if (nearbyAppointment != null)
            {
                consent.AppointmentId = nearbyAppointment.Id;
            }
        }

        _context.ConsentForms.Add(consent);
        await _context.SaveChangesAsync();

        // Si se vinculó a una cita, actualizar la cita con el ID de la ficha
        if (consent.AppointmentId.HasValue)
        {
            var appt = await _context.Appointments.FindAsync(consent.AppointmentId.Value);
            if (appt != null)
            {
                appt.ConsentFormId = consent.Id;
                await _context.SaveChangesAsync();
            }
        }

        _logger.LogInformation("Ficha de consentimiento #{Id} registrada para {Client}", consent.Id, consent.ClientName);

        return Ok(new
        {
            id = consent.Id,
            message = "Ficha de consentimiento registrada exitosamente en el sistema de Franki Tattoo.",
            signedAt = consent.SignedAt,
            appointmentId = consent.AppointmentId
        });
    }

    // GET /api/consents (Admin, Empleados)
    [HttpGet]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<IEnumerable<ConsentFormDto>>> GetAll()
    {
        var items = await _context.ConsentForms
            .Include(c => c.Customer)
            .OrderByDescending(c => c.SignedAt)
            .Select(c => new ConsentFormDto
            {
                Id = c.Id,
                ClientName = c.ClientName,
                IdentificationNumber = c.IdentificationNumber,
                Phone = c.Phone,
                Age = c.Age,
                ProcedureType = c.ProcedureType,
                BodyArea = c.BodyArea,
                IsAdultConfirmed = c.IsAdultConfirmed,
                NoAlcoholOrDrugs = c.NoAlcoholOrDrugs,
                NoSevereConditions = c.NoSevereConditions,
                NotPregnantOrNursing = c.NotPregnantOrNursing,
                AcceptsCareProtocol = c.AcceptsCareProtocol,
                SignatureData = c.SignatureData,
                SignedAt = c.SignedAt,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer != null ? c.Customer.FullName : c.ClientName,
                AppointmentId = c.AppointmentId
            })
            .ToListAsync();

        return Ok(items);
    }

    // GET /api/consents/{id} (Admin, Empleados)
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ConsentFormDto>> GetById(int id)
    {
        var c = await _context.ConsentForms
            .Include(c => c.Customer)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c == null)
            return NotFound("Ficha de consentimiento no encontrada.");

        return Ok(new ConsentFormDto
        {
            Id = c.Id,
            ClientName = c.ClientName,
            IdentificationNumber = c.IdentificationNumber,
            Phone = c.Phone,
            Age = c.Age,
            ProcedureType = c.ProcedureType,
            BodyArea = c.BodyArea,
            IsAdultConfirmed = c.IsAdultConfirmed,
            NoAlcoholOrDrugs = c.NoAlcoholOrDrugs,
            NoSevereConditions = c.NoSevereConditions,
            NotPregnantOrNursing = c.NotPregnantOrNursing,
            AcceptsCareProtocol = c.AcceptsCareProtocol,
            SignatureData = c.SignatureData,
            SignedAt = c.SignedAt,
            CustomerId = c.CustomerId,
            CustomerName = c.Customer != null ? c.Customer.FullName : c.ClientName,
            AppointmentId = c.AppointmentId
        });
    }

    // GET /api/consents/by-appointment/{appointmentId} (Admin, Empleados)
    [HttpGet("by-appointment/{appointmentId}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<ConsentFormDto>> GetByAppointment(int appointmentId)
    {
        var c = await _context.ConsentForms
            .Include(c => c.Customer)
            .FirstOrDefaultAsync(x => x.AppointmentId == appointmentId);

        if (c == null)
            return NotFound("No existe ficha de consentimiento vinculada a esta cita.");

        return Ok(new ConsentFormDto
        {
            Id = c.Id,
            ClientName = c.ClientName,
            IdentificationNumber = c.IdentificationNumber,
            Phone = c.Phone,
            Age = c.Age,
            ProcedureType = c.ProcedureType,
            BodyArea = c.BodyArea,
            IsAdultConfirmed = c.IsAdultConfirmed,
            NoAlcoholOrDrugs = c.NoAlcoholOrDrugs,
            NoSevereConditions = c.NoSevereConditions,
            NotPregnantOrNursing = c.NotPregnantOrNursing,
            AcceptsCareProtocol = c.AcceptsCareProtocol,
            SignatureData = c.SignatureData,
            SignedAt = c.SignedAt,
            CustomerId = c.CustomerId,
            CustomerName = c.Customer != null ? c.Customer.FullName : c.ClientName,
            AppointmentId = c.AppointmentId
        });
    }

    // DELETE /api/consents/{id} (Solo Admin)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var consent = await _context.ConsentForms.FindAsync(id);
        if (consent == null)
            return NotFound();

        // Desvincular de la cita si la tenía
        if (consent.AppointmentId.HasValue)
        {
            var appt = await _context.Appointments.FindAsync(consent.AppointmentId.Value);
            if (appt != null && appt.ConsentFormId == consent.Id)
            {
                appt.ConsentFormId = null;
            }
        }

        _context.ConsentForms.Remove(consent);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
