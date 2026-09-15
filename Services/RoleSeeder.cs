using FrankieTattoo.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace FrankieTattoo.Api.Services;

public static class RoleSeeder
{
    private static readonly string[] Roles = { "Admin", "Employee", "Customer" };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Crear o actualizar cuentas de administrador
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        
        await EnsureAdminUserAsync(userManager, "Franki@frankitattoo.com", "Franki Tattoo", "Franki");
        await EnsureAdminUserAsync(userManager, "yepezpinedaismael.18@gmail.com", "Ismael Yepez", "IsmaelYepez2026");
    }

    private static async Task EnsureAdminUserAsync(UserManager<ApplicationUser> userManager, string email, string fullName, string password)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, "Admin");
                await userManager.AddToRoleAsync(user, "Employee");
                Console.WriteLine($"✓ Usuario administrador {email} creado exitosamente.");
            }
            else
            {
                Console.WriteLine($"⚠ Error al crear {email}: " + string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            if (!await userManager.IsInRoleAsync(user, "Admin"))
            {
                await userManager.AddToRoleAsync(user, "Admin");
            }
            if (!await userManager.IsInRoleAsync(user, "Employee"))
            {
                await userManager.AddToRoleAsync(user, "Employee");
            }
        }
    }
}
