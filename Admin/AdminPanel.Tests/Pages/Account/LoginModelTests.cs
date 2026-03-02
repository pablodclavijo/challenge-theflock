using AdminPanel.Constants;
using AdminPanel.Models;
using AdminPanel.Pages.Account;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Moq;
using Xunit;

namespace AdminPanel.Tests.Pages.Account
{
    public class LoginModelTests
    {
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<SignInManager<ApplicationUser>> _mockSignInManager;
        private readonly LoginModel _loginModel;

        public LoginModelTests()
        {
            _mockUserManager = MockUserManager();
            _mockSignInManager = MockSignInManager(_mockUserManager);
            _loginModel = new LoginModel(_mockSignInManager.Object, _mockUserManager.Object);
            SetupPageContext(_loginModel);
        }

        #region Helper Methods

        private static Mock<UserManager<ApplicationUser>> MockUserManager()
        {
            var store = new Mock<IUserStore<ApplicationUser>>();
            return new Mock<UserManager<ApplicationUser>>(
                store.Object, null, null, null, null, null, null, null, null);
        }

        private static Mock<SignInManager<ApplicationUser>> MockSignInManager(
            Mock<UserManager<ApplicationUser>> userManager)
        {
            var contextAccessor = new Mock<IHttpContextAccessor>();
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
            
            return new Mock<SignInManager<ApplicationUser>>(
                userManager.Object,
                contextAccessor.Object,
                claimsFactory.Object,
                null, null, null, null);
        }

        private void SetupPageContext(PageModel pageModel)
        {
            var httpContext = new DefaultHttpContext();
            var modelState = new ModelStateDictionary();
            var actionContext = new ActionContext(httpContext, new Microsoft.AspNetCore.Routing.RouteData(), new PageActionDescriptor(), modelState);
            var modelMetadataProvider = new EmptyModelMetadataProvider();
            var viewData = new ViewDataDictionary(modelMetadataProvider, modelState);
            var tempData = new TempDataDictionary(httpContext, Mock.Of<ITempDataProvider>());
            var pageContext = new PageContext(actionContext)
            {
                ViewData = viewData
            };
            pageModel.PageContext = pageContext;
            pageModel.TempData = tempData;
            pageModel.Url = new UrlHelper(actionContext);
            pageModel.MetadataProvider = modelMetadataProvider;

            // Mock authentication
            var authServiceMock = new Mock<IAuthenticationService>();
            authServiceMock
                .Setup(s => s.SignOutAsync(It.IsAny<HttpContext>(), It.IsAny<string>(), It.IsAny<AuthenticationProperties>()))
                .Returns(Task.CompletedTask);

            var serviceProviderMock = new Mock<IServiceProvider>();
            serviceProviderMock
                .Setup(s => s.GetService(typeof(IAuthenticationService)))
                .Returns(authServiceMock.Object);

            httpContext.RequestServices = serviceProviderMock.Object;
        }

        private ApplicationUser CreateTestUser(string email, string fullName, bool isActive = true)
        {
            return new ApplicationUser
            {
                Id = Guid.NewGuid().ToString(),
                UserName = email,
                Email = email,
                FullName = fullName,
                IsActive = isActive,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
        }

        #endregion

        #region Login Success Tests

        [Fact]
        public async Task OnPostAsync_WithValidAdminCredentials_SucceedsLogin()
        {
            // Arrange
            var admin = CreateTestUser("admin@admin.com", "Admin User");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "admin@admin.com",
                Password = "Admin123!",
                RememberMe = false
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("admin@admin.com"))
                .ReturnsAsync(admin);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(admin))
                .ReturnsAsync(new List<string> { Roles.Admin });

            _mockSignInManager
                .Setup(m => m.PasswordSignInAsync("admin@admin.com", "Admin123!", false, true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<LocalRedirectResult>(result);
            _mockSignInManager.Verify(m => m.PasswordSignInAsync("admin@admin.com", "Admin123!", false, true), Times.Once);
        }

        [Fact]
        public async Task OnPostAsync_WithValidVendedorCredentials_SucceedsLogin()
        {
            // Arrange
            var vendedor = CreateTestUser("vendedor@tienda.com", "Vendedor User");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "vendedor@tienda.com",
                Password = "Vendedor123!",
                RememberMe = true
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("vendedor@tienda.com"))
                .ReturnsAsync(vendedor);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(vendedor))
                .ReturnsAsync(new List<string> { Roles.Vendedor });

