using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.Security.Claims;
using Xunit;

namespace AdminPanel.Tests.Pages.Products
{
    /// <summary>
    /// Unit tests for Products ToggleStatus PageModel
    /// Covers all border cases for toggling product status
    /// </summary>
    public class ToggleStatusModelTests
    {
        private readonly Mock<IProductService> _mockProductService;
        private readonly ToggleStatusModel _pageModel;

        public ToggleStatusModelTests()
        {
            _mockProductService = new Mock<IProductService>();
            _pageModel = new ToggleStatusModel(_mockProductService.Object);

            SetupPageContext();
        }

        private void SetupPageContext()
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("");

            _pageModel.PageContext = new PageContext
            {
                HttpContext = httpContext,
                ViewData = new ViewDataDictionary(new EmptyModelMetadataProvider(), new ModelStateDictionary())
            };

            _pageModel.TempData = new TempDataDictionary(httpContext, Mock.Of<ITempDataProvider>());
        }

        [Fact]
        public async Task OnPostAsync_WithNullId_ReturnsNotFound()
        {
            // Arrange - Border case: null ID
            // Act
            var result = await _pageModel.OnPostAsync(null);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-100)]
        public async Task OnPostAsync_WithInvalidId_ReturnsNotFound(int id)
        {
            // Arrange - Border case: invalid IDs
            _mockProductService.Setup(s => s.GetProductByIdAsync(id))
                .ReturnsAsync((Product?)null);

            // Act
            var result = await _pageModel.OnPostAsync(id);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task OnPostAsync_WithNonExistentId_ReturnsNotFound()
        {
            // Arrange - Border case: non-existent product
            _mockProductService.Setup(s => s.GetProductByIdAsync(999))
                .ReturnsAsync((Product?)null);

            // Act
            var result = await _pageModel.OnPostAsync(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task OnPostAsync_WithValidActiveProduct_TogglesStatusToInactive()
        {
            // Arrange
            var product = new Product
            {
                Id = 1,
                Name = "Test Product",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _pageModel.OnPostAsync(1);

            // Assert
            Assert.IsType<RedirectToPageResult>(result);
            _mockProductService.Verify(s => s.ToggleProductStatusAsync(1), Times.Once);
            Assert.NotNull(_pageModel.TempData["SuccessMessage"]);
        }

        [Fact]
        public async Task OnPostAsync_WithValidInactiveProduct_TogglesStatusToActive()
        {
            // Arrange
            var product = new Product
            {
                Id = 1,
                Name = "Test Product",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = false
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _pageModel.OnPostAsync(1);

            // Assert
            Assert.IsType<RedirectToPageResult>(result);
            _mockProductService.Verify(s => s.ToggleProductStatusAsync(1), Times.Once);
        }

        [Fact]
        public async Task OnPostAsync_WithProductWithZeroStock_TogglesStatusSuccessfully()
        {
            // Arrange - Border case: toggling status of out-of-stock product
            var product = new Product
            {
                Id = 1,
                Name = "Test Product",
                Description = "Test",
                Price = 10.00m,
                Stock = 0,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _pageModel.OnPostAsync(1);

            // Assert
            Assert.IsType<RedirectToPageResult>(result);
            _mockProductService.Verify(s => s.ToggleProductStatusAsync(1), Times.Once);
        }

        [Fact]
        public async Task OnPostAsync_MultipleTogglesSameProduct_TogglesEachTime()
        {
            // Arrange - Border case: multiple rapid toggles
            var product = new Product
            {
                Id = 1,
                Name = "Test Product",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            await _pageModel.OnPostAsync(1);
            await _pageModel.OnPostAsync(1);
            await _pageModel.OnPostAsync(1);

            // Assert
            _mockProductService.Verify(s => s.ToggleProductStatusAsync(1), Times.Exactly(3));
        }

        [Fact]
        public async Task OnPostAsync_WithReturnUrl_RedirectsToReturnUrl()
        {
            // Arrange - Border case: with return URL
            var product = new Product
            {
                Id = 1,
                Name = "Test Product",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?returnUrl=/Products/Details/1");

            _pageModel.PageContext = new PageContext
            {
                HttpContext = httpContext,
                ViewData = new ViewDataDictionary(new EmptyModelMetadataProvider(), new ModelStateDictionary())
            };
            _pageModel.TempData = new TempDataDictionary(httpContext, Mock.Of<ITempDataProvider>());

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _pageModel.OnPostAsync(1);

            // Assert
            Assert.IsType<LocalRedirectResult>(result);
        }

        [Fact]
        public async Task OnPostAsync_WithoutReturnUrl_RedirectsToIndex()
        {
            // Arrange
            var product = new Product
            {
                Id = 1,
                Name = "Test Product",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _pageModel.OnPostAsync(1);

            // Assert
            var redirectResult = Assert.IsType<RedirectToPageResult>(result);
            Assert.Equal("./Index", redirectResult.PageName);
        }

        [Fact]
        public async Task OnPostAsync_WithProductWithSpecialCharacters_HandlesSuccessMessage()
        {
            // Arrange - Border case: special characters in product name for message
            var product = new Product
            {
                Id = 1,
                Name = "Test Product & Co. (™) <Special>",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _pageModel.OnPostAsync(1);

            // Assert
            Assert.IsType<RedirectToPageResult>(result);
            var message = _pageModel.TempData["SuccessMessage"]?.ToString();
            Assert.NotNull(message);
            Assert.Contains(product.Name, message);
        }

        [Fact]
        public async Task OnPostAsync_WithVeryLongProductName_HandlesSuccessMessage()
        {
            // Arrange - Border case: very long product name
            var product = new Product
            {
                Id = 1,
                Name = new string('A', 200),
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);
            _mockProductService.Setup(s => s.ToggleProductStatusAsync(1))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _pageModel.OnPostAsync(1);

            // Assert
            Assert.IsType<RedirectToPageResult>(result);
            Assert.NotNull(_pageModel.TempData["SuccessMessage"]);
        }

        [Theory]
        [InlineData(int.MaxValue)]
        [InlineData(1000000)]
        public async Task OnPostAsync_WithVeryLargeId_HandlesCorrectly(int id)
        {
            // Arrange - Border case: very large IDs
            _mockProductService.Setup(s => s.GetProductByIdAsync(id))
                .ReturnsAsync((Product?)null);

            // Act
            var result = await _pageModel.OnPostAsync(id);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
