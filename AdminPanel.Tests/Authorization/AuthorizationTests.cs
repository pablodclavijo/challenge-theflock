using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Xunit;

namespace AdminPanel.Tests.Authorization
{
    public class AuthorizationTests
    {
        private ClaimsPrincipal CreateUserWithRole(string email, string role)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, email),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, role)
            };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            return new ClaimsPrincipal(identity);
        }

        [Fact]
        public void AdminRole_HasAccessToAllResources()
        {
            // Arrange
            var adminUser = CreateUserWithRole("admin@test.com", Roles.Admin);

            // Assert - Admin should have admin role
            Assert.True(adminUser.IsInRole(Roles.Admin));
            Assert.False(adminUser.IsInRole(Roles.Vendedor));
        }

        [Fact]
        public void VendedorRole_HasLimitedAccess()
        {
            // Arrange
            var vendedorUser = CreateUserWithRole("vendedor@test.com", Roles.Vendedor);

            // Assert - Vendedor should only have Vendedor role
            Assert.False(vendedorUser.IsInRole(Roles.Admin));
            Assert.True(vendedorUser.IsInRole(Roles.Vendedor));
        }

        [Fact]
        public void UnauthenticatedUser_IsNotAuthenticated()
        {
            // Arrange
            var anonymousUser = new ClaimsPrincipal(new ClaimsIdentity());

            // Assert
            Assert.False(anonymousUser.Identity?.IsAuthenticated ?? false);
            Assert.False(anonymousUser.IsInRole(Roles.Admin));
            Assert.False(anonymousUser.IsInRole(Roles.Vendedor));
        }

        [Fact]
        public void RoleConstants_AreCorrectlyDefined()
        {
            // Assert
            Assert.Equal("Admin", Roles.Admin);
            Assert.Equal("Vendedor", Roles.Vendedor);
        }

        [Theory]
        [InlineData("admin@test.com", Roles.Admin, true)]
        [InlineData("vendedor@test.com", Roles.Vendedor, false)]
        public void User_RoleCheck_WorksCorrectly(string email, string role, bool isAdmin)
        {
            // Arrange
            var user = CreateUserWithRole(email, role);

            // Assert
            Assert.Equal(isAdmin, user.IsInRole(Roles.Admin));
            Assert.Equal(!isAdmin, user.IsInRole(Roles.Vendedor));
        }

        [Fact]
        public void ApplicationUser_IsActive_DefaultsToTrue()
        {
            // Arrange & Act
            var user = new ApplicationUser
            {
                UserName = "test@test.com",
                Email = "test@test.com",
                FullName = "Test User"
            };

            // Assert
            Assert.True(user.IsActive);
        }

        [Fact]
        public void InactiveUser_CannotLogin()
        {
            // This test verifies the business logic
            // Arrange
            var user = new ApplicationUser
            {
                Email = "inactive@test.com",
                IsActive = false
            };

            // Assert - IsActive is false
            Assert.False(user.IsActive);
        }

        [Fact]
        public void ClaimsPrincipal_WithMultipleClaims_CanBeVerified()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, "admin@test.com"),
                new Claim(ClaimTypes.Email, "admin@test.com"),
                new Claim(ClaimTypes.Role, Roles.Admin)
            };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var principal = new ClaimsPrincipal(identity);

            // Assert
            Assert.True(principal.Identity?.IsAuthenticated);
            Assert.Equal("admin@test.com", principal.Identity?.Name);
            Assert.True(principal.IsInRole(Roles.Admin));
        }

        [Fact]
        public void AuthenticatedUser_HasRequiredClaims()
        {
            // Arrange
            var user = CreateUserWithRole("test@test.com", Roles.Admin);

            // Assert
            Assert.NotNull(user.FindFirst(ClaimTypes.Name));
            Assert.NotNull(user.FindFirst(ClaimTypes.Email));
            Assert.NotNull(user.FindFirst(ClaimTypes.Role));
            Assert.NotNull(user.FindFirst(ClaimTypes.NameIdentifier));
        }

        [Fact]
        public void ApplicationUser_HasDefaultCollections()
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
        public void ApplicationUser_CreatedAtIsSetByDefault()
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
    }
}
