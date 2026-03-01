using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Xunit;

namespace AdminPanel.Tests.Pages.Products
{
    /// <summary>
    /// Unit tests for Products Index PageModel
    /// Covers all border cases for product CRUD operations (excluding stock management)
    /// </summary>
    public class IndexModelTests
    {
        private readonly Mock<IProductService> _mockProductService;
        private readonly Mock<ICategoryService> _mockCategoryService;
        private readonly Mock<IWebHostEnvironment> _mockEnvironment;
        private readonly Mock<IStockMovementService> _mockStockMovementService;
        private readonly IndexModel _pageModel;

        public IndexModelTests()
        {
            _mockProductService = new Mock<IProductService>();
            _mockCategoryService = new Mock<ICategoryService>();
            _mockEnvironment = new Mock<IWebHostEnvironment>();
            _mockStockMovementService = new Mock<IStockMovementService>();

            _pageModel = new IndexModel(
                _mockProductService.Object,
                _mockCategoryService.Object,
                _mockEnvironment.Object,
                _mockStockMovementService.Object
            );

            SetupPageContext();
        }

        private void SetupPageContext()
        {
            var httpContext = new DefaultHttpContext();
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
                new Claim(ClaimTypes.Name, "testuser")
            }, "mock"));

            _pageModel.PageContext = new PageContext
            {
                HttpContext = httpContext,
                ViewData = new ViewDataDictionary(new EmptyModelMetadataProvider(), new ModelStateDictionary())
            };

            _mockEnvironment.Setup(e => e.WebRootPath).Returns("wwwroot");
        }

        #region OnGetAsync Tests

        [Fact]
        public async Task OnGetAsync_WithNoFilters_ReturnsAllProducts()
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
            Assert.Empty(_pageModel.CurrentFilter);
            Assert.Empty(_pageModel.CurrentSort);
            Assert.Null(_pageModel.CurrentCategory);
            Assert.Null(_pageModel.CurrentStatus);
        }

        [Theory]
        [InlineData("Laptop")]
        [InlineData("laptop")]
        [InlineData("LAPTOP")]
        [InlineData("")]
        [InlineData(null)]
        public async Task OnGetAsync_WithSearchString_FiltersProductsCaseInsensitive(string? searchString)
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(searchString, null, null, null, 1);

            // Assert
            Assert.Equal(searchString ?? string.Empty, _pageModel.CurrentFilter);
        }

        [Theory]
        [InlineData("name_desc")]
        [InlineData("price")]
        [InlineData("price_desc")]
        [InlineData("stock")]
        [InlineData("stock_desc")]
        [InlineData("")]
        [InlineData(null)]
        public async Task OnGetAsync_WithDifferentSortOrders_SortsCorrectly(string? sortOrder)
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, sortOrder, null, null, 1);

            // Assert
            Assert.Equal(sortOrder ?? string.Empty, _pageModel.CurrentSort);
        }

        [Theory]
        [InlineData(1)]
        [InlineData(2)]
        [InlineData(null)]
        public async Task OnGetAsync_WithCategoryFilter_FiltersCorrectly(int? categoryId)
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, categoryId, null, 1);

            // Assert
            Assert.Equal(categoryId, _pageModel.CurrentCategory);
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        [InlineData(null)]
        public async Task OnGetAsync_WithActiveStatusFilter_FiltersCorrectly(bool? isActive)
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, isActive, 1);

            // Assert
            Assert.Equal(isActive, _pageModel.CurrentStatus);
        }

        [Fact]
        public async Task OnGetAsync_WithAllFilters_AppliesAllFiltersCorrectly()
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync("Laptop", "price_desc", 1, true, 1);

            // Assert
            Assert.Equal("Laptop", _pageModel.CurrentFilter);
            Assert.Equal("price_desc", _pageModel.CurrentSort);
            Assert.Equal(1, _pageModel.CurrentCategory);
            Assert.True(_pageModel.CurrentStatus);
        }

        [Theory]
        [InlineData(1)]
        [InlineData(2)]
        [InlineData(10)]
        public async Task OnGetAsync_WithDifferentPageIndexes_LoadsCorrectPage(int pageIndex)
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = GetTestProducts(50); // Create enough products for pagination
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, null, pageIndex);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        #endregion

        #region OnPostSaveAsync Tests - Create Product

        [Fact]
        public async Task OnPostSaveAsync_WithValidNewProduct_CreatesSuccessfully()
        {
            // Arrange
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test Product",
                Description = "Test Description",
                Price = 99.99m,
                Stock = 10,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.CreateProductAsync(It.IsAny<Product>()))
                .ReturnsAsync((Product p) => { p.Id = 1; return p; });

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.True(success);
            _mockProductService.Verify(s => s.CreateProductAsync(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithMinimumValidValues_CreatesSuccessfully()
        {
            // Arrange - Border case: minimum valid values
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "A", // 1 character
                Description = "D", // 1 character
                Price = 0.01m, // Minimum price
                Stock = 0, // Minimum stock
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.CreateProductAsync(It.IsAny<Product>()))
                .ReturnsAsync((Product p) => { p.Id = 1; return p; });

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.True(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithMaximumValidValues_CreatesSuccessfully()
        {
            // Arrange - Border case: maximum valid values
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = new string('A', 200), // Max length 200
                Description = new string('D', 5000), // Very long description
                Price = 999999.99m, // Maximum price
                Stock = int.MaxValue, // Maximum stock
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.CreateProductAsync(It.IsAny<Product>()))
                .ReturnsAsync((Product p) => { p.Id = 1; return p; });

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.True(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithMissingName_ReturnsValidationError()
        {
            // Arrange - Border case: missing required field
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = null!,
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            _pageModel.ModelState.AddModelError("Input.Name", "El nombre es requerido");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithNameTooLong_ReturnsValidationError()
        {
            // Arrange - Border case: exceeds max length
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = new string('A', 201), // Exceeds 200 char limit
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            _pageModel.ModelState.AddModelError("Input.Name", "El nombre no puede exceder 200 caracteres");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-0.01)]
        public async Task OnPostSaveAsync_WithInvalidPrice_ReturnsValidationError(decimal price)
        {
            // Arrange - Border case: invalid price values
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = price,
                Stock = 5,
                CategoryId = 1
            };

            _pageModel.ModelState.AddModelError("Input.Price", "El precio debe estar entre 0.01 y 999,999.99");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithPriceExceedingMaximum_ReturnsValidationError()
        {
            // Arrange - Border case: price exceeds maximum
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 1000000.00m, // Exceeds 999,999.99
                Stock = 5,
                CategoryId = 1
            };

            _pageModel.ModelState.AddModelError("Input.Price", "El precio debe estar entre 0.01 y 999,999.99");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-100)]
        public async Task OnPostSaveAsync_WithNegativeStock_ReturnsValidationError(int stock)
        {
            // Arrange - Border case: negative stock
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = stock,
                CategoryId = 1
            };

            _pageModel.ModelState.AddModelError("Input.Stock", "El stock debe ser mayor o igual a 0");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithMissingCategory_ReturnsValidationError()
        {
            // Arrange - Border case: missing required category
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 0
            };

            _pageModel.ModelState.AddModelError("Input.CategoryId", "La categoría es requerida");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithInactiveProduct_CreatesInactiveProduct()
        {
            // Arrange - Border case: creating inactive product
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test Product",
                Description = "Test Description",
                Price = 99.99m,
                Stock = 10,
                CategoryId = 1,
                IsActive = false
            };

            Product createdProduct = null!;
            _mockProductService.Setup(s => s.CreateProductAsync(It.IsAny<Product>()))
                .Callback<Product>(p => createdProduct = p)
                .ReturnsAsync((Product p) => { p.Id = 1; return p; });

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            Assert.False(createdProduct.IsActive);
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.True(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithZeroStock_CreatesProductWithZeroStock()
        {
            // Arrange - Border case: zero stock
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test Product",
                Description = "Test Description",
                Price = 99.99m,
                Stock = 0,
                CategoryId = 1,
                IsActive = true
            };

            Product createdProduct = null!;
            _mockProductService.Setup(s => s.CreateProductAsync(It.IsAny<Product>()))
                .Callback<Product>(p => createdProduct = p)
                .ReturnsAsync((Product p) => { p.Id = 1; return p; });

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            Assert.Equal(0, createdProduct.Stock);
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.True(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithSpecialCharactersInName_CreatesSuccessfully()
        {
            // Arrange - Border case: special characters
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test Product @#$% & Co. (™)",
                Description = "Test with <html> tags & special chars: €£¥",
                Price = 99.99m,
                Stock = 10,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.CreateProductAsync(It.IsAny<Product>()))
                .ReturnsAsync((Product p) => { p.Id = 1; return p; });

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.True(success);
        }

        #endregion

        #region OnPostSaveAsync Tests - Update Product

        [Fact]
        public async Task OnPostSaveAsync_WithExistingProductId_UpdatesProduct()
        {
            // Arrange
            var existingProduct = new Product
            {
                Id = 1,
                Name = "Old Name",
                Description = "Old Description",
                Price = 50.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            _pageModel.Input = new IndexModel.InputModel
            {
                Id = 1,
                Name = "Updated Name",
                Description = "Updated Description",
                Price = 100.00m,
                Stock = 20,
                CategoryId = 2,
                IsActive = false
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(existingProduct);
            _mockProductService.Setup(s => s.UpdateProductAsync(It.IsAny<Product>()))
                .ReturnsAsync((Product p) => p);

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            Assert.Equal("Updated Name", existingProduct.Name);
            Assert.Equal("Updated Description", existingProduct.Description);
            Assert.Equal(100.00m, existingProduct.Price);
            Assert.Equal(20, existingProduct.Stock);
            Assert.Equal(2, existingProduct.CategoryId);
            Assert.False(existingProduct.IsActive);
            _mockProductService.Verify(s => s.UpdateProductAsync(It.IsAny<Product>()), Times.Once);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithNonExistentProductId_ReturnsError()
        {
            // Arrange - Border case: trying to update non-existent product
            _pageModel.Input = new IndexModel.InputModel
            {
                Id = 999,
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(999))
                .ReturnsAsync((Product?)null);

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
            var errors = GetJsonProperty<JsonElement>(jsonResult, "errors");
            Assert.Contains("no encontrado", errors[0].GetString()!.ToLower());
        }

        [Fact]
        public async Task OnPostSaveAsync_UpdateWithoutChangingImage_MaintainsImageUrl()
        {
            // Arrange - Border case: update without changing image
            var existingProduct = new Product
            {
                Id = 1,
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true,
                ImageUrl = "/uploads/products/test.jpg"
            };

            _pageModel.Input = new IndexModel.InputModel
            {
                Id = 1,
                Name = "Updated Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = true
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(existingProduct);
            _mockProductService.Setup(s => s.UpdateProductAsync(It.IsAny<Product>()))
                .ReturnsAsync((Product p) => p);

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            Assert.Equal("/uploads/products/test.jpg", existingProduct.ImageUrl);
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.True(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithAllFieldsEmpty_ReturnsMultipleValidationErrors()
        {
            // Arrange - Border case: all required fields missing
            _pageModel.Input = new IndexModel.InputModel();

            _pageModel.ModelState.AddModelError("Input.Name", "El nombre es requerido");
            _pageModel.ModelState.AddModelError("Input.Description", "La descripción es requerida");
            _pageModel.ModelState.AddModelError("Input.Price", "El precio es requerido");
            _pageModel.ModelState.AddModelError("Input.CategoryId", "La categoría es requerida");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
            var errors = GetJsonProperty<JsonElement>(jsonResult, "errors");
            Assert.True(errors.GetArrayLength() > 0);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("\t")]
        [InlineData("\n")]
        public async Task OnPostSaveAsync_WithWhitespaceOnlyName_ReturnsValidationError(string name)
        {
            // Arrange - Border case: whitespace-only strings
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = name,
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            _pageModel.ModelState.AddModelError("Input.Name", "El nombre es requerido");

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            var jsonResult = Assert.IsType<JsonResult>(result);
            var success = GetJsonProperty<bool>(jsonResult, "success");
            Assert.False(success);
        }

        [Fact]
        public async Task OnPostSaveAsync_WithDecimalPricePrecision_HandlesCorrectly()
        {
            // Arrange - Border case: decimal precision
            _pageModel.Input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 99.999m, // More than 2 decimal places
                Stock = 5,
                CategoryId = 1
            };

            Product createdProduct = null!;
            _mockProductService.Setup(s => s.CreateProductAsync(It.IsAny<Product>()))
                .Callback<Product>(p => createdProduct = p)
                .ReturnsAsync((Product p) => { p.Id = 1; return p; });

            // Act
            var result = await _pageModel.OnPostSaveAsync();

            // Assert
            Assert.Equal(99.999m, createdProduct.Price);
        }

        #endregion

        #region Concurrent Operations Edge Cases

        [Fact]
        public async Task OnGetProductDataAsync_CalledMultipleTimes_ReturnsConsistentData()
        {
            // Arrange - Border case: multiple rapid requests
            var product = new Product
            {
                Id = 1,
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            _mockProductService.Setup(s => s.GetProductByIdAsync(1))
                .ReturnsAsync(product);

            // Act
            var result1 = await _pageModel.OnGetProductDataAsync(1);
            var result2 = await _pageModel.OnGetProductDataAsync(1);
            var result3 = await _pageModel.OnGetProductDataAsync(1);

            // Assert
            Assert.IsType<JsonResult>(result1);
            Assert.IsType<JsonResult>(result2);
            Assert.IsType<JsonResult>(result3);
            _mockProductService.Verify(s => s.GetProductByIdAsync(1), Times.Exactly(3));
        }

        #endregion

        #region Helper Methods

        private ApplicationDbContext CreateFreshContext()
        {
            return TestDbHelper.CreateInMemoryContext();
        }

        private List<Product> GetTestProducts(int count = 5)
        {
            var products = new List<Product>();
            for (int i = 1; i <= count; i++)
            {
                products.Add(CreateProduct(i, $"Product {i}", $"Description {i}", 10.00m * i, i * 5, (i % 3) + 1));
            }
            return products;
        }

        private Product CreateProduct(int id, string name, string description, decimal price, int stock, int categoryId)
        {
            return new Product
            {
                Id = id,
                Name = name,
                Description = description,
                Price = price,
                Stock = stock,
                CategoryId = categoryId,
                IsActive = id % 2 == 0 // Alternate active/inactive
            };
        }

        private T GetJsonProperty<T>(JsonResult jsonResult, string propertyName)
        {
            var json = JsonSerializer.Serialize(jsonResult.Value);
            var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            
            try
            {
                if (root.TryGetProperty(propertyName, out var property))
                {
                    if (typeof(T) == typeof(bool))
                    {
                        return (T)(object)property.GetBoolean();
                    }
                    else if (typeof(T) == typeof(string))
                    {
                        return (T)(object)property.GetString()!;
                    }
                    else if (typeof(T) == typeof(JsonElement))
                    {
                        return (T)(object)property.Clone();
                    }
                }
                
                return default(T)!;
            }
            finally
            {
                document.Dispose();
            }
        }

        #endregion

        #region Invalid Filter Inputs

        [Fact]
        public async Task OnGetAsync_WithInvalidCategoryId_StillLoadsPage()
        {
            // Arrange - Border case: non-existent category
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, 9999, null, 1);

            // Assert
            Assert.Equal(9999, _pageModel.CurrentCategory);
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_WithNegativeCategoryId_StillLoadsPage()
        {
            // Arrange - Border case: negative category ID
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, -1, null, 1);

            // Assert
            Assert.Equal(-1, _pageModel.CurrentCategory);
        }

        #endregion

        #region Pagination Border Cases

        [Fact]
        public async Task OnGetAsync_WithZeroPageIndex_LoadsFirstPage()
        {
            // Arrange - Border case: zero page index
            using var context = CreateFreshContext();
            var products = GetTestProducts(50);
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, null, 0);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_WithNegativePageIndex_LoadsFirstPage()
        {
            // Arrange - Border case: negative page index
            using var context = CreateFreshContext();
            var products = GetTestProducts(50);
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, null, -5);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_WithPageIndexExceedingTotalPages_LoadsLastPage()
        {
            // Arrange - Border case: page index exceeds total pages
            using var context = CreateFreshContext();
            var products = GetTestProducts(5);
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, null, 1000);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_WithEmptyProductList_LoadsEmptyPaginatedList()
        {
            // Arrange - Border case: no products
            using var context = CreateFreshContext();
            var products = new List<Product>();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
            Assert.Empty(_pageModel.Products.Items);
        }

        #endregion

        #region Search Border Cases

        [Theory]
        [InlineData("Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam")]
        public async Task OnGetAsync_WithVeryLongSearchString_HandlesCorrectly(string searchString)
        {
            // Arrange - Border case: very long search string
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(searchString, null, null, null, 1);

            // Assert
            Assert.Equal(searchString, _pageModel.CurrentFilter);
        }

        [Theory]
        [InlineData("Test@#$%")]
        [InlineData("Test<script>")]
        [InlineData("Test'OR'1'='1")]
        [InlineData("Test%20Product")]
        public async Task OnGetAsync_WithSpecialCharactersInSearch_HandlesCorrectly(string searchString)
        {
            // Arrange - Border case: special characters and potential SQL injection
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(searchString, null, null, null, 1);

            // Assert
            Assert.Equal(searchString, _pageModel.CurrentFilter);
        }

        [Fact]
        public async Task OnGetAsync_SearchMatchesInName_ReturnsMatchingProducts()
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = new List<Product>
            {
                CreateProduct(1, "Laptop HP", "Description", 100, 10, 1),
                CreateProduct(2, "Mouse", "Description", 20, 5, 1),
                CreateProduct(3, "Laptop Dell", "Description", 150, 8, 1)
            };

            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync("Laptop", null, null, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_SearchMatchesInDescription_ReturnsMatchingProducts()
        {
            // Arrange
            using var context = CreateFreshContext();
            var products = new List<Product>
            {
                CreateProduct(1, "Product 1", "Gaming laptop with RTX", 100, 10, 1),
                CreateProduct(2, "Product 2", "Office keyboard", 20, 5, 1),
                CreateProduct(3, "Product 3", "Gaming mouse RGB", 50, 8, 1)
            };

            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync("Gaming", null, null, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        #endregion

        #region Multiple Filters Combination Tests

        [Fact]
        public async Task OnGetAsync_ActiveProductsInSpecificCategory_FiltersCorrectly()
        {
            // Arrange - Border case: multiple filters combined
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, 1, true, 1);

            // Assert
            Assert.Equal(1, _pageModel.CurrentCategory);
            Assert.True(_pageModel.CurrentStatus);
        }

        [Fact]
        public async Task OnGetAsync_SearchInSpecificCategoryWithStatus_FiltersCorrectly()
        {
            // Arrange - Border case: all filters active
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync("Laptop", "price_desc", 1, true, 1);

            // Assert
            Assert.Equal("Laptop", _pageModel.CurrentFilter);
            Assert.Equal("price_desc", _pageModel.CurrentSort);
            Assert.Equal(1, _pageModel.CurrentCategory);
            Assert.True(_pageModel.CurrentStatus);
        }

        [Fact]
        public async Task OnGetAsync_InactiveProductsOnly_FiltersCorrectly()
        {
            // Arrange - Border case: filtering only inactive products
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, null, false, 1);

            // Assert
            Assert.False(_pageModel.CurrentStatus);
        }

        #endregion

        #region Sorting Border Cases

        [Fact]
        public async Task OnGetAsync_WithInvalidSortOrder_UsesDefaultSort()
        {
            // Arrange - Border case: invalid sort order
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, "invalid_sort", null, null, 1);

            // Assert
            Assert.Equal("invalid_sort", _pageModel.CurrentSort);
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_SortByPriceAscending_WithIdenticalPrices_MaintainsOrder()
        {
            // Arrange - Border case: identical values in sort field
            using var context = CreateFreshContext();
            var products = new List<Product>
            {
                CreateProduct(1, "Product A", "Desc", 50.00m, 10, 1),
                CreateProduct(2, "Product B", "Desc", 50.00m, 5, 1),
                CreateProduct(3, "Product C", "Desc", 50.00m, 8, 1)
            };

            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, "price", null, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_SortByStockDescending_WithZeroStock_HandlesCorrectly()
        {
            // Arrange - Border case: sorting with zero values
            using var context = CreateFreshContext();
            var products = new List<Product>
            {
                CreateProduct(1, "Product A", "Desc", 50.00m, 0, 1),
                CreateProduct(2, "Product B", "Desc", 50.00m, 100, 1),
                CreateProduct(3, "Product C", "Desc", 50.00m, 0, 1)
            };

            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, "stock_desc", null, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        #endregion

        #region Filter Combinations That Return Empty Results

        [Fact]
        public async Task OnGetAsync_WithSearchThatMatchesNothing_ReturnsEmptyList()
        {
            // Arrange - Border case: search returns no results
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync("NonExistentProductXYZ123", null, null, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        [Fact]
        public async Task OnGetAsync_WithCategoryThatHasNoProducts_ReturnsEmptyList()
        {
            // Arrange - Border case: category with no products
            using var context = CreateFreshContext();
            var products = GetTestProducts();
            TestDbHelper.CreateTestProductQuery(context, products);
            _mockProductService.Setup(s => s.GetProductsQuery())
                .Returns(context.Products.Include(p => p.Category));
            _mockCategoryService.Setup(s => s.GetCategorySelectListAsync())
                .ReturnsAsync(new List<SelectListItem>());

            // Act
            await _pageModel.OnGetAsync(null, null, 999, null, 1);

            // Assert
            Assert.NotNull(_pageModel.Products);
        }

        #endregion
    }
}
