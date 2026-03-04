using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Enums;
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

            // Asegurar que la base de datos est� creada
            await context.Database.MigrateAsync();

            // Crear roles
            await SeedRolesAsync(roleManager);

            // Crear usuarios
            var users = await SeedUsersAsync(userManager);

            // Crear categor�as
            var categories = await SeedCategoriesAsync(context);

            // Crear productos
            var products = await SeedProductsAsync(context, categories);

            // Crear pedidos
            await SeedOrdersAsync(context, users, products);

            await context.SaveChangesAsync();
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            string[] roles = { Roles.Admin, Roles.Vendedor, Roles.Comprador };

            foreach (var roleName in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }
        }

        private static async Task<Dictionary<string, ApplicationUser>> SeedUsersAsync(UserManager<ApplicationUser> userManager)
        {
            var users = new Dictionary<string, ApplicationUser>();

            // 1 Admin
            var admin = await CreateUserIfNotExistsAsync(userManager, 
                "admin@admin.com", 
                "Administrador del Sistema", 
                "Admin123!", 
                Roles.Admin,
                "Calle Principal 123, Ciudad");

            if (admin != null) users.Add("admin", admin);

            // 3 Vendedores
            var vendedores = new[]
            {
                ("vendedor1@tienda.com", "Carlos Mart�nez", "Av. Comercio 456, Local 5"),
                ("vendedor2@tienda.com", "Ana Garc�a", "Plaza Central 789, Piso 2"),
                ("vendedor3@tienda.com", "Luis Rodr�guez", "Calle del Mercado 321, Oficina 10")
            };

            for (int i = 0; i < vendedores.Length; i++)
            {
                var v = vendedores[i];
                var vendedor = await CreateUserIfNotExistsAsync(userManager, v.Item1, v.Item2, "Vendedor123!", Roles.Vendedor, v.Item3);
                if (vendedor != null) users.Add($"vendedor{i + 1}", vendedor);
            }

            // 5 Compradores
            var compradores = new[]
            {
                ("comprador1@email.com", "Mar�a L�pez", "Residencial Los Pinos 123"),
                ("comprador2@email.com", "Juan P�rez", "Urbanizaci�n El Rosal 456"),
                ("comprador3@email.com", "Patricia S�nchez", "Conjunto Habitacional Vista Hermosa 789"),
                ("comprador4@email.com", "Roberto Gonz�lez", "Barrio San Jos� 234"),
                ("comprador5@email.com", "Laura Fern�ndez", "Colonia Primavera 567")
            };

            for (int i = 0; i < compradores.Length; i++)
            {
                var c = compradores[i];
                var comprador = await CreateUserIfNotExistsAsync(userManager, c.Item1, c.Item2, "Comprador123!", Roles.Comprador, c.Item3);
                if (comprador != null) users.Add($"comprador{i + 1}", comprador);
            }

            return users;
        }

        private static async Task<ApplicationUser?> CreateUserIfNotExistsAsync(
            UserManager<ApplicationUser> userManager,
            string email,
            string fullName,
            string password,
            string role,
            string? shippingAddress = null)
        {
            if (await userManager.FindByEmailAsync(email) != null)
            {
                return await userManager.FindByEmailAsync(email);
            }

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true,
                IsActive = true,
                ShippingAddress = shippingAddress,
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(30, 90))
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, role);
                return user;
            }

            return null;
        }

        private static async Task<List<Category>> SeedCategoriesAsync(ApplicationDbContext context)
        {
            if (await context.Categories.AnyAsync())
            {
                return await context.Categories.ToListAsync();
            }

            var categories = new List<Category>
            {
                new Category { Name = "Electr�nica", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-60) },
                new Category { Name = "Ropa y Moda", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-55) },
                new Category { Name = "Hogar y Cocina", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-50) },
                new Category { Name = "Deportes", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-45) },
                new Category { Name = "Libros", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-40) },
                new Category { Name = "Juguetes", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-35) },
                new Category { Name = "Belleza y Salud", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) }
            };

            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
            
            return categories;
        }

        private static async Task<List<Product>> SeedProductsAsync(ApplicationDbContext context, List<Category> categories)
        {
            if (await context.Products.AnyAsync())
            {
                return await context.Products.ToListAsync();
            }

            var products = new List<Product>();
            var now = DateTime.UtcNow;

            // Electr�nica (6 productos)
            var electronicsId = categories.First(c => c.Name == "Electr�nica").Id;
            products.AddRange(new[]
            {
                new Product { Name = "Laptop HP 15", Description = "Laptop HP con procesador Intel Core i5, 8GB RAM, 256GB SSD", Price = 799.99m, Stock = 15, CategoryId = electronicsId, IsActive = true, CreatedAt = now.AddDays(-50), UpdatedAt = now.AddDays(-50) },
                new Product { Name = "Mouse Logitech MX Master 3", Description = "Mouse inal�mbrico ergon�mico de alta precisi�n", Price = 99.99m, Stock = 30, CategoryId = electronicsId, IsActive = true, CreatedAt = now.AddDays(-48), UpdatedAt = now.AddDays(-48) },
                new Product { Name = "Teclado Mec�nico Razer", Description = "Teclado mec�nico RGB con switches Cherry MX", Price = 149.99m, Stock = 20, CategoryId = electronicsId, IsActive = true, CreatedAt = now.AddDays(-46), UpdatedAt = now.AddDays(-46) },
                new Product { Name = "Monitor Samsung 27\"", Description = "Monitor Full HD 1920x1080, 75Hz, panel IPS", Price = 249.99m, Stock = 12, CategoryId = electronicsId, IsActive = true, CreatedAt = now.AddDays(-44), UpdatedAt = now.AddDays(-44) },
                new Product { Name = "Auriculares Sony WH-1000XM4", Description = "Auriculares inal�mbricos con cancelaci�n de ruido", Price = 349.99m, Stock = 8, CategoryId = electronicsId, IsActive = true, CreatedAt = now.AddDays(-42), UpdatedAt = now.AddDays(-42) },
                new Product { Name = "Webcam Logitech C920", Description = "Webcam Full HD 1080p para streaming", Price = 79.99m, Stock = 25, CategoryId = electronicsId, IsActive = true, CreatedAt = now.AddDays(-40), UpdatedAt = now.AddDays(-40) }
            });

            // Ropa y Moda (4 productos)
            var ropaId = categories.First(c => c.Name == "Ropa y Moda").Id;
            products.AddRange(new[]
            {
                new Product { Name = "Camiseta Nike Deportiva", Description = "Camiseta de algod�n 100% disponible en varios colores", Price = 29.99m, Stock = 50, CategoryId = ropaId, IsActive = true, CreatedAt = now.AddDays(-38), UpdatedAt = now.AddDays(-38) },
                new Product { Name = "Jeans Levi's 501", Description = "Jeans cl�sicos de corte recto, tela denim premium", Price = 89.99m, Stock = 35, CategoryId = ropaId, IsActive = true, CreatedAt = now.AddDays(-36), UpdatedAt = now.AddDays(-36) },
                new Product { Name = "Zapatillas Adidas Running", Description = "Zapatillas deportivas con tecnolog�a Boost", Price = 129.99m, Stock = 28, CategoryId = ropaId, IsActive = true, CreatedAt = now.AddDays(-34), UpdatedAt = now.AddDays(-34) },
                new Product { Name = "Chaqueta North Face", Description = "Chaqueta impermeable para exteriores", Price = 199.99m, Stock = 18, CategoryId = ropaId, IsActive = true, CreatedAt = now.AddDays(-32), UpdatedAt = now.AddDays(-32) }
            });

            // Hogar y Cocina (4 productos)
            var hogarId = categories.First(c => c.Name == "Hogar y Cocina").Id;
            products.AddRange(new[]
            {
                new Product { Name = "Cafetera Nespresso", Description = "Cafetera de c�psulas con sistema de extracci�n de 19 bares", Price = 149.99m, Stock = 22, CategoryId = hogarId, IsActive = true, CreatedAt = now.AddDays(-30), UpdatedAt = now.AddDays(-30) },
                new Product { Name = "Licuadora Oster", Description = "Licuadora de 1200W con jarra de vidrio de 2L", Price = 79.99m, Stock = 30, CategoryId = hogarId, IsActive = true, CreatedAt = now.AddDays(-28), UpdatedAt = now.AddDays(-28) },
                new Product { Name = "Set de Ollas Tramontina", Description = "Set de 5 ollas de acero inoxidable", Price = 199.99m, Stock = 15, CategoryId = hogarId, IsActive = true, CreatedAt = now.AddDays(-26), UpdatedAt = now.AddDays(-26) },
                new Product { Name = "Aspiradora Robot Roomba", Description = "Aspiradora robot con mapeo inteligente y WiFi", Price = 399.99m, Stock = 10, CategoryId = hogarId, IsActive = true, CreatedAt = now.AddDays(-24), UpdatedAt = now.AddDays(-24) }
            });

            // Deportes (3 productos)
            var deportesId = categories.First(c => c.Name == "Deportes").Id;
            products.AddRange(new[]
            {
                new Product { Name = "Bicicleta de Monta�a", Description = "Bicicleta MTB 21 velocidades, frenos de disco", Price = 499.99m, Stock = 8, CategoryId = deportesId, IsActive = true, CreatedAt = now.AddDays(-22), UpdatedAt = now.AddDays(-22) },
                new Product { Name = "Mancuernas Ajustables 20kg", Description = "Par de mancuernas ajustables de 5 a 20kg", Price = 149.99m, Stock = 20, CategoryId = deportesId, IsActive = true, CreatedAt = now.AddDays(-20), UpdatedAt = now.AddDays(-20) },
                new Product { Name = "Colchoneta de Yoga", Description = "Colchoneta antideslizante con bolsa de transporte", Price = 39.99m, Stock = 45, CategoryId = deportesId, IsActive = true, CreatedAt = now.AddDays(-18), UpdatedAt = now.AddDays(-18) }
            });

            // Libros (3 productos)
            var librosId = categories.First(c => c.Name == "Libros").Id;
            products.AddRange(new[]
            {
                new Product { Name = "Clean Code - Robert Martin", Description = "Gu�a pr�ctica de desarrollo de software �gil", Price = 49.99m, Stock = 25, CategoryId = librosId, IsActive = true, CreatedAt = now.AddDays(-16), UpdatedAt = now.AddDays(-16) },
                new Product { Name = "El Principito", Description = "Cl�sico de la literatura universal, edici�n ilustrada", Price = 19.99m, Stock = 40, CategoryId = librosId, IsActive = true, CreatedAt = now.AddDays(-14), UpdatedAt = now.AddDays(-14) },
                new Product { Name = "Cien A�os de Soledad", Description = "Obra maestra de Gabriel Garc�a M�rquez", Price = 29.99m, Stock = 35, CategoryId = librosId, IsActive = true, CreatedAt = now.AddDays(-12), UpdatedAt = now.AddDays(-12) }
            });

            // Juguetes (2 productos)
            var juguetesId = categories.First(c => c.Name == "Juguetes").Id;
            products.AddRange(new[]
            {
                new Product { Name = "LEGO Star Wars Millennium Falcon", Description = "Set de construcci�n LEGO de 1351 piezas", Price = 159.99m, Stock = 12, CategoryId = juguetesId, IsActive = true, CreatedAt = now.AddDays(-10), UpdatedAt = now.AddDays(-10) },
                new Product { Name = "Mu�eca Barbie Dreamhouse", Description = "Casa de mu�ecas con 8 habitaciones y accesorios", Price = 199.99m, Stock = 10, CategoryId = juguetesId, IsActive = true, CreatedAt = now.AddDays(-8), UpdatedAt = now.AddDays(-8) }
            });

            // Belleza y Salud (3 productos)
            var bellezaId = categories.First(c => c.Name == "Belleza y Salud").Id;
            products.AddRange(new[]
            {
                new Product { Name = "Perfume Chanel No. 5", Description = "Eau de Parfum 100ml, fragancia cl�sica", Price = 149.99m, Stock = 18, CategoryId = bellezaId, IsActive = true, CreatedAt = now.AddDays(-6), UpdatedAt = now.AddDays(-6) },
                new Product { Name = "Kit de Cuidado Facial Neutrogena", Description = "Set completo de limpieza e hidrataci�n facial", Price = 59.99m, Stock = 30, CategoryId = bellezaId, IsActive = true, CreatedAt = now.AddDays(-4), UpdatedAt = now.AddDays(-4) },
                new Product { Name = "Cepillo El�ctrico Oral-B", Description = "Cepillo dental el�ctrico recargable con temporizador", Price = 89.99m, Stock = 22, CategoryId = bellezaId, IsActive = true, CreatedAt = now.AddDays(-2), UpdatedAt = now.AddDays(-2) }
            });

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();

            return products;
        }

        private static async Task SeedOrdersAsync(ApplicationDbContext context, Dictionary<string, ApplicationUser> users, List<Product> products)
        {
            if (await context.Orders.AnyAsync())
            {
                return;
            }

            var compradores = users.Where(u => u.Key.StartsWith("comprador")).Select(u => u.Value).ToList();
            if (!compradores.Any()) return;

            var orders = new List<Order>();
            var orderItems = new List<OrderItem>();
            var now = DateTime.UtcNow;
            var statuses = new[] { OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Shipped, OrderStatus.Delivered };

            // Crear 12 pedidos variados
            for (int i = 0; i < 12; i++)
            {
                var comprador = compradores[i % compradores.Count];
                var orderDate = now.AddDays(-Random.Shared.Next(1, 30));
                
                // Seleccionar 1-4 productos aleatorios para cada pedido
                var itemCount = Random.Shared.Next(1, 5);
                var selectedProducts = products.OrderBy(x => Random.Shared.Next()).Take(itemCount).ToList();
                
                decimal subtotal = 0;
                var items = new List<OrderItem>();

                foreach (var product in selectedProducts)
                {
                    var quantity = Random.Shared.Next(1, 4);
                    var lineTotal = product.Price * quantity;
                    subtotal += lineTotal;

                    items.Add(new OrderItem
                    {
                        ProductId = product.Id,
                        ProductNameSnapshot = product.Name,
                        UnitPriceSnapshot = product.Price,
                        Quantity = quantity,
                        LineTotal = lineTotal
                    });
                }

                var tax = subtotal * 0.16m; // 16% IVA
                var total = subtotal + tax;

                // Determinar estado basado en la fecha del pedido
                var status = orderDate < now.AddDays(-20) ? OrderStatus.Delivered :
                            orderDate < now.AddDays(-15) ? OrderStatus.Shipped :
                            orderDate < now.AddDays(-10) ? OrderStatus.Confirmed :
                            orderDate < now.AddDays(-5) ? OrderStatus.Paid :
                            OrderStatus.Pending;

                var order = new Order
                {
                    UserId = comprador.Id,
                    Status = status,
                    Subtotal = subtotal,
                    Tax = tax,
                    Total = total,
                    ShippingAddress = comprador.ShippingAddress ?? "Direcci�n no especificada",
                    CreatedAt = orderDate,
                    UpdatedAt = status == OrderStatus.Delivered ? orderDate.AddDays(7) : orderDate,
                    Items = items
                };

                orders.Add(order);
            }

            await context.Orders.AddRangeAsync(orders);
            await context.SaveChangesAsync();
        }
    }
}
