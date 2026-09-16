namespace FrankieTattoo.Api.Models;

public class Customer
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? InternalNotes { get; set; }

    public string? ApplicationUserId { get; set; }
    public ApplicationUser? ApplicationUser { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<ConsentForm> ConsentForms { get; set; } = new List<ConsentForm>();
}
