using FrankieTattoo.Api.Data;
using FrankieTattoo.Api.Enums;
using FrankieTattoo.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FrankieTattoo.Api.Services;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<AppDbContext>();

        // 1. Asegurar categorias
        var catPiercings = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Piercings y Joyería");
        if (catPiercings == null)
        {
            catPiercings = new Category
            {
                Name = "Piercings y Joyería",
                Description = "Joyería corporal en acero quirúrgico hipoalergénico grado médico."
            };
            context.Categories.Add(catPiercings);
        }

        var catVapes = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Smokes y Vapes");
        if (catVapes == null)
        {
            catVapes = new Category
            {
                Name = "Smokes y Vapes",
                Description = "Dispositivos desechables, pods recargables y esencias importadas."
            };
            context.Categories.Add(catVapes);
        }

        var catArtesanias = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Artesanías y Decoración");
        if (catArtesanias == null)
        {
            catArtesanias = new Category
            {
                Name = "Artesanías y Decoración",
                Description = "Piezas artesanales, cuadros dark art, esculturas y accesorios del estudio."
            };
            context.Categories.Add(catArtesanias);
        }

        var catTattoos = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Tatuajes");
        if (catTattoos == null)
        {
            catTattoos = new Category
            {
                Name = "Tatuajes",
                Description = "Diseños y estilos personalizados de tatuajes profesionales."
            };
            context.Categories.Add(catTattoos);
        }

        await context.SaveChangesAsync();

        // 2. Sembrar y Sincronizar Portafolio Real con IDs limpios y ordenados
        var initialPortfolio = new List<PortfolioItem>
        {
            // Tatuajes Reales de Franki Tattoo (1 al 17)
            new PortfolioItem { Title = "Dragon Ball • Shenlong", ImageUrl = "images/tattoo-shenlong-dragonball.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Manga León & Reloj", ImageUrl = "images/tattoo-manga-leon-reloj.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Rosas & Mariposa Espalda", ImageUrl = "images/tattoo-espalda-rosas-mariposa.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Flores Línea Fina & Botánico", ImageUrl = "images/tattoo-flores-antebrazo-fineline.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Spider-Man a Color", ImageUrl = "images/tattoo-spiderman-real.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Brazalete Medusa", ImageUrl = "images/tattoo-medusa-brazalete.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Dr. Plaga Sombras", ImageUrl = "images/tattoo-dr-plaga-hd.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Geometría Sagrada Esqueleto", ImageUrl = "images/tattoo-geometria-esqueleto-hd.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Lobo y Luna en Bosque", ImageUrl = "images/tattoo-lobo-luna-bosque.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "One Piece • Nico Robin", ImageUrl = "images/tattoo-robin-onepiece.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Lettering Un Día a la Vez", ImageUrl = "images/tattoo-lettering-undia.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Serpientes Blackwork", ImageUrl = "images/tattoo-serpientes-antebrazo.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Ovni & Alien Espacio", ImageUrl = "images/tattoo-ovni-alien-tierra.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Calaveras en Corazón", ImageUrl = "images/tattoo-calaveras-corazon.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Sol & Luna en Pareja", ImageUrl = "images/tattoo-sol-luna-pareja.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Girasol en Hombro", ImageUrl = "images/tattoo-girasol-espalda.jpg", Category = ServiceType.Tattoo },
            new PortfolioItem { Title = "Pocoyó Full Color", ImageUrl = "images/tattoo-pocoyo-color.jpg", Category = ServiceType.Tattoo },

            // Perforaciones Reales de Estudio (18 al 23)
            new PortfolioItem { Title = "Piercing de Ombligo Acero Quirúrgico", ImageUrl = "images/piercing-ombligo-real.jpg", Category = ServiceType.Piercing },
            new PortfolioItem { Title = "Piercing Industrial Oreja", ImageUrl = "images/piercing-industrial-real.jpg", Category = ServiceType.Piercing },
            new PortfolioItem { Title = "Piercing Nostril & Septum Nariz", ImageUrl = "images/piercing-nostril-real.jpg", Category = ServiceType.Piercing },
            new PortfolioItem { Title = "Piercing de Ceja", ImageUrl = "images/piercing-ceja-real.jpg", Category = ServiceType.Piercing },
            new PortfolioItem { Title = "Piercing Tragus & Hélix", ImageUrl = "images/piercing-tragus-real.jpg", Category = ServiceType.Piercing },
            new PortfolioItem { Title = "Piercing Labret Labio", ImageUrl = "images/piercing-labret-real.jpg", Category = ServiceType.Piercing },

            // Smokeshop Real (24 al 34)
            new PortfolioItem { Title = "Pipas de Cristal Pyrex Artesanales", ImageUrl = "images/smokeshop-pipas-cristal.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Blunts Double Platinum Sabores", ImageUrl = "images/blunt-wrap-platinum-sabores.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Papelillos Moon Saborizados", ImageUrl = "images/papelillos-moon-saborizados.png", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Papel Celulosa Hornet Transparente", ImageUrl = "images/papel-celulosa-hornet.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Pipas Artesanales de Tagua a Color", ImageUrl = "images/pipas-artesanales-tagua-color.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Pipas de Tagua Natural Marfil Vegetal", ImageUrl = "images/pipas-tagua-marfil-vegetal.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Pipas Artesanales Cerámica y Bambú", ImageUrl = "images/pipas-ceramica-bambu-color.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Papelillos GIZEH Pure Extra Fine", ImageUrl = "images/papelillos-gizeh-pure.webp", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Papeles RAW, OCB & Juicy Jay's", ImageUrl = "images/papeles-raw-juicy-bambu.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Smoking Slim & Colección $100", ImageUrl = "images/papelillos-smoking-billete-coleccion.jpg", Category = ServiceType.SmokeShop },
            new PortfolioItem { Title = "Blunts y Papelillos de Sabores", ImageUrl = "images/smokeshop-blunts-papelillos.jpg", Category = ServiceType.SmokeShop }
        };

        var countPortfolio = await context.PortfolioItems.CountAsync();
        var maxPortfolioId = await context.PortfolioItems.MaxAsync(p => (int?)p.Id) ?? 0;

        // Si la cantidad de items no coincide con la lista esperada:
        if (countPortfolio != initialPortfolio.Count || maxPortfolioId != initialPortfolio.Count)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"PortfolioItems\" RESTART IDENTITY;");
            }
            catch
            {
                context.PortfolioItems.RemoveRange(context.PortfolioItems);
                await context.SaveChangesAsync();
                try
                {
                    await context.Database.ExecuteSqlRawAsync("ALTER SEQUENCE \"PortfolioItems_Id_seq\" RESTART WITH 1;");
                }
                catch { }
            }

            context.PortfolioItems.AddRange(initialPortfolio);
            await context.SaveChangesAsync();
        }

        // 3. Tienda limpia a petición del usuario (los productos se crearán manualmente con Franki desde el panel de administración)
        // No sembramos productos predeterminados para que Franki los suba con su propio inventario y precios reales.
        if (await context.Products.AnyAsync())
        {
            var hasOrderItems = await context.OrderItems.AnyAsync();
            if (!hasOrderItems)
            {
                context.Products.RemoveRange(context.Products);
                await context.SaveChangesAsync();
            }
        }
    }
}
