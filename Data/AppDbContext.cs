using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<PortfolioItem> PortfolioItems => Set<PortfolioItem>();
    public DbSet<ConsentForm> ConsentForms => Set<ConsentForm>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Product>()
            .Property(p => p.Price)
            .HasColumnType("numeric(18,2)");

        builder.Entity<Order>()
            .Property(o => o.Total)
            .HasColumnType("numeric(18,2)");

        builder.Entity<Order>()
            .Property(o => o.ShippingCost)
            .HasColumnType("numeric(18,2)");

        builder.Entity<OrderItem>()
            .Property(oi => oi.UnitPrice)
            .HasColumnType("numeric(18,2)");

        builder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StockMovement>()
            .HasOne(sm => sm.Product)
            .WithMany(p => p.StockMovements)
            .HasForeignKey(sm => sm.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Appointment>()
            .HasOne(a => a.Customer)
            .WithMany(c => c.Appointments)
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Appointment>()
            .HasOne(a => a.Employee)
            .WithMany(e => e.Appointments)
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Order>()
            .HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ConsentForm>()
            .HasOne(c => c.Customer)
            .WithMany(cust => cust.ConsentForms)
            .HasForeignKey(c => c.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ConsentForm>()
            .HasOne(c => c.Appointment)
            .WithOne(a => a.ConsentForm)
            .HasForeignKey<ConsentForm>(c => c.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
