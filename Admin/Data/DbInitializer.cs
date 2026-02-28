using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Asegurar que la base de datos esté creada
            await context.Database.MigrateAsync();

            // Crear roles
            await SeedRolesAsync(roleManager);

            // Crear usuarios por defecto
            await SeedUsersAsync(userManager);

            // Crear categorías de ejemplo
            await SeedCategoriesAsync(context);

            await context.SaveChangesAsync();
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            if (!await roleManager.RoleExistsAsync(Roles.Admin))
            {
                await roleManager.CreateAsync(new IdentityRole(Roles.Admin));
            }

            if (!await roleManager.RoleExistsAsync(Roles.Vendedor))
            {
                await roleManager.CreateAsync(new IdentityRole(Roles.Vendedor));
            }
        }

        private static async Task SeedUsersAsync(UserManager<ApplicationUser> userManager)
        {
            // Crear Admin por defecto
            if (await userManager.FindByEmailAsync("admin@admin.com") == null)
            {
                var admin = new ApplicationUser
                {
                    UserName = "admin@admin.com",
                    Email = "admin@admin.com",
                    FullName = "Administrador",
                    EmailConfirmed = true,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(admin, "Admin123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, Roles.Admin);
                }
            }

            // Crear Vendedor por defecto
            if (await userManager.FindByEmailAsync("vendedor@vendedor.com") == null)
            {
                var vendedor = new ApplicationUser
                {
                    UserName = "vendedor@vendedor.com",
                    Email = "vendedor@vendedor.com",
                    FullName = "Vendedor Demo",
                    EmailConfirmed = true,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(vendedor, "Vendedor123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(vendedor, Roles.Vendedor);
                }
            }
        }

        private static async Task SeedCategoriesAsync(ApplicationDbContext context)
        {
            if (!await context.Categories.AnyAsync())
            {
                var categories = new[]
                {
                    new Category { Name = "Electrónica" },
                    new Category { Name = "Ropa" },
                    new Category { Name = "Hogar" },
                    new Category { Name = "Deportes" },
                    new Category { Name = "Libros" }
                };

                await context.Categories.AddRangeAsync(categories);
            }
        }
    }
}