            _mockSignInManager
                .Setup(m => m.PasswordSignInAsync("vendedor@tienda.com", "Vendedor123!", true, true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<LocalRedirectResult>(result);
            _mockSignInManager.Verify(m => m.PasswordSignInAsync("vendedor@tienda.com", "Vendedor123!", true, true), Times.Once);
        }

        #endregion

        #region Buyer (Comprador) Blocked Tests

        [Fact]
        public async Task OnPostAsync_WithCompradorRole_ReturnsErrorAndBlocksAccess()
        {
            // Arrange
            var comprador = CreateTestUser("comprador@email.com", "Comprador User");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "comprador@email.com",
                Password = "Comprador123!",
                RememberMe = false
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("comprador@email.com"))
                .ReturnsAsync(comprador);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(comprador))
                .ReturnsAsync(new List<string> { Roles.Comprador });

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
            Assert.True(_loginModel.ModelState.ContainsKey(string.Empty));
            
            var errors = _loginModel.ModelState[string.Empty]!.Errors;
            Assert.Single(errors);
            Assert.Contains("compradores no tienen acceso", errors[0].ErrorMessage.ToLower());
            
            // Verify that PasswordSignInAsync was NEVER called
            _mockSignInManager.Verify(
                m => m.PasswordSignInAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()), 
                Times.Never);
        }

        [Fact]
        public async Task OnPostAsync_WithCompradorRole_ShowsSpecificErrorMessage()
        {
            // Arrange
            var comprador = CreateTestUser("comprador1@email.com", "María López");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "comprador1@email.com",
                Password = "Comprador123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("comprador1@email.com"))
                .ReturnsAsync(comprador);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(comprador))
                .ReturnsAsync(new List<string> { Roles.Comprador });

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            var pageResult = Assert.IsType<PageResult>(result);
            var errorMessage = _loginModel.ModelState[string.Empty]!.Errors[0].ErrorMessage;
            Assert.Equal("Los compradores no tienen acceso al panel de administración. Por favor, use la aplicación de tienda.", errorMessage);
        }

        [Fact]
        public async Task OnPostAsync_CompradorWithMultipleRoles_StillBlocksAccess()
        {
            // Arrange - Edge case: user has both Comprador and another role
            var user = CreateTestUser("mixed@email.com", "Mixed Role User");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "mixed@email.com",
                Password = "Password123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("mixed@email.com"))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { Roles.Comprador, Roles.Vendedor }); // Has both roles

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
            
            // Should still be blocked because Comprador role is present
            var errorMessage = _loginModel.ModelState[string.Empty]!.Errors[0].ErrorMessage;
            Assert.Contains("compradores no tienen acceso", errorMessage.ToLower());
            
            _mockSignInManager.Verify(
                m => m.PasswordSignInAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()), 
                Times.Never);
        }

        #endregion

        #region Invalid Credentials Tests

        [Fact]
        public async Task OnPostAsync_WithInvalidEmail_ReturnsErrorMessage()
        {
            // Arrange
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "nonexistent@email.com",
                Password = "SomePassword123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("nonexistent@email.com"))
                .ReturnsAsync((ApplicationUser?)null);

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
            
            var errorMessage = _loginModel.ModelState[string.Empty]!.Errors[0].ErrorMessage;
            Assert.Equal("Email o contraseña incorrectos.", errorMessage);
            
            _mockSignInManager.Verify(
                m => m.PasswordSignInAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()), 
                Times.Never);
        }

        [Fact]
        public async Task OnPostAsync_WithInvalidPassword_ReturnsErrorMessage()
        {
            // Arrange
            var user = CreateTestUser("valid@email.com", "Valid User");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "valid@email.com",
                Password = "WrongPassword123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("valid@email.com"))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { Roles.Admin });

            _mockSignInManager
                .Setup(m => m.PasswordSignInAsync("valid@email.com", "WrongPassword123!", false, true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
            Assert.Equal("Email o contraseña incorrectos.", _loginModel.ModelState[string.Empty]!.Errors[0].ErrorMessage);
        }

        #endregion

        #region Inactive User Tests

        [Fact]
        public async Task OnPostAsync_WithInactiveUser_ReturnsErrorMessage()
        {
            // Arrange
            var inactiveUser = CreateTestUser("inactive@email.com", "Inactive User", isActive: false);
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "inactive@email.com",
                Password = "Password123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("inactive@email.com"))
                .ReturnsAsync(inactiveUser);

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
            
            var errorMessage = _loginModel.ModelState[string.Empty]!.Errors[0].ErrorMessage;
            Assert.Equal("Su cuenta ha sido desactivada. Contacte al administrador.", errorMessage);
            
            _mockSignInManager.Verify(
                m => m.PasswordSignInAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()), 
                Times.Never);
        }

        [Fact]
        public async Task OnPostAsync_InactiveComprador_ShowsInactiveMessageNotCompradorMessage()
        {
            // Arrange - Border case: inactive buyer should see "inactive" message, not "comprador" message
            var inactiveComprador = CreateTestUser("inactive.comprador@email.com", "Inactive Buyer", isActive: false);
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "inactive.comprador@email.com",
                Password = "Password123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("inactive.comprador@email.com"))
                .ReturnsAsync(inactiveComprador);

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            var errorMessage = _loginModel.ModelState[string.Empty]!.Errors[0].ErrorMessage;
            Assert.Contains("desactivada", errorMessage.ToLower());
            Assert.DoesNotContain("compradores", errorMessage.ToLower());
        }

        #endregion

        #region Lockout Tests

        [Fact]
        public async Task OnPostAsync_WithLockedOutUser_ReturnsLockoutMessage()
        {
            // Arrange
            var user = CreateTestUser("locked@email.com", "Locked User");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "locked@email.com",
                Password = "Password123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("locked@email.com"))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { Roles.Admin });

            _mockSignInManager
                .Setup(m => m.PasswordSignInAsync("locked@email.com", "Password123!", false, true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.LockedOut);

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
            Assert.Contains("bloqueada temporalmente", _loginModel.ModelState[string.Empty]!.Errors[0].ErrorMessage.ToLower());
        }

        #endregion

        #region ModelState Validation Tests

        [Fact]
        public async Task OnPostAsync_WithEmptyEmail_ReturnsValidationError()
        {
            // Arrange
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "",
                Password = "Password123!"
            };
            _loginModel.ModelState.AddModelError("Input.Email", "El email es requerido");

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
        }

        [Fact]
        public async Task OnPostAsync_WithEmptyPassword_ReturnsValidationError()
        {
            // Arrange
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "test@email.com",
                Password = ""
            };
            _loginModel.ModelState.AddModelError("Input.Password", "La contraseña es requerida");

            // Act
            var result = await _loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(_loginModel.ModelState.IsValid);
        }

        #endregion

        #region Role Check Order Tests

        [Fact]
        public async Task OnPostAsync_ChecksRoleBeforeAttemptingSignIn()
        {
            // Arrange - This test verifies the order of operations
            var comprador = CreateTestUser("comprador@email.com", "Comprador");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "comprador@email.com",
                Password = "Comprador123!"
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("comprador@email.com"))
                .ReturnsAsync(comprador);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(comprador))
                .ReturnsAsync(new List<string> { Roles.Comprador });

            // Setup sign-in to track if it's called
            var signInCalled = false;
            _mockSignInManager
                .Setup(m => m.PasswordSignInAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
                .Callback(() => signInCalled = true)
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            await _loginModel.OnPostAsync();

            // Assert
            Assert.False(signInCalled, "PasswordSignInAsync should not be called for Comprador role");
            Assert.False(_loginModel.ModelState.IsValid);
        }

        #endregion

        #region Remember Me Tests

        [Fact]
        public async Task OnPostAsync_WithRememberMeTrue_PassesToSignIn()
        {
            // Arrange
            var user = CreateTestUser("user@email.com", "User");
            _loginModel.Input = new LoginModel.InputModel
            {
                Email = "user@email.com",
                Password = "Password123!",
                RememberMe = true
            };

            _mockUserManager
                .Setup(m => m.FindByEmailAsync("user@email.com"))
                .ReturnsAsync(user);

            _mockUserManager
                .Setup(m => m.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { Roles.Admin });

            _mockSignInManager
                .Setup(m => m.PasswordSignInAsync("user@email.com", "Password123!", true, true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            await _loginModel.OnPostAsync();

            // Assert
            _mockSignInManager.Verify(m => m.PasswordSignInAsync("user@email.com", "Password123!", true, true), Times.Once);
        }

        #endregion
    }
}
