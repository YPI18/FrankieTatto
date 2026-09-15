using System.ComponentModel.DataAnnotations;
using FrankieTattoo.Api.Enums;

namespace FrankieTattoo.Api.Models;

public class PortfolioItem
{
    public int Id { get; set; }
    
    [Required]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string ImageUrl { get; set; } = string.Empty;
    
    public ServiceType Category { get; set; } // Tattoo, Piercing, etc.
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
