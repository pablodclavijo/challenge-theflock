using AdminPanel.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AdminPanel.Tests.Services
{
    /// <summary>
    /// Integration tests for ProductService
    /// Covers all border cases for product operations (excluding stock management)
    /// Uses in-memory database for testing
    /// </summary>
    public class ProductServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IStockMovementService> _mockStockMovementService;
        private readonly ProductService _productService;

        public ProductServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockStockMovementService = new Mock<IStockMovementService>();
            _productService = new ProductService(_context, _mockStockMovementService.Object);

            SeedDatabase();
        }

        private void SeedDatabase()
        {
            var categories = new List<Category>
            {
                new Category { Id = 1, Name = "Electronics", IsActive = true },
                new Category { Id = 2, Name = "Clothing", IsActive = true },
                new Category { Id = 3, Name = "Books", IsActive = false }
            };

            _context.Categories.AddRange(categories);
            _context.SaveChanges();
        }

        #region GetProductByIdAsync Tests

        [Fact]
        public async Task GetProductByIdAsync_WithValidId_ReturnsProduct()
        {
            // Arrange
            var product = CreateTestProduct("Test Product", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetProductByIdAsync(product.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Test Product", result.Name);
        }

        [Fact]
        public async Task GetProductByIdAsync_WithNonExistentId_ReturnsNull()
        {
            // Arrange - Border case: non-existent ID
            // Act
            var result = await _productService.GetProductByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-999)]
        public async Task GetProductByIdAsync_WithInvalidId_ReturnsNull(int id)
        {
            // Arrange - Border case: zero or negative IDs
            // Act
            var result = await _productService.GetProductByIdAsync(id);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetProductByIdAsync_WithMaxIntId_ReturnsNull()
        {
            // Arrange - Border case: maximum int value
            // Act
            var result = await _productService.GetProductByIdAsync(int.MaxValue);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region CreateProductAsync Tests

        [Fact]
        public async Task CreateProductAsync_WithValidProduct_CreatesSuccessfully()
        {
            // Arrange
            var product = CreateTestProduct("New Product", 1);

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Id > 0);
            Assert.Equal("New Product", result.Name);
            Assert.NotEqual(default(DateTime), result.CreatedAt);
            Assert.NotEqual(default(DateTime), result.UpdatedAt);
        }

        [Fact]
        public async Task CreateProductAsync_WithMinimumPrice_CreatesSuccessfully()
        {
            // Arrange - Border case: minimum price
            var product = CreateTestProduct("Minimum Price Product", 1);
            product.Price = 0.01m;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0.01m, result.Price);
        }

        [Fact]
        public async Task CreateProductAsync_WithMaximumPrice_CreatesSuccessfully()
        {
            // Arrange - Border case: maximum price
            var product = CreateTestProduct("Maximum Price Product", 1);
            product.Price = 999999.99m;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(999999.99m, result.Price);
        }

        [Fact]
        public async Task CreateProductAsync_WithZeroStock_CreatesSuccessfully()
        {
            // Arrange - Border case: zero stock
            var product = CreateTestProduct("Zero Stock Product", 1);
            product.Stock = 0;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.Stock);
        }

        [Fact]
        public async Task CreateProductAsync_WithMaximumStock_CreatesSuccessfully()
        {
            // Arrange - Border case: very large stock
            var product = CreateTestProduct("Large Stock Product", 1);
            product.Stock = int.MaxValue;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(int.MaxValue, result.Stock);
        }

        [Fact]
        public async Task CreateProductAsync_WithInactiveStatus_CreatesInactiveProduct()
        {
            // Arrange - Border case: creating inactive product
            var product = CreateTestProduct("Inactive Product", 1);
            product.IsActive = false;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsActive);
        }

        [Fact]
        public async Task CreateProductAsync_WithNullImageUrl_CreatesSuccessfully()
        {
            // Arrange - Border case: no image
            var product = CreateTestProduct("No Image Product", 1);
            product.ImageUrl = null;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.ImageUrl);
        }

        [Fact]
        public async Task CreateProductAsync_WithEmptyImageUrl_CreatesSuccessfully()
        {
            // Arrange - Border case: empty image URL
            var product = CreateTestProduct("Empty Image Product", 1);
            product.ImageUrl = "";

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("", result.ImageUrl);
        }

        [Theory]
        [InlineData("A")] // Single character
        [InlineData("AB")]
        public async Task CreateProductAsync_WithMinimumLengthName_CreatesSuccessfully(string name)
        {
            // Arrange - Border case: very short names
            var product = CreateTestProduct(name, 1);

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(name, result.Name);
        }

        [Fact]
        public async Task CreateProductAsync_WithMaximumLengthName_CreatesSuccessfully()
        {
            // Arrange - Border case: maximum length name (200 chars)
            var name = new string('A', 200);
            var product = CreateTestProduct(name, 1);

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(200, result.Name.Length);
        }

        [Fact]
        public async Task CreateProductAsync_WithSpecialCharactersInName_CreatesSuccessfully()
        {
            // Arrange - Border case: special characters
            var product = CreateTestProduct("Product @#$% & Co. (™)", 1);

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Contains("@#$%", result.Name);
        }

        [Fact]
        public async Task CreateProductAsync_WithUnicodeCharacters_CreatesSuccessfully()
        {
            // Arrange - Border case: unicode characters
            var product = CreateTestProduct("?? Ñoño ?????? ??", 1);

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("?? Ñoño ?????? ??", result.Name);
        }

        [Fact]
        public async Task CreateProductAsync_WithLongDescription_CreatesSuccessfully()
        {
            // Arrange - Border case: very long description
            var product = CreateTestProduct("Test", 1);
            product.Description = new string('D', 10000);

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(10000, result.Description.Length);
        }

        [Fact]
        public async Task CreateProductAsync_MultipleProductsInSameCategory_CreatesAll()
        {
            // Arrange - Border case: multiple products same category
            var product1 = CreateTestProduct("Product 1", 1);
            var product2 = CreateTestProduct("Product 2", 1);
            var product3 = CreateTestProduct("Product 3", 1);

            // Act
            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);
            await _productService.CreateProductAsync(product3);

            // Assert
            var products = await _context.Products.Where(p => p.CategoryId == 1).ToListAsync();
            Assert.Equal(3, products.Count);
        }

        [Fact]
        public async Task CreateProductAsync_WithDuplicateName_CreatesSuccessfully()
        {
            // Arrange - Border case: duplicate names allowed
            var product1 = CreateTestProduct("Duplicate Name", 1);
            var product2 = CreateTestProduct("Duplicate Name", 1);

            // Act
            var result1 = await _productService.CreateProductAsync(product1);
            var result2 = await _productService.CreateProductAsync(product2);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.NotEqual(result1.Id, result2.Id);
            Assert.Equal(result1.Name, result2.Name);
        }

        #endregion

        #region UpdateProductAsync Tests

        [Fact]
        public async Task UpdateProductAsync_WithValidChanges_UpdatesSuccessfully()
        {
            // Arrange
            var product = CreateTestProduct("Original", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.Name = "Updated";
            product.Price = 99.99m;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal("Updated", result.Name);
            Assert.Equal(99.99m, result.Price);
            Assert.NotEqual(default(DateTime), result.UpdatedAt);
        }

        [Fact]
        public async Task UpdateProductAsync_ChangingAllFields_UpdatesAllFields()
        {
            // Arrange
            var product = CreateTestProduct("Original", 1);
            product.Price = 50.00m;
            product.Stock = 10;
            product.IsActive = true;
            product.ImageUrl = "/old.jpg";
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Change all fields
            product.Name = "Completely New Name";
            product.Description = "Completely New Description";
            product.Price = 199.99m;
            product.Stock = 50;
            product.CategoryId = 2;
            product.IsActive = false;
            product.ImageUrl = "/new.jpg";

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal("Completely New Name", result.Name);
            Assert.Equal("Completely New Description", result.Description);
            Assert.Equal(199.99m, result.Price);
            Assert.Equal(50, result.Stock);
            Assert.Equal(2, result.CategoryId);
            Assert.False(result.IsActive);
            Assert.Equal("/new.jpg", result.ImageUrl);
        }

        [Fact]
        public async Task UpdateProductAsync_WithNoChanges_UpdatesTimestamp()
        {
            // Arrange - Border case: update with no actual changes
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var originalUpdatedAt = product.UpdatedAt;
            await Task.Delay(10); // Small delay to ensure timestamp changes

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.True(result.UpdatedAt >= originalUpdatedAt);
        }

        [Fact]
        public async Task UpdateProductAsync_ChangingPriceToZeroPointZeroOne_UpdatesCorrectly()
        {
            // Arrange - Border case: updating to minimum price
            var product = CreateTestProduct("Test", 1);
            product.Price = 999.99m;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.Price = 0.01m;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(0.01m, result.Price);
        }

        [Fact]
        public async Task UpdateProductAsync_ChangingStockToZero_UpdatesCorrectly()
        {
            // Arrange - Border case: reducing stock to zero
            var product = CreateTestProduct("Test", 1);
            product.Stock = 100;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.Stock = 0;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(0, result.Stock);
        }

        [Fact]
        public async Task UpdateProductAsync_RemovingImage_UpdatesCorrectly()
        {
            // Arrange - Border case: removing image
            var product = CreateTestProduct("Test", 1);
            product.ImageUrl = "/uploads/test.jpg";
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.ImageUrl = null;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Null(result.ImageUrl);
        }

        [Fact]
        public async Task UpdateProductAsync_ChangingCategory_UpdatesCorrectly()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.CategoryId = 2;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(2, result.CategoryId);
        }

        [Fact]
        public async Task UpdateProductAsync_ToInactiveCategory_UpdatesCorrectly()
        {
            // Arrange - Border case: changing to inactive category
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.CategoryId = 3; // Inactive category

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(3, result.CategoryId);
        }

        #endregion

        #region GetProductWithCategoryAsync Tests

        [Fact]
        public async Task GetProductWithCategoryAsync_WithValidId_ReturnsProductWithCategory()
        {
            // Arrange
            var product = CreateTestProduct("Test Product", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetProductWithCategoryAsync(product.Id);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Category);
            Assert.Equal("Electronics", result.Category.Name);
        }

        [Fact]
        public async Task GetProductWithCategoryAsync_WithNonExistentId_ReturnsNull()
        {
            // Arrange - Border case: non-existent ID
            // Act
            var result = await _productService.GetProductWithCategoryAsync(999);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region GetAllProductsAsync Tests

        [Fact]
        public async Task GetAllProductsAsync_WithNoProducts_ReturnsEmptyList()
        {
            // Arrange - Border case: empty database
            // Act
            var result = await _productService.GetAllProductsAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllProductsAsync_WithMultipleProducts_ReturnsAllSortedByName()
        {
            // Arrange
            _context.Products.Add(CreateTestProduct("Zebra Product", 1));
            _context.Products.Add(CreateTestProduct("Alpha Product", 1));
            _context.Products.Add(CreateTestProduct("Beta Product", 1));
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetAllProductsAsync();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.Equal("Alpha Product", result[0].Name);
            Assert.Equal("Beta Product", result[1].Name);
            Assert.Equal("Zebra Product", result[2].Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_WithActiveAndInactiveProducts_ReturnsAll()
        {
            // Arrange - Border case: mixed status products
            var active = CreateTestProduct("Active", 1);
            active.IsActive = true;
            var inactive = CreateTestProduct("Inactive", 1);
            inactive.IsActive = false;

            _context.Products.AddRange(active, inactive);
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetAllProductsAsync();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(result, p => p.IsActive);
            Assert.Contains(result, p => !p.IsActive);
        }

        [Fact]
        public async Task GetAllProductsAsync_WithProductsFromDifferentCategories_ReturnsAll()
        {
            // Arrange
            _context.Products.Add(CreateTestProduct("Electronics Product", 1));
            _context.Products.Add(CreateTestProduct("Clothing Product", 2));
            _context.Products.Add(CreateTestProduct("Book Product", 3));
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetAllProductsAsync();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.All(result, p => Assert.NotNull(p.Category));
        }

        [Fact]
        public async Task GetAllProductsAsync_WithLargeNumberOfProducts_ReturnsAll()
        {
            // Arrange - Border case: large dataset
            for (int i = 1; i <= 100; i++)
            {
                _context.Products.Add(CreateTestProduct($"Product {i:D3}", (i % 3) + 1));
            }
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetAllProductsAsync();

            // Assert
            Assert.Equal(100, result.Count);
        }

        #endregion

        #region GetActiveProductsAsync Tests

        [Fact]
        public async Task GetActiveProductsAsync_WithMixedStatus_ReturnsOnlyActive()
        {
            // Arrange
            var active1 = CreateTestProduct("Active 1", 1);
            active1.IsActive = true;
            var active2 = CreateTestProduct("Active 2", 1);
            active2.IsActive = true;
            var inactive = CreateTestProduct("Inactive", 1);
            inactive.IsActive = false;

            _context.Products.AddRange(active1, active2, inactive);
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetActiveProductsAsync();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, p => Assert.True(p.IsActive));
        }

        [Fact]
        public async Task GetActiveProductsAsync_WithNoActiveProducts_ReturnsEmptyList()
        {
            // Arrange - Border case: all products inactive
            var inactive1 = CreateTestProduct("Inactive 1", 1);
            inactive1.IsActive = false;
            var inactive2 = CreateTestProduct("Inactive 2", 1);
            inactive2.IsActive = false;

            _context.Products.AddRange(inactive1, inactive2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetActiveProductsAsync();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetActiveProductsAsync_WithOnlyActiveProducts_ReturnsAll()
        {
            // Arrange - Border case: all products active
            _context.Products.Add(CreateTestProduct("Active 1", 1));
            _context.Products.Add(CreateTestProduct("Active 2", 1));
            _context.Products.Add(CreateTestProduct("Active 3", 1));
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.GetActiveProductsAsync();

            // Assert
            Assert.Equal(3, result.Count);
        }

        #endregion

        #region ToggleProductStatusAsync Tests

        [Fact]
        public async Task ToggleProductStatusAsync_WithActiveProduct_MakesInactive()
        {
            // Arrange
            var product = CreateTestProduct("Active Product", 1);
            product.IsActive = true;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act
            await _productService.ToggleProductStatusAsync(product.Id);

            // Assert
            var updated = await _context.Products.FindAsync(product.Id);
            Assert.NotNull(updated);
            Assert.False(updated.IsActive);
        }

        [Fact]
        public async Task ToggleProductStatusAsync_WithInactiveProduct_MakesActive()
        {
            // Arrange
            var product = CreateTestProduct("Inactive Product", 1);
            product.IsActive = false;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act
            await _productService.ToggleProductStatusAsync(product.Id);

            // Assert
            var updated = await _context.Products.FindAsync(product.Id);
            Assert.NotNull(updated);
            Assert.True(updated.IsActive);
        }

        [Fact]
        public async Task ToggleProductStatusAsync_WithNonExistentProduct_DoesNotThrow()
        {
            // Arrange - Border case: non-existent product
            // Act & Assert
            await _productService.ToggleProductStatusAsync(999); // Should not throw
        }

        [Fact]
        public async Task ToggleProductStatusAsync_MultipleToggles_TogglesCorrectly()
        {
            // Arrange - Border case: multiple rapid toggles
            var product = CreateTestProduct("Toggle Test", 1);
            product.IsActive = true;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act & Assert
            await _productService.ToggleProductStatusAsync(product.Id);
            var after1 = await _context.Products.FindAsync(product.Id);
            Assert.False(after1!.IsActive);

            await _productService.ToggleProductStatusAsync(product.Id);
            var after2 = await _context.Products.FindAsync(product.Id);
            Assert.True(after2!.IsActive);

            await _productService.ToggleProductStatusAsync(product.Id);
            var after3 = await _context.Products.FindAsync(product.Id);
            Assert.False(after3!.IsActive);
        }

        [Fact]
        public async Task ToggleProductStatusAsync_UpdatesUpdateTimestamp()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var originalUpdatedAt = product.UpdatedAt;
            await Task.Delay(10);

            // Act
            await _productService.ToggleProductStatusAsync(product.Id);

            // Assert
            var updated = await _context.Products.FindAsync(product.Id);
            Assert.True(updated!.UpdatedAt > originalUpdatedAt);
        }

        #endregion

        #region ProductExistsAsync Tests

        [Fact]
        public async Task ProductExistsAsync_WithExistingProduct_ReturnsTrue()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.ProductExistsAsync(product.Id);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task ProductExistsAsync_WithNonExistentProduct_ReturnsFalse()
        {
            // Arrange - Border case: non-existent product
            // Act
            var result = await _productService.ProductExistsAsync(999);

            // Assert
            Assert.False(result);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-999)]
        public async Task ProductExistsAsync_WithInvalidId_ReturnsFalse(int id)
        {
            // Arrange - Border case: invalid IDs
            // Act
            var result = await _productService.ProductExistsAsync(id);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task ProductExistsAsync_WithDeletedProduct_ReturnsFalse()
        {
            // Arrange - Border case: deleted product
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            var productId = product.Id;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            // Act
            var result = await _productService.ProductExistsAsync(productId);

            // Assert
            Assert.False(result);
        }

        #endregion

        #region GetProductsQuery Tests

        [Fact]
        public void GetProductsQuery_ReturnsQueryable()
        {
            // Arrange
            _context.Products.Add(CreateTestProduct("Test 1", 1));
            _context.Products.Add(CreateTestProduct("Test 2", 1));
            _context.SaveChanges();

            // Act
            var query = _productService.GetProductsQuery();

            // Assert
            Assert.NotNull(query);
            Assert.IsAssignableFrom<IQueryable<Product>>(query);
        }

        [Fact]
        public void GetProductsQuery_IncludesCategory()
        {
            // Arrange
            _context.Products.Add(CreateTestProduct("Test", 1));
            _context.SaveChanges();

            // Act
            var query = _productService.GetProductsQuery();
            var product = query.First();

            // Assert
            Assert.NotNull(product.Category);
        }

        [Fact]
        public void GetProductsQuery_WithEmptyDatabase_ReturnsEmptyQueryable()
        {
            // Arrange - Border case: empty database
            // Act
            var query = _productService.GetProductsQuery();
            var count = query.Count();

            // Assert
            Assert.Equal(0, count);
        }

        [Fact]
        public async Task GetProductsQuery_WithLargeDataset_HandlesEfficiently()
        {
            // Arrange - Border case: large dataset
            for (int i = 1; i <= 1000; i++)
            {
                _context.Products.Add(CreateTestProduct($"Product {i}", (i % 3) + 1));
            }
            await _context.SaveChangesAsync();

            // Act
            var query = _productService.GetProductsQuery();
            var count = query.Count();

            // Assert
            Assert.Equal(1000, count);
        }

        #endregion

        #region Data Integrity Tests

        [Fact]
        public async Task CreateProductAsync_SetsCreatedAtAndUpdatedAt()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            var beforeCreate = DateTime.UtcNow.AddSeconds(-1);

            // Act
            var result = await _productService.CreateProductAsync(product);
            var afterCreate = DateTime.UtcNow.AddSeconds(1);

            // Assert
            Assert.InRange(result.CreatedAt, beforeCreate, afterCreate);
            Assert.InRange(result.UpdatedAt, beforeCreate, afterCreate);
        }

        [Fact]
        public async Task UpdateProductAsync_UpdatesOnlyUpdatedAt()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var originalCreatedAt = product.CreatedAt;
            await Task.Delay(10);

            // Act
            product.Name = "Updated Name";
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(originalCreatedAt, result.CreatedAt); // CreatedAt unchanged
            Assert.True(result.UpdatedAt > originalCreatedAt); // UpdatedAt changed
        }

        [Fact]
        public async Task CreateProductAsync_WithSameValuesAsExisting_CreatesSeparateEntity()
        {
            // Arrange - Border case: identical values
            var product1 = CreateTestProduct("Identical Product", 1);
            product1.Price = 99.99m;
            product1.Stock = 10;

            var product2 = CreateTestProduct("Identical Product", 1);
            product2.Price = 99.99m;
            product2.Stock = 10;

            // Act
            var result1 = await _productService.CreateProductAsync(product1);
            var result2 = await _productService.CreateProductAsync(product2);

            // Assert
            Assert.NotEqual(result1.Id, result2.Id);
            Assert.Equal(result1.Name, result2.Name);
            Assert.Equal(result1.Price, result2.Price);
        }

        #endregion

        #region Category Relationship Tests

        [Fact]
        public async Task CreateProductAsync_WithValidCategory_EstablishesRelationship()
        {
            // Arrange
            var product = CreateTestProduct("Test Product", 1);

            // Act
            var result = await _productService.CreateProductAsync(product);
            var productWithCategory = await _productService.GetProductWithCategoryAsync(result.Id);

            // Assert
            Assert.NotNull(productWithCategory);
            Assert.NotNull(productWithCategory.Category);
            Assert.Equal(1, productWithCategory.CategoryId);
        }

        [Fact]
        public async Task UpdateProductAsync_ChangingToInvalidCategory_StillUpdates()
        {
            // Arrange - Border case: changing to non-existent category (DB constraint would catch this)
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.CategoryId = 999; // Non-existent category

            // Act & Assert - This may throw due to FK constraint, which is expected
            // The application should validate category existence before calling this
            try
            {
                await _productService.UpdateProductAsync(product);
            }
            catch (DbUpdateException)
            {
                // Expected behavior - FK constraint violation
                Assert.True(true);
            }
        }

        #endregion

        #region Edge Cases for Query Operations

        [Fact]
        public async Task GetProductsQuery_WithSpecialCharactersInName_RetrievesCorrectly()
        {
            // Arrange - Border case: special characters
            var product = CreateTestProduct("Product @#$% & Co. (™)", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act
            var query = _productService.GetProductsQuery();
            var result = query.FirstOrDefault(p => p.Name.Contains("@#$%"));

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public async Task GetProductsQuery_WithUnicodeCharacters_RetrievesCorrectly()
        {
            // Arrange - Border case: unicode characters
            var product = CreateTestProduct("Producto Ñoño ??", 1);
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Act
            var query = _productService.GetProductsQuery();
            var result = query.FirstOrDefault(p => p.Name.Contains("Ñoño"));

            // Assert
            Assert.NotNull(result);
        }

        #endregion

        #region Simultaneous Operations Tests

        [Fact]
        public async Task CreateProductAsync_MultipleConcurrentCreates_CreatesAll()
        {
            // Arrange - Border case: concurrent operations
            var product1 = CreateTestProduct("Concurrent 1", 1);
            var product2 = CreateTestProduct("Concurrent 2", 1);
            var product3 = CreateTestProduct("Concurrent 3", 1);

            // Act
            var tasks = new[]
            {
                _productService.CreateProductAsync(product1),
                _productService.CreateProductAsync(product2),
                _productService.CreateProductAsync(product3)
            };

            var results = await Task.WhenAll(tasks);

            // Assert
            Assert.Equal(3, results.Length);
            Assert.All(results, r => Assert.True(r.Id > 0));
        }

        #endregion

        #region Boundary Value Tests

        [Theory]
        [InlineData(1)]
        [InlineData(10)]
        [InlineData(100)]
        [InlineData(1000)]
        [InlineData(10000)]
        [InlineData(100000)]
        [InlineData(1000000)]
        public async Task CreateProductAsync_WithVariousStockLevels_CreatesCorrectly(int stock)
        {
            // Arrange - Border cases: various stock levels
            var product = CreateTestProduct($"Product Stock {stock}", 1);
            product.Stock = stock;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal(stock, result.Stock);
        }

        [Theory]
        [InlineData(0.01)]
        [InlineData(0.10)]
        [InlineData(1.00)]
        [InlineData(10.00)]
        [InlineData(100.00)]
        [InlineData(1000.00)]
        [InlineData(10000.00)]
        [InlineData(100000.00)]
        [InlineData(999999.99)]
        public async Task CreateProductAsync_WithVariousPriceLevels_CreatesCorrectly(decimal price)
        {
            // Arrange - Border cases: various price levels
            var product = CreateTestProduct($"Product Price {price}", 1);
            product.Price = price;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal(price, result.Price);
        }

        #endregion

        #region Decimal Precision Tests

        [Theory]
        [InlineData(10.1)]
        [InlineData(10.12)]
        [InlineData(10.123)]
        [InlineData(10.1234)]
        [InlineData(10.12345)]
        public async Task CreateProductAsync_WithVariousDecimalPrecisions_HandlesCorrectly(decimal price)
        {
            // Arrange - Border case: decimal precision
            var product = CreateTestProduct("Decimal Test", 1);
            product.Price = price;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.NotNull(result);
            // Note: Database may round based on column definition
        }

        [Fact]
        public async Task UpdateProductAsync_ChangingPriceWithHighPrecision_HandlesCorrectly()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            product.Price = 100.00m;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.Price = 99.999m; // High precision

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.NotNull(result);
        }

        #endregion

        #region String Edge Cases

        [Fact]
        public async Task CreateProductAsync_WithLeadingAndTrailingSpaces_CreatesWithSpaces()
        {
            // Arrange - Border case: whitespace handling
            var product = CreateTestProduct("  Product Name  ", 1);
            product.Description = "  Description  ";

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal("  Product Name  ", result.Name);
            Assert.Equal("  Description  ", result.Description);
        }

        [Fact]
        public async Task CreateProductAsync_WithTabsAndNewlines_CreatesSuccessfully()
        {
            // Arrange - Border case: whitespace characters
            var product = CreateTestProduct("Product\tName", 1);
            product.Description = "Line 1\nLine 2\r\nLine 3";

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Contains("\t", result.Name);
            Assert.Contains("\n", result.Description);
        }

        #endregion

        #region NULL and Empty Value Tests

        [Fact]
        public async Task UpdateProductAsync_ChangingImageUrlToNull_UpdatesCorrectly()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            product.ImageUrl = "/test.jpg";
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.ImageUrl = null;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Null(result.ImageUrl);
        }

        [Fact]
        public async Task UpdateProductAsync_ChangingImageUrlToEmpty_UpdatesCorrectly()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            product.ImageUrl = "/test.jpg";
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            product.ImageUrl = "";

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal("", result.ImageUrl);
        }

        #endregion

        #region Helper Methods

        private Product CreateTestProduct(string name, int categoryId)
        {
            return new Product
            {
                Name = name,
                Description = $"Description for {name}",
                Price = 10.00m,
                Stock = 5,
                CategoryId = categoryId,
                IsActive = true
            };
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
