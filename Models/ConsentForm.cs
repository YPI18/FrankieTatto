namespace FrankieTattoo.Api.Models;

public class ConsentForm
{
    public int Id { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty; // Cédula o pasaporte
    public string Phone { get; set; } = string.Empty;
    public int Age { get; set; }
    public string ProcedureType { get; set; } = string.Empty; // Tatuaje, Piercing, etc.
    public string BodyArea { get; set; } = string.Empty;

    // Declaraciones de salud y bioseguridad
    public bool IsAdultConfirmed { get; set; } = true;
    public bool NoAlcoholOrDrugs { get; set; } = true;
    public bool NoSevereConditions { get; set; } = true;
    public bool NotPregnantOrNursing { get; set; } = true;
    public bool AcceptsCareProtocol { get; set; } = true;

    // Firma digital (Base64 data URL)
    public string SignatureData { get; set; } = string.Empty;

    public DateTime SignedAt { get; set; } = DateTime.UtcNow;

    // Relación con Cliente y Cita
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
}
