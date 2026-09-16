using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FrankieTattoo.Api.DTOs;

public class ConsentFormCreateDto
{
    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [JsonPropertyName("clientName")]
    public string ClientName { get; set; } = string.Empty;

    [Required(ErrorMessage = "La cédula o pasaporte es obligatorio.")]
    [JsonPropertyName("identificationNumber")]
    public string IdentificationNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [Range(18, 120, ErrorMessage = "Debes ser mayor de 18 años.")]
    [JsonPropertyName("age")]
    public int Age { get; set; }

    [Required(ErrorMessage = "El tipo de procedimiento es obligatorio.")]
    [JsonPropertyName("procedureType")]
    public string ProcedureType { get; set; } = string.Empty;

    [Required(ErrorMessage = "La zona del cuerpo es obligatoria.")]
    [JsonPropertyName("bodyArea")]
    public string BodyArea { get; set; } = string.Empty;

    [JsonPropertyName("isAdultConfirmed")]
    public bool IsAdultConfirmed { get; set; } = true;

    [JsonPropertyName("noAlcoholOrDrugs")]
    public bool NoAlcoholOrDrugs { get; set; } = true;

    [JsonPropertyName("noSevereConditions")]
    public bool NoSevereConditions { get; set; } = true;

    [JsonPropertyName("notPregnantOrNursing")]
    public bool NotPregnantOrNursing { get; set; } = true;

    [JsonPropertyName("acceptsCareProtocol")]
    public bool AcceptsCareProtocol { get; set; } = true;

    [Required(ErrorMessage = "La firma digital es obligatoria.")]
    [JsonPropertyName("signatureData")]
    public string SignatureData { get; set; } = string.Empty;

    [JsonPropertyName("appointmentId")]
    public int? AppointmentId { get; set; }
}

public class ConsentFormDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("clientName")]
    public string ClientName { get; set; } = string.Empty;

    [JsonPropertyName("identificationNumber")]
    public string IdentificationNumber { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("age")]
    public int Age { get; set; }

    [JsonPropertyName("procedureType")]
    public string ProcedureType { get; set; } = string.Empty;

    [JsonPropertyName("bodyArea")]
    public string BodyArea { get; set; } = string.Empty;

    [JsonPropertyName("isAdultConfirmed")]
    public bool IsAdultConfirmed { get; set; }

    [JsonPropertyName("noAlcoholOrDrugs")]
    public bool NoAlcoholOrDrugs { get; set; }

    [JsonPropertyName("noSevereConditions")]
    public bool NoSevereConditions { get; set; }

    [JsonPropertyName("notPregnantOrNursing")]
    public bool NotPregnantOrNursing { get; set; }

    [JsonPropertyName("acceptsCareProtocol")]
    public bool AcceptsCareProtocol { get; set; }

    [JsonPropertyName("signatureData")]
    public string SignatureData { get; set; } = string.Empty;

    [JsonPropertyName("signedAt")]
    public DateTime SignedAt { get; set; }

    [JsonPropertyName("signedAtFormatted")]
    public string SignedAtFormatted => SignedAt.ToString("dd/MM/yyyy HH:mm");

    [JsonPropertyName("customerId")]
    public int? CustomerId { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("appointmentId")]
    public int? AppointmentId { get; set; }
}
