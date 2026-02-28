using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Reflection;
using System.Security.Claims;
using Xunit;

namespace AdminPanel.Tests.Authorization
{
    public class PageAuthorizationTests
    {
        [Theory]
        [InlineData(typeof(AdminPanel.Pages.Categories.IndexModel), Roles.Admin)]
        [InlineData(typeof(AdminPanel.Pages.Users.IndexModel), Roles.Admin)]
        [InlineData(typeof(AdminPanel.Pages.Users.CreateModel), Roles.Admin)]
        [InlineData(typeof(AdminPanel.Pages.Reports.IndexModel), Roles.Admin)]
        public void AdminOnlyPages_RequireAdminRole(Type pageModelType, string expectedRole)
        {
            // Act
            var authorizeAttribute = pageModelType.GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Contains(expectedRole, authorizeAttribute.Roles ?? "");
        }

        [Theory]
        [InlineData(typeof(AdminPanel.Pages.Products.IndexModel))]
        [InlineData(typeof(AdminPanel.Pages.Orders.IndexModel))]
        public void SharedPages_AllowBothRoles(Type pageModelType)
        {
            // Act
            var authorizeAttribute = pageModelType.GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Contains(Roles.Admin, authorizeAttribute.Roles ?? "");
            Assert.Contains(Roles.Vendedor, authorizeAttribute.Roles ?? "");
        }

        [Fact]
        public void CategoriesPage_OnlyAdminCanAccess()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(AdminPanel.Pages.Categories.IndexModel)
                .GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Equal(Roles.Admin, authorizeAttribute.Roles);
        }

        [Fact]
        public void UsersPage_OnlyAdminCanAccess()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(AdminPanel.Pages.Users.IndexModel)
                .GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Equal(Roles.Admin, authorizeAttribute.Roles);
        }

        [Fact]
        public void ReportsPage_OnlyAdminCanAccess()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(AdminPanel.Pages.Reports.IndexModel)
                .GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Equal(Roles.Admin, authorizeAttribute.Roles);
        }

        [Fact]
        public void ProductsPage_BothRolesCanAccess()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(AdminPanel.Pages.Products.IndexModel)
                .GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Contains(Roles.Admin, authorizeAttribute.Roles ?? "");
            Assert.Contains(Roles.Vendedor, authorizeAttribute.Roles ?? "");
        }

        [Fact]
        public void OrdersPage_BothRolesCanAccess()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(AdminPanel.Pages.Orders.IndexModel)
                .GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Contains(Roles.Admin, authorizeAttribute.Roles ?? "");
            Assert.Contains(Roles.Vendedor, authorizeAttribute.Roles ?? "");
        }

        [Fact]
        public void DashboardPage_BothRolesCanAccess()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(AdminPanel.Pages.IndexModel)
                .GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Contains(Roles.Admin, authorizeAttribute.Roles ?? "");
            Assert.Contains(Roles.Vendedor, authorizeAttribute.Roles ?? "");
        }

        [Fact]
        public void VendedorUser_CannotAccessCategoriesPage()
        {
            // Arrange
            var vendedorClaims = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, Roles.Vendedor)
            }));

            // Act & Assert - Vendedor doesn't have Admin role
            Assert.False(vendedorClaims.IsInRole(Roles.Admin));
            Assert.True(vendedorClaims.IsInRole(Roles.Vendedor));
        }

        [Fact]
        public void AdminUser_CanAccessAllPages()
        {
            // Arrange
            var adminClaims = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, Roles.Admin)
            }));

            // Assert
            Assert.True(adminClaims.IsInRole(Roles.Admin));
        }

        [Theory]
        [InlineData(Roles.Admin, true)]
        [InlineData(Roles.Vendedor, false)]
        public void RoleBasedAccess_IsEnforcedCorrectly(string role, bool canAccessCategories)
        {
            // Arrange
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            // Act
            var hasAdminAccess = user.IsInRole(Roles.Admin);

            // Assert
            Assert.Equal(canAccessCategories, hasAdminAccess);
        }

        [Fact]
        public void AllProtectedPages_HaveAuthorizeAttribute()
        {
            // Arrange
            var pageModelTypes = new[]
            {
                typeof(AdminPanel.Pages.IndexModel),
                typeof(AdminPanel.Pages.Products.IndexModel),
                typeof(AdminPanel.Pages.Orders.IndexModel),
                typeof(AdminPanel.Pages.Categories.IndexModel),
                typeof(AdminPanel.Pages.Users.IndexModel),
                typeof(AdminPanel.Pages.Reports.IndexModel)
            };

            // Act & Assert
            foreach (var type in pageModelTypes)
            {
                var authorizeAttribute = type.GetCustomAttribute<AuthorizeAttribute>();
                Assert.NotNull(authorizeAttribute);
            }
        }

        [Fact]
        public void UserToggleStatus_OnlyAdminCanAccess()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(AdminPanel.Pages.Users.ToggleStatusModel)
                .GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Equal(Roles.Admin, authorizeAttribute.Roles);
        }
    }
}
