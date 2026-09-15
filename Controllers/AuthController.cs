using System.Security.Claims;
using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.DTOs;
using FrankieTattoo.Api.Models;
using FrankieTattoo.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TokenService _tokenService;
    private readonly AppDbContext _context;

    public AuthController(UserManager<ApplicationUser> userManager, TokenService tokenService, AppDbContext context)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return BadRequest("Ya existe una cuenta con ese email.");

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        // Todo usuario nuevo entra como Customer
        await _userManager.AddToRoleAsync(user, "Customer");

        // Crear y guardar el cliente en la base de datos
        var customer = new Customer
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            ApplicationUserId = user.Id
        };
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.CreateToken(user, roles);

        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Set to true in production with HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        });

        return Ok(new AuthResponseDto
        {
            Token = token,
            Email = user.Email!,
            FullName = user.FullName,
            CustomerId = customer.Id,
            Phone = customer.Phone,
            Roles = roles
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return Unauthorized("Email o contraseña incorrectos.");

        if (await _userManager.IsLockedOutAsync(user))
            return Unauthorized("Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta más tarde.");

        var validPassword = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!validPassword)
        {
            await _userManager.AccessFailedAsync(user);
            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized("Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta más tarde.");
            return Unauthorized("Email o contraseña incorrectos.");
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        if (user.TwoFactorEnabled)
        {
            if (string.IsNullOrEmpty(dto.TwoFactorCode))
            {
                return Ok(new TwoFactorResponseDto { RequiresTwoFactor = true });
            }

            var is2faValid = await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, dto.TwoFactorCode);
            if (!is2faValid)
            {
                return Unauthorized("Código de verificación incorrecto.");
            }
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.CreateToken(user, roles);

        // Buscar el cliente asociado en la BD
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.ApplicationUserId == user.Id || c.Email == user.Email);
        if (customer == null && (roles.Contains("Customer") || roles.Count == 0))
        {
            customer = new Customer
            {
                FullName = user.FullName,
                Email = user.Email,
                ApplicationUserId = user.Id
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }

        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Set to true in production with HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        });

        return Ok(new AuthResponseDto
        {
            Token = token,
            Email = user.Email!,
            FullName = user.FullName,
            CustomerId = customer?.Id,
            Phone = customer?.Phone,
            Roles = roles
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt");
        return Ok(new { message = "Logged out successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponseDto>> GetCurrent()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email))
            return Unauthorized();

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
            return NotFound("Usuario no encontrado.");

        var roles = await _userManager.GetRolesAsync(user);
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.ApplicationUserId == user.Id || c.Email == user.Email);

        return Ok(new AuthResponseDto
        {
            Email = user.Email!,
            FullName = user.FullName,
            CustomerId = customer?.Id,
            Phone = customer?.Phone,
            Roles = roles
        });
    }

    [Authorize(Roles = "Admin,Employee")]
    [HttpGet("2fa-setup")]
    public async Task<IActionResult> SetupTwoFactor()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return Unauthorized();

        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var qrCodeUrl = $"otpauth://totp/FrankieTattoo:{user.Email}?secret={key}&issuer=FrankieTattoo";

        return Ok(new { key, qrCodeUrl, isEnabled = user.TwoFactorEnabled });
    }

    [Authorize(Roles = "Admin,Employee")]
    [HttpPost("2fa-enable")]
    public async Task<IActionResult> EnableTwoFactor(Enable2faDto dto)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return Unauthorized();

        var is2faValid = await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, dto.Code);
        if (!is2faValid)
        {
            return BadRequest("El código es incorrecto.");
        }

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { message = "Autenticación en 2 pasos activada." });
    }

    [Authorize(Roles = "Admin,Employee")]
    [HttpPost("2fa-disable")]
    public async Task<IActionResult> DisableTwoFactor()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return Unauthorized();

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        return Ok(new { message = "Autenticación en 2 pasos desactivada." });
    }
}

