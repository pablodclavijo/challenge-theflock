using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace AdminPanel.Tests.Data
{
    public class DbInitializerTests
    {
        [Fact]
        public void Roles_AreCorrectlyDefinedInConstants()
        {
            // Assert
            Assert.Equal("Admin", Roles.Admin);
            Assert.Equal("Vendedor", Roles.Vendedor);
        }

        [Fact]
        public void Category_HasDefaultIsActiveValue()
        {
            // Arrange & Act
            var category = new Category { Name = "Test" };

            // Assert
            Assert.True(category.IsActive);
        }

        [Fact]
        public void Category_HasDefaultCreatedAtValue()
        {
            // Arrange & Act
            var category = new Category { Name = "Test" };

            // Assert
            Assert.NotEqual(default(DateTime), category.CreatedAt);
            Assert.True(category.CreatedAt <= DateTime.UtcNow);
        }

        [Fact]
        public void ApplicationUser_HasDefaultIsActiveValue()
        {
            // Arrange & Act
            var user = new ApplicationUser
            {
                Email = "test@test.com",
                FullName = "Test User"
            };

            // Assert
            Assert.True(user.IsActive);
        }

        [Fact]
        public void ApplicationUser_HasDefaultCreatedAtValue()
        {
            // Arrange & Act
            var user = new ApplicationUser
            {
                Email = "test@test.com",
                FullName = "Test User"
            };

            // Assert
            Assert.NotEqual(default(DateTime), user.CreatedAt);
            Assert.True(user.CreatedAt <= DateTime.UtcNow);
        }

        [Fact]
        public void ApplicationUser_HasEmptyCollectionsByDefault()
        {
            // Arrange & Act
            var user = new ApplicationUser
            {
                Email = "test@test.com",
                FullName = "Test User"
            };

            // Assert
            Assert.NotNull(user.Orders);
            Assert.NotNull(user.CartItems);
            Assert.Empty(user.Orders);
            Assert.Empty(user.CartItems);
        }

        [Fact]
        public void Category_HasEmptyProductsCollectionByDefault()
        {
            // Arrange & Act
            var category = new Category { Name = "Test" };

            // Assert
            Assert.NotNull(category.Products);
            Assert.Empty(category.Products);
        }

        [Fact]
        public void DbInitializer_SeedAsync_RequiresServiceProvider()
        {
            // Assert - Method signature verification
            var method = typeof(DbInitializer).GetMethod("SeedAsync");
            
            Assert.NotNull(method);
            Assert.True(method!.IsStatic);
            Assert.Equal(typeof(Task), method.ReturnType);
            
            var parameters = method.GetParameters();
            Assert.Single(parameters);
            Assert.Equal(typeof(IServiceProvider), parameters[0].ParameterType);
        }
    }
}
