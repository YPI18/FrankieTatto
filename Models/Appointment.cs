using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.Models;

public class Appointment
{
    public int Id { get; set; }
    public DateTime ScheduledAt { get; set; }
    public ServiceType Type { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string? Notes { get; set; }

    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
}
