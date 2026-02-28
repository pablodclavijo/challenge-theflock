using AdminPanel.Constants;
using AdminPanel.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using Xunit;

namespace AdminPanel.Tests.Integration
{
    public class AuthenticationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public AuthenticationIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add DbContext using InMemory database
                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("InMemoryDbForTesting");
                    });

                    // Build the service provider
                    var sp = services.BuildServiceProvider();

                    // Create a scope to obtain a reference to the database context
                    using var scope = sp.CreateScope();
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<ApplicationDbContext>();

                    // Ensure the database is created
                    db.Database.EnsureCreated();

                    // Seed the test database
                    try
                    {
                        DbInitializer.SeedAsync(scopedServices.GetRequiredService<IServiceProvider>()).Wait();
                    }
                    catch
                    {
                        // Ignore seeding errors in tests
                    }
                });
            });
        }

        [Theory]
        [InlineData("/Index")]
        [InlineData("/Products/Index")]
        [InlineData("/Orders/Index")]
        [InlineData("/Categories/Index")]
        [InlineData("/Users/Index")]
        [InlineData("/Reports/Index")]
        public async Task ProtectedPages_RedirectToLoginWhenNotAuthenticated(string url)
        {
            // Arrange
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

            // Act
            var response = await client.GetAsync(url);

            // Assert
            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
            Assert.StartsWith("/Account/Login", response.Headers.Location?.OriginalString);
        }

        [Fact]
        public async Task LoginPage_IsAccessibleWithoutAuthentication()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/Account/Login");

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task AccessDeniedPage_IsAccessibleWithoutAuthentication()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/Account/AccessDenied");

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task LoginPage_ContainsLoginForm()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/Account/Login");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Contains("Iniciar Sesión", content);
            Assert.Contains("Email", content);
            Assert.Contains("Contraseña", content);
        }

        [Fact]
        public async Task LoginPage_ShowsCredentialsHint()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/Account/Login");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            Assert.Contains("Admin", content);
            Assert.Contains("Vendedor", content);
            Assert.Contains("admin@admin.com", content);
            Assert.Contains("vendedor@vendedor.com", content);
        }

        [Fact]
        public async Task UnauthenticatedRequest_To_Dashboard_Redirects()
        {
            // Arrange
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

            // Act
            var response = await client.GetAsync("/");

            // Assert
            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        }

        [Theory]
        [InlineData("/Categories/Create")]
        [InlineData("/Users/Create")]
        public async Task AdminOnlyPages_RedirectToLogin(string url)
        {
            // Arrange
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

            // Act
            var response = await client.GetAsync(url);

            // Assert
            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
            Assert.Contains("/Account/Login", response.Headers.Location?.OriginalString);
        }

        [Fact]
        public async Task AccessDeniedPage_ContainsAccessDeniedMessage()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/Account/AccessDenied");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Contains("Acceso Denegado", content);
            Assert.Contains("No tienes permisos", content);
        }

        [Fact]
        public async Task LogoutEndpoint_IsAccessible()
        {
            // Arrange
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

            // Act
            var response = await client.GetAsync("/Account/Logout");

            // Assert
            // Should redirect to login after logout
            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        }
    }
}
