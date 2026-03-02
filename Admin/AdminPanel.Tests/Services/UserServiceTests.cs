using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace AdminPanel.Tests.Services
{
    public class UserServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserService _userService;
        private readonly ServiceProvider _serviceProvider;

        public UserServiceTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

            services.AddLogging();

            services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 3;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            _serviceProvider = services.BuildServiceProvider();
            _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();
            _userManager = _serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            _roleManager = _serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            _userService = new UserService(_userManager);

            SeedDatabase().Wait();
        }

        private async Task SeedDatabase()
        {
            await _roleManager.CreateAsync(new IdentityRole(Roles.Admin));
            await _roleManager.CreateAsync(new IdentityRole(Roles.Vendedor));

            var admin = new ApplicationUser
            {
                Id = "admin123",
                UserName = "admin@test.com",
                Email = "admin@test.com",
                FullName = "Admin User",
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            };
            await _userManager.CreateAsync(admin, "Admin123!");
            await _userManager.AddToRoleAsync(admin, Roles.Admin);

            var seller1 = new ApplicationUser
            {
                Id = "seller123",
                UserName = "seller@test.com",
                Email = "seller@test.com",
                FullName = "Seller User",
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            };
            await _userManager.CreateAsync(seller1, "Seller123!");
            await _userManager.AddToRoleAsync(seller1, Roles.Vendedor);

            var seller2 = new ApplicationUser
            {
                Id = "inactive123",
                UserName = "inactive@test.com",
                Email = "inactive@test.com",
                FullName = "Inactive Seller",
                IsActive = false,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            };
            await _userManager.CreateAsync(seller2, "Inactive123!");
            await _userManager.AddToRoleAsync(seller2, Roles.Vendedor);
        }

        #region GetUserByIdAsync Tests

        [Fact]
        public async Task GetUserByIdAsync_WithValidId_ReturnsUser()
        {
            // Act
            var result = await _userService.GetUserByIdAsync("admin123");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("admin@test.com", result.Email);
            Assert.Equal("Admin User", result.FullName);
            Assert.True(result.IsActive);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Act
            var result = await _userService.GetUserByIdAsync("invalid999");

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region GetAllUsersWithRolesAsync Tests

        [Fact]
        public async Task GetAllUsersWithRolesAsync_ReturnsAllUsersWithRoles()
        {
            // Act
            var result = await _userService.GetAllUsersWithRolesAsync();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.Contains(result, u => u.Email == "admin@test.com" && u.Role == Roles.Admin);
            Assert.Contains(result, u => u.Email == "seller@test.com" && u.Role == Roles.Vendedor);
            Assert.Contains(result, u => u.Email == "inactive@test.com" && !u.IsActive);
        }

        [Fact]
        public async Task GetAllUsersWithRolesAsync_OrdersByCreatedAtDescending()
        {
            // Act
            var result = await _userService.GetAllUsersWithRolesAsync();

            // Assert - Most recent first (inactive seller is newest)
            Assert.Equal("inactive@test.com", result[0].Email);
            Assert.Equal("seller@test.com", result[1].Email);
            Assert.Equal("admin@test.com", result[2].Email);
        }

        [Fact]
        public async Task GetAllUsersWithRolesAsync_IncludesEmailConfirmedStatus()
        {
            // Act
            var result = await _userService.GetAllUsersWithRolesAsync();

            // Assert
            Assert.All(result, u => Assert.True(u.EmailConfirmed));
        }

        #endregion

        #region CreateUserAsync Tests

        [Fact]
        public async Task CreateUserAsync_WithValidData_CreatesUser()
        {
            // Arrange
            var email = "newuser@test.com";
            var fullName = "New User";
            var password = "Password123!";
            var role = Roles.Vendedor;

            // Act
            var result = await _userService.CreateUserAsync(email, fullName, password, role);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(email, result.Email);
            Assert.Equal(email, result.UserName);
            Assert.Equal(fullName, result.FullName);
            Assert.True(result.IsActive);
            Assert.True(result.EmailConfirmed);

            var userInDb = await _userManager.FindByEmailAsync(email);
            Assert.NotNull(userInDb);
            
            var roles = await _userManager.GetRolesAsync(userInDb);
            Assert.Contains(Roles.Vendedor, roles);
        }

        [Fact]
        public async Task CreateUserAsync_WithInactiveFlag_CreatesInactiveUser()
        {
            // Act
            var result = await _userService.CreateUserAsync(
                "inactive@new.com", 
                "Inactive User", 
                "Pass123!", 
                Roles.Vendedor, 
                isActive: false);

            // Assert
            Assert.False(result.IsActive);
        }

        [Fact]
        public async Task CreateUserAsync_WithEmailNotConfirmed_CreatesUnconfirmedUser()
        {
            // Act
            var result = await _userService.CreateUserAsync(
                "unconfirmed@new.com", 
                "Unconfirmed User", 
                "Pass123!", 
                Roles.Vendedor, 
                emailConfirmed: false);

            // Assert
            Assert.False(result.EmailConfirmed);
        }

        [Fact]
        public async Task CreateUserAsync_WithDuplicateEmail_ThrowsException()
        {
            // Arrange - Try to create user with existing email
            var existingEmail = "admin@test.com";

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _userService.CreateUserAsync(existingEmail, "New Admin", "Pass123!", Roles.Admin);
            });

            Assert.Contains("is already taken", exception.Message);
        }

        [Fact]
        public async Task CreateUserAsync_SetsCreatedAtToCurrentTime()
        {
            // Arrange
            var beforeCreate = DateTime.UtcNow;

            // Act
            var result = await _userService.CreateUserAsync("timestamp@test.com", "Test", "Pass123!", Roles.Vendedor);

            // Assert
            Assert.True(result.CreatedAt >= beforeCreate);
            Assert.True(result.CreatedAt <= DateTime.UtcNow.AddSeconds(1));
        }

        [Fact]
        public async Task CreateUserAsync_WithAdminRole_AssignsAdminRole()
        {
            // Act
            var result = await _userService.CreateUserAsync("newadmin@test.com", "New Admin", "Pass123!", Roles.Admin);

            // Assert
            var roles = await _userManager.GetRolesAsync(result);
            Assert.Contains(Roles.Admin, roles);
            Assert.DoesNotContain(Roles.Vendedor, roles);
        }

        #endregion

        #region UpdateUserAsync Tests

        [Fact]
        public async Task UpdateUserAsync_WithValidData_UpdatesUser()
        {
            // Arrange
            var userId = "seller123";

            // Act
            var result = await _userService.UpdateUserAsync(
                userId,
                "newseller@test.com",
                "Updated Seller",
                "123 Main St",
                Roles.Vendedor,
                true,
                true);

            // Assert
            Assert.Equal("newseller@test.com", result.Email);
            Assert.Equal("newseller@test.com", result.UserName);
            Assert.Equal("Updated Seller", result.FullName);
            Assert.Equal("123 Main St", result.ShippingAddress);
            Assert.True(result.IsActive);
            Assert.True(result.EmailConfirmed);
        }

        [Fact]
        public async Task UpdateUserAsync_WithInvalidId_ThrowsException()
        {
            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _userService.UpdateUserAsync("invalid999", "email@test.com", "Name", null, Roles.Vendedor, true, true);
            });

            Assert.Equal("Usuario no encontrado", exception.Message);
        }

        [Fact]
        public async Task UpdateUserAsync_ChangingRole_UpdatesRoleCorrectly()
        {
            // Arrange - Change seller to admin
            var userId = "seller123";

            // Act
            var result = await _userService.UpdateUserAsync(
                userId,
                "seller@test.com",
                "Seller User",
                null,
                Roles.Admin,
                true,
                true);

            // Assert
            var roles = await _userManager.GetRolesAsync(result);
            Assert.Contains(Roles.Admin, roles);
            Assert.DoesNotContain(Roles.Vendedor, roles);
        }

        [Fact]
        public async Task UpdateUserAsync_SameRole_DoesNotChangeRoles()
        {
            // Arrange
            var userId = "seller123";
            var userBefore = await _userManager.FindByIdAsync(userId);
            var rolesBefore = await _userManager.GetRolesAsync(userBefore!);

            // Act
            await _userService.UpdateUserAsync(
                userId,
                "seller@test.com",
                "Seller User",
                null,
                Roles.Vendedor,
                true,
                true);

            // Assert
            var userAfter = await _userManager.FindByIdAsync(userId);
            var rolesAfter = await _userManager.GetRolesAsync(userAfter!);
            Assert.Equal(rolesBefore, rolesAfter);
        }

        [Fact]
        public async Task UpdateUserAsync_ChangingIsActiveToFalse_UpdatesCorrectly()
        {
            // Arrange
            var userId = "seller123";

            // Act
            var result = await _userService.UpdateUserAsync(
                userId,
                "seller@test.com",
                "Seller User",
                null,
                Roles.Vendedor,
                false,
                true);

            // Assert
            Assert.False(result.IsActive);
        }

        [Fact]
        public async Task UpdateUserAsync_ChangingEmailConfirmed_UpdatesCorrectly()
        {
            // Arrange - Create user with unconfirmed email
            await _userService.CreateUserAsync("unconfirmed@test.com", "Test", "Pass123!", Roles.Vendedor, emailConfirmed: false);
            var newUser = await _userManager.FindByEmailAsync("unconfirmed@test.com");

            // Act
            var result = await _userService.UpdateUserAsync(
                newUser!.Id,
                "unconfirmed@test.com",
                "Test",
                null,
                Roles.Vendedor,
                true,
                true);

            // Assert
            Assert.True(result.EmailConfirmed);
        }

        [Fact]
        public async Task UpdateUserAsync_WithNullShippingAddress_HandlesCorrectly()
        {
            // Arrange
            var userId = "seller123";

            // Act
            var result = await _userService.UpdateUserAsync(
                userId,
                "seller@test.com",
                "Seller User",
                null,
                Roles.Vendedor,
                true,
                true);

            // Assert
            Assert.Null(result.ShippingAddress);
        }

        #endregion

        #region UpdateUserPasswordAsync Tests

        [Fact]
        public async Task UpdateUserPasswordAsync_WithValidUser_UpdatesPassword()
        {
            // Arrange
            var userId = "seller123";
            var newPassword = "NewSecurePass123!";

            // Act
            await _userService.UpdateUserPasswordAsync(userId, newPassword);

            // Assert
            var user = await _userManager.FindByIdAsync(userId);
            var passwordCheck = await _userManager.CheckPasswordAsync(user!, newPassword);
            Assert.True(passwordCheck);
        }

        [Fact]
        public async Task UpdateUserPasswordAsync_WithInvalidUser_ThrowsException()
        {
            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _userService.UpdateUserPasswordAsync("invalid999", "NewPass123!");
            });

            Assert.Equal("Usuario no encontrado", exception.Message);
        }

        [Fact]
        public async Task UpdateUserPasswordAsync_OldPasswordNoLongerWorks()
        {
            // Arrange
            var userId = "seller123";
            var oldPassword = "Seller123!";
            var newPassword = "BrandNewPass123!";

            // Act
            await _userService.UpdateUserPasswordAsync(userId, newPassword);

            // Assert
            var user = await _userManager.FindByIdAsync(userId);
            var oldPasswordCheck = await _userManager.CheckPasswordAsync(user!, oldPassword);
            var newPasswordCheck = await _userManager.CheckPasswordAsync(user!, newPassword);
            
            Assert.False(oldPasswordCheck);
            Assert.True(newPasswordCheck);
        }

        #endregion

        #region ToggleUserStatusAsync Tests - Admin Protection

        [Fact]
        public async Task ToggleUserStatusAsync_ForVendedor_TogglesStatusSuccessfully()
        {
            // Arrange
            var userId = "seller123";
            var currentUserId = "admin123";
            var userBefore = await _userManager.FindByIdAsync(userId);
            var isActiveBefore = userBefore!.IsActive;

            // Act
            await _userService.ToggleUserStatusAsync(userId, currentUserId);

            // Assert
            var userAfter = await _userManager.FindByIdAsync(userId);
            Assert.NotEqual(isActiveBefore, userAfter!.IsActive);
        }

        [Fact]
        public async Task ToggleUserStatusAsync_FromInactiveToActive_TogglesCorrectly()
        {
            // Arrange - inactive123 is already inactive
            var userId = "inactive123";
            var currentUserId = "admin123";

            // Act
            await _userService.ToggleUserStatusAsync(userId, currentUserId);

            // Assert
            var user = await _userManager.FindByIdAsync(userId);
            Assert.True(user!.IsActive);
        }

        [Fact]
        public async Task ToggleUserStatusAsync_ForAdmin_ThrowsException()
        {
            // Arrange - Critical business rule: cannot deactivate other admins
            var adminUserId = "admin123";
            var anotherAdminId = "admin999"; // Simulate another admin trying to deactivate

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _userService.ToggleUserStatusAsync(adminUserId, anotherAdminId);
            });

            Assert.Equal("No puedes desactivar la cuenta de otro administrador", exception.Message);
            
            var user = await _userManager.FindByIdAsync(adminUserId);
            Assert.True(user!.IsActive); // Status should remain unchanged
        }

        [Fact]
        public async Task ToggleUserStatusAsync_ForSelf_ThrowsException()
        {
            // Arrange - Critical business rule: cannot deactivate own account
            var userId = "admin123";

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _userService.ToggleUserStatusAsync(userId, userId);
            });

            Assert.Equal("No puedes desactivar tu propia cuenta", exception.Message);
            
            var user = await _userManager.FindByIdAsync(userId);
            Assert.True(user!.IsActive);
        }

        [Fact]
        public async Task ToggleUserStatusAsync_VendedorCannotToggleSelf_ThrowsException()
        {
            // Arrange - Vendedor trying to toggle their own status
            var userId = "seller123";

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _userService.ToggleUserStatusAsync(userId, userId);
            });

            Assert.Equal("No puedes desactivar tu propia cuenta", exception.Message);
        }

        [Fact]
        public async Task ToggleUserStatusAsync_WithInvalidUserId_ThrowsException()
        {
            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _userService.ToggleUserStatusAsync("invalid999", "admin123");
            });

            Assert.Equal("Usuario no encontrado", exception.Message);
        }

        [Fact]
        public async Task ToggleUserStatusAsync_MultipleToggles_WorksCorrectly()
        {
            // Arrange - Create a fresh user to toggle
            var testUser = await _userService.CreateUserAsync("multitest@test.com", "Multi Toggle", "Pass123!", Roles.Vendedor);
            var userId = testUser.Id;
            var currentUserId = "admin123";

            // Act & Assert
            await _userService.ToggleUserStatusAsync(userId, currentUserId); // true -> false
            var afterFirst = await _userManager.FindByIdAsync(userId);
            Assert.False(afterFirst!.IsActive);
            
            await _userService.ToggleUserStatusAsync(userId, currentUserId); // false -> true
            var afterSecond = await _userManager.FindByIdAsync(userId);
            Assert.True(afterSecond!.IsActive);
            
            await _userService.ToggleUserStatusAsync(userId, currentUserId); // true -> false
            var afterThird = await _userManager.FindByIdAsync(userId);
            Assert.False(afterThird!.IsActive);
        }

        #endregion

        #region Edge Cases and Business Rules

        [Fact]
        public async Task CreateUserAsync_WithSpecialCharactersInName_CreatesSuccessfully()
        {
            // Arrange
            var fullName = "José María O'Brien-Smith";

            // Act
            var result = await _userService.CreateUserAsync("jose@test.com", fullName, "Pass123!", Roles.Vendedor);

            // Assert
            Assert.Equal(fullName, result.FullName);
        }

        [Fact]
        public async Task UpdateUserAsync_ChangingFromVendedorToAdmin_UpdatesRoleCorrectly()
        {
            // Arrange
            var userId = "seller123";

            // Act
            await _userService.UpdateUserAsync(
                userId,
                "seller@test.com",
                "Promoted Seller",
                null,
                Roles.Admin,
                true,
                true);

            // Assert
            var user = await _userManager.FindByIdAsync(userId);
            var roles = await _userManager.GetRolesAsync(user!);
            Assert.Contains(Roles.Admin, roles);
            Assert.DoesNotContain(Roles.Vendedor, roles);
        }

        [Fact]
        public async Task UpdateUserAsync_ChangingFromAdminToVendedor_UpdatesRoleCorrectly()
        {
            // Arrange - Create a new admin first
            var newAdmin = await _userService.CreateUserAsync("demote@test.com", "Demotable Admin", "Pass123!", Roles.Admin);

            // Act
            await _userService.UpdateUserAsync(
                newAdmin.Id,
                "demote@test.com",
                "Demoted Admin",
                null,
                Roles.Vendedor,
                true,
                true);

            // Assert
            var user = await _userManager.FindByIdAsync(newAdmin.Id);
            var roles = await _userManager.GetRolesAsync(user!);
            Assert.Contains(Roles.Vendedor, roles);
            Assert.DoesNotContain(Roles.Admin, roles);
        }

        [Fact]
        public async Task CreateUserAsync_MultipleUsers_AllCreatedSuccessfully()
        {
            // Arrange
            var userCount = 5;

            // Act
            for (int i = 1; i <= userCount; i++)
            {
                await _userService.CreateUserAsync(
                    $"user{i}@test.com",
                    $"User {i}",
                    "Pass123!",
                    Roles.Vendedor);
            }

            // Assert
            var allUsers = await _userService.GetAllUsersWithRolesAsync();
            Assert.Equal(8, allUsers.Count); // 3 seeded + 5 new
        }

        [Fact]
        public async Task UpdateUserAsync_PreservesPasswordWhenNotExplicitlyChanged()
        {
            // Arrange
            var userId = "seller123";
            var originalPassword = "Seller123!";

            // Act - Update user details but not password
            await _userService.UpdateUserAsync(
                userId,
                "seller@test.com",
                "Updated Name",
                "New Address",
                Roles.Vendedor,
                true,
                true);

            // Assert - Original password still works
            var user = await _userManager.FindByIdAsync(userId);
            var passwordCheck = await _userManager.CheckPasswordAsync(user!, originalPassword);
            Assert.True(passwordCheck);
        }

        [Fact]
        public async Task ToggleUserStatusAsync_AdminCanToggleMultipleSellers_Successfully()
        {
            // Arrange - Create multiple sellers
            await _userService.CreateUserAsync("seller2@test.com", "Seller 2", "Pass123!", Roles.Vendedor);
            await _userService.CreateUserAsync("seller3@test.com", "Seller 3", "Pass123!", Roles.Vendedor);
            
            var seller2 = await _userManager.FindByEmailAsync("seller2@test.com");
            var seller3 = await _userManager.FindByEmailAsync("seller3@test.com");
            var adminId = "admin123";

            // Act
            await _userService.ToggleUserStatusAsync(seller2!.Id, adminId);
            await _userService.ToggleUserStatusAsync(seller3!.Id, adminId);

            // Assert
            var seller2After = await _userManager.FindByIdAsync(seller2.Id);
            var seller3After = await _userManager.FindByIdAsync(seller3.Id);
            Assert.False(seller2After!.IsActive);
            Assert.False(seller3After!.IsActive);
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
            _serviceProvider.Dispose();
        }
    }
}
