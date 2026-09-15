using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.DTOs;

public class AppointmentDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("fechaHora")]
    public DateTime ScheduledAt { get; set; }

    [JsonPropertyName("tipoServicio")]
    public ServiceType Type { get; set; }

    [JsonPropertyName("estado")]
    public AppointmentStatus Status { get; set; }

    [JsonPropertyName("notas")]
    public string? Notes { get; set; }

    [JsonPropertyName("idCliente")]
    public int CustomerId { get; set; }

    [JsonPropertyName("nombreCliente")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("idEmpleado")]
    public int? EmployeeId { get; set; }

    [JsonPropertyName("nombreEmpleado")]
    public string? EmployeeName { get; set; }
}

public class AppointmentCreateDto
{
    [Required]
    [JsonPropertyName("fechaHora")]
    public DateTime ScheduledAt { get; set; }

    [Required]
    [JsonPropertyName("tipoServicio")]
    public ServiceType Type { get; set; }

    [JsonPropertyName("notas")]
    public string? Notes { get; set; }

    [Required]
    [JsonPropertyName("idCliente")]
    public int CustomerId { get; set; }

    [JsonPropertyName("idEmpleado")]
    public int? EmployeeId { get; set; }
}

public class AppointmentStatusUpdateDto
{
    [Required]
    [JsonPropertyName("estado")]
    public AppointmentStatus Status { get; set; }
}

public class AppointmentBookingRequestDto
{
    [Required]
    [JsonPropertyName("nombreCompleto")]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("telefono")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("correo")]
    public string? Email { get; set; }

    [Required]
    [JsonPropertyName("fecha")]
    public string Date { get; set; } = string.Empty; // "YYYY-MM-DD"

    [Required]
    [JsonPropertyName("hora")]
    public string Time { get; set; } = string.Empty; // "14:00"

    [Required]
    [JsonPropertyName("tipoServicio")]
    public ServiceType Type { get; set; } // Tattoo or Piercing

    [JsonPropertyName("notas")]
    public string? Notes { get; set; }
}

public class AppointmentSlotDto
{
    [JsonPropertyName("fecha")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("hora")]
    public string Time { get; set; } = string.Empty;

    [JsonPropertyName("etiqueta")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("disponible")]
    public bool Available { get; set; }
}

public class AppointmentBookingResponseDto
{
    [JsonPropertyName("exito")]
    public bool Success { get; set; }

    [JsonPropertyName("ocupado")]
    public bool Occupied { get; set; }

    [JsonPropertyName("mensaje")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("idCita")]
    public int? AppointmentId { get; set; }

    [JsonPropertyName("fechaHoraTexto")]
    public string? ScheduledText { get; set; }

    [JsonPropertyName("sugerencias")]
    public List<AppointmentSlotDto> Suggestions { get; set; } = new();
}

