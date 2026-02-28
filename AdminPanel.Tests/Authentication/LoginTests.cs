using AdminPanel.Models;
using AdminPanel.Pages.Account;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Routing;
using Moq;
using Xunit;

namespace AdminPanel.Tests.Authentication
{
    public class LoginTests
    {
        private Mock<UserManager<ApplicationUser>> CreateMockUserManager()
        {
            var store = new Mock<IUserStore<ApplicationUser>>();
            var mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object, null, null, null, null, null, null, null, null);
            return mockUserManager;
        }

        private Mock<SignInManager<ApplicationUser>> CreateMockSignInManager(Mock<UserManager<ApplicationUser>> userManager)
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
            var actionContext = new ActionContext(httpContext, new RouteData(), new PageActionDescriptor(), modelState);
            var modelMetadataProvider = new EmptyModelMetadataProvider();
            var viewData = new ViewDataDictionary(modelMetadataProvider, modelState);
            var tempData = new TempDataDictionary(httpContext, Mock.Of<ITempDataProvider>());

            var mockUrlHelper = new Mock<IUrlHelper>();
            mockUrlHelper.Setup(x => x.Content(It.IsAny<string>())).Returns("~/");

            var pageContext = new PageContext(actionContext)
            {
                ViewData = viewData
            };

            pageModel.PageContext = pageContext;
            pageModel.TempData = tempData;
            pageModel.Url = mockUrlHelper.Object;
        }

        [Fact]
        public async Task OnPostAsync_WithValidCredentials_RedirectsToHome()
        {
            // Arrange
            var mockUserManager = CreateMockUserManager();
            var mockSignInManager = CreateMockSignInManager(mockUserManager);

            var user = new ApplicationUser
            {
                Email = "admin@admin.com",
                UserName = "admin@admin.com",
                IsActive = true
            };

            mockUserManager.Setup(x => x.FindByEmailAsync("admin@admin.com"))
                .ReturnsAsync(user);

            mockSignInManager.Setup(x => x.PasswordSignInAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            var loginModel = new LoginModel(mockSignInManager.Object, mockUserManager.Object)
            {
                Input = new LoginModel.InputModel
                {
                    Email = "admin@admin.com",
                    Password = "Admin123!",
                    RememberMe = false
                }
            };

            SetupPageContext(loginModel);

            // Act
            var result = await loginModel.OnPostAsync();

            // Assert
            Assert.IsType<LocalRedirectResult>(result);
            mockSignInManager.Verify(x => x.PasswordSignInAsync(
                "admin@admin.com",
                "Admin123!",
                false,
                true), Times.Once);
        }

        [Fact]
        public async Task OnPostAsync_WithInvalidEmail_ReturnsPageWithError()
        {
            // Arrange
            var mockUserManager = CreateMockUserManager();
            var mockSignInManager = CreateMockSignInManager(mockUserManager);

            mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser)null!);

            var loginModel = new LoginModel(mockSignInManager.Object, mockUserManager.Object)
            {
                Input = new LoginModel.InputModel
                {
                    Email = "invalid@test.com",
                    Password = "Test123!",
                    RememberMe = false
                }
            };

            SetupPageContext(loginModel);

            // Act
            var result = await loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(loginModel.ModelState.IsValid);
        }

        [Fact]
        public async Task OnPostAsync_WithInactiveUser_ReturnsPageWithError()
        {
            // Arrange
            var mockUserManager = CreateMockUserManager();
            var mockSignInManager = CreateMockSignInManager(mockUserManager);

            var inactiveUser = new ApplicationUser
            {
                Email = "inactive@test.com",
                UserName = "inactive@test.com",
                IsActive = false
            };

            mockUserManager.Setup(x => x.FindByEmailAsync("inactive@test.com"))
                .ReturnsAsync(inactiveUser);

            var loginModel = new LoginModel(mockSignInManager.Object, mockUserManager.Object)
            {
                Input = new LoginModel.InputModel
                {
                    Email = "inactive@test.com",
                    Password = "Test123!",
                    RememberMe = false
                }
            };

            SetupPageContext(loginModel);

            // Act
            var result = await loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(loginModel.ModelState.IsValid);
            var errorMessage = loginModel.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault() ?? "";
            Assert.Contains("desactivada", errorMessage);
        }

        [Fact]
        public async Task OnPostAsync_WithWrongPassword_ReturnsPageWithError()
        {
            // Arrange
            var mockUserManager = CreateMockUserManager();
            var mockSignInManager = CreateMockSignInManager(mockUserManager);

            var user = new ApplicationUser
            {
                Email = "test@test.com",
                UserName = "test@test.com",
                IsActive = true
            };

            mockUserManager.Setup(x => x.FindByEmailAsync("test@test.com"))
                .ReturnsAsync(user);

            mockSignInManager.Setup(x => x.PasswordSignInAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

            var loginModel = new LoginModel(mockSignInManager.Object, mockUserManager.Object)
            {
                Input = new LoginModel.InputModel
                {
                    Email = "test@test.com",
                    Password = "WrongPassword",
                    RememberMe = false
                }
            };

            SetupPageContext(loginModel);

            // Act
            var result = await loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(loginModel.ModelState.IsValid);
        }

        [Fact]
        public async Task OnPostAsync_WithLockedAccount_ReturnsPageWithLockoutMessage()
        {
            // Arrange
            var mockUserManager = CreateMockUserManager();
            var mockSignInManager = CreateMockSignInManager(mockUserManager);

            var user = new ApplicationUser
            {
                Email = "locked@test.com",
                UserName = "locked@test.com",
                IsActive = true
            };

            mockUserManager.Setup(x => x.FindByEmailAsync("locked@test.com"))
                .ReturnsAsync(user);

            mockSignInManager.Setup(x => x.PasswordSignInAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.LockedOut);

            var loginModel = new LoginModel(mockSignInManager.Object, mockUserManager.Object)
            {
                Input = new LoginModel.InputModel
                {
                    Email = "locked@test.com",
                    Password = "Test123!",
                    RememberMe = false
                }
            };

            SetupPageContext(loginModel);

            // Act
            var result = await loginModel.OnPostAsync();

            // Assert
            Assert.IsType<PageResult>(result);
            Assert.False(loginModel.ModelState.IsValid);
            var errorMessage = loginModel.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault() ?? "";
            Assert.Contains("bloqueada", errorMessage);
        }

        [Fact]
        public void LoginInputModel_EmailIsRequired()
        {
            // Arrange
            var input = new LoginModel.InputModel
            {
                Email = "",
                Password = "Test123!"
            };

            // Assert
            Assert.Empty(input.Email);
        }

        [Fact]
        public void LoginInputModel_PasswordIsRequired()
        {
            // Arrange
            var input = new LoginModel.InputModel
            {
                Email = "test@test.com",
                Password = ""
            };

            // Assert
            Assert.Empty(input.Password);
        }

        [Fact]
        public void LoginInputModel_RememberMeDefaultsToFalse()
        {
            // Arrange & Act
            var input = new LoginModel.InputModel();

            // Assert
            Assert.False(input.RememberMe);
        }

        [Fact]
        public void LoginInputModel_HasCorrectProperties()
        {
            // Arrange & Act
            var input = new LoginModel.InputModel
            {
                Email = "test@test.com",
                Password = "Test123!",
                RememberMe = true
            };

            // Assert
            Assert.Equal("test@test.com", input.Email);
            Assert.Equal("Test123!", input.Password);
            Assert.True(input.RememberMe);
        }
    }
}
