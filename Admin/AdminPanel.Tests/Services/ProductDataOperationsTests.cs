using AdminPanel.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AdminPanel.Tests.Services
{
    /// <summary>
    /// Tests for edge cases in product data operations
    /// Covers concurrency, data integrity, and boundary conditions
    /// </summary>
    public class ProductDataOperationsTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IStockMovementService> _mockStockMovementService;
        private readonly ProductService _productService;

        public ProductDataOperationsTests()
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
                new Category { Id = 1, Name = "Category 1", IsActive = true },
                new Category { Id = 2, Name = "Category 2", IsActive = true }
            };

            _context.Categories.AddRange(categories);
            _context.SaveChanges();
        }

        #region Timestamp Edge Cases

        [Fact]
        public async Task CreateProduct_SetsCreatedAtToUtcNow()
        {
            // Arrange
            var beforeCreate = DateTime.UtcNow.AddSeconds(-1);
            var product = CreateTestProduct("Test", 1);

            // Act
            var result = await _productService.CreateProductAsync(product);
            var afterCreate = DateTime.UtcNow.AddSeconds(1);

            // Assert
            Assert.InRange(result.CreatedAt, beforeCreate, afterCreate);
            Assert.InRange(result.UpdatedAt, beforeCreate, afterCreate);
        }

        [Fact]
        public async Task UpdateProduct_UpdatesOnlyUpdatedAt_NotCreatedAt()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            var created = await _productService.CreateProductAsync(product);
            var originalCreatedAt = created.CreatedAt;

            await Task.Delay(100); // Ensure time difference

            created.Name = "Updated";

            // Act
            var result = await _productService.UpdateProductAsync(created);

            // Assert
            Assert.Equal(originalCreatedAt, result.CreatedAt);
            Assert.True(result.UpdatedAt > originalCreatedAt);
        }

        [Fact]
        public async Task UpdateProduct_MultipleUpdates_UpdatesTimestampEachTime()
        {
            // Arrange - Border case: multiple sequential updates
            var product = CreateTestProduct("Test", 1);
            var created = await _productService.CreateProductAsync(product);

            // Act & Assert
            var firstUpdate = DateTime.MinValue;
            for (int i = 0; i < 3; i++)
            {
                await Task.Delay(50);
                created.Name = $"Update {i}";
                var updated = await _productService.UpdateProductAsync(created);
                Assert.True(updated.UpdatedAt > firstUpdate);
                firstUpdate = updated.UpdatedAt;
            }
        }

        #endregion

        #region Decimal Precision Edge Cases

        [Theory]
        [InlineData(0.01)]
        [InlineData(0.1)]
        [InlineData(0.10)]
        [InlineData(1.00)]
        [InlineData(10.00)]
        [InlineData(10.50)]
        [InlineData(10.99)]
        public async Task CreateProduct_WithVariousDecimalFormats_PreservesValue(decimal price)
        {
            // Arrange - Border case: decimal precision
            var product = CreateTestProduct("Test", 1);
            product.Price = price;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal(price, result.Price);
        }

        [Fact]
        public async Task UpdateProduct_ChangingDecimalPrecision_UpdatesCorrectly()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            product.Price = 10.00m;
            await _productService.CreateProductAsync(product);

            product.Price = 10.10m;
            await _productService.UpdateProductAsync(product);

            product.Price = 10.11m;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(10.11m, result.Price);
        }

        [Fact]
        public async Task CreateProduct_WithTrailingZerosInPrice_StoresCorrectly()
        {
            // Arrange - Border case: trailing zeros
            var product = CreateTestProduct("Test", 1);
            product.Price = 10.10m;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal(10.10m, result.Price);
        }

        #endregion

        #region String Trimming and Formatting

        [Fact]
        public async Task CreateProduct_WithLeadingTrailingSpaces_PreservesSpaces()
        {
            // Arrange - Border case: whitespace preservation
            var product = CreateTestProduct("  Product Name  ", 1);
            product.Description = "  Description  ";

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal("  Product Name  ", result.Name);
            Assert.Equal("  Description  ", result.Description);
        }

        [Fact]
        public async Task UpdateProduct_ChangingFromTrimmedToUntrimmed_UpdatesCorrectly()
        {
            // Arrange
            var product = CreateTestProduct("Product", 1);
            await _productService.CreateProductAsync(product);

            product.Name = "  Product  ";

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal("  Product  ", result.Name);
        }

        #endregion

        #region Boolean Edge Cases

        [Fact]
        public async Task CreateProduct_DefaultIsActiveIsTrue_CreatesActive()
        {
            // Arrange
            var product = new Product
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
                // IsActive not explicitly set, should default to true
            };

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.True(result.IsActive);
        }

        [Fact]
        public async Task UpdateProduct_TogglingIsActiveMultipleTimes_WorksCorrectly()
        {
            // Arrange - Border case: rapid boolean toggles
            var product = CreateTestProduct("Test", 1);
            product.IsActive = true;
            await _productService.CreateProductAsync(product);

            // Act & Assert - Toggle multiple times
            product.IsActive = false;
            var update1 = await _productService.UpdateProductAsync(product);
            Assert.False(update1.IsActive);

            product.IsActive = true;
            var update2 = await _productService.UpdateProductAsync(product);
            Assert.True(update2.IsActive);

            product.IsActive = false;
            var update3 = await _productService.UpdateProductAsync(product);
            Assert.False(update3.IsActive);
        }

        #endregion

        #region Integer Boundary Tests

        [Theory]
        [InlineData(0)]
        [InlineData(1)]
        [InlineData(10)]
        [InlineData(100)]
        [InlineData(1000)]
        [InlineData(10000)]
        [InlineData(100000)]
        [InlineData(1000000)]
        [InlineData(int.MaxValue)]
        public async Task CreateProduct_WithVariousStockValues_CreatesCorrectly(int stock)
        {
            // Arrange - Border case: stock boundary values
            var product = CreateTestProduct($"Stock_{stock}", 1);
            product.Stock = stock;

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal(stock, result.Stock);
        }

        [Fact]
        public async Task UpdateProduct_FromZeroToMaxStock_UpdatesCorrectly()
        {
            // Arrange - Border case: extreme stock change
            var product = CreateTestProduct("Test", 1);
            product.Stock = 0;
            await _productService.CreateProductAsync(product);

            product.Stock = int.MaxValue;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(int.MaxValue, result.Stock);
        }

        [Fact]
        public async Task UpdateProduct_FromMaxToZeroStock_UpdatesCorrectly()
        {
            // Arrange - Border case: extreme stock reduction
            var product = CreateTestProduct("Test", 1);
            product.Stock = int.MaxValue;
            await _productService.CreateProductAsync(product);

            product.Stock = 0;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert
            Assert.Equal(0, result.Stock);
        }

        #endregion

        #region Null Safety Tests

        [Fact]
        public async Task GetProductWithCategory_ProductExists_NeverReturnsNullCategory()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            await _productService.CreateProductAsync(product);

            // Act
            var result = await _productService.GetProductWithCategoryAsync(product.Id);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Category);
        }

        [Fact]
        public async Task GetProductsQuery_WithInclude_LoadsCategoryForAll()
        {
            // Arrange
            await _productService.CreateProductAsync(CreateTestProduct("P1", 1));
            await _productService.CreateProductAsync(CreateTestProduct("P2", 2));

            // Act
            var query = _productService.GetProductsQuery();
            var products = await query.ToListAsync();

            // Assert
            Assert.All(products, p => Assert.NotNull(p.Category));
        }

        #endregion

        #region Data Consistency Tests

        [Fact]
        public async Task CreateProduct_ThenRetrieve_DataMatches()
        {
            // Arrange - Border case: data round-trip
            var product = CreateTestProduct("Test Product", 1);
            product.Price = 123.45m;
            product.Stock = 67;
            product.Description = "Test Description with special chars: @#$%";
            product.ImageUrl = "/uploads/test.jpg";
            product.IsActive = false;

            // Act
            var created = await _productService.CreateProductAsync(product);
            var retrieved = await _productService.GetProductByIdAsync(created.Id);

            // Assert
            Assert.NotNull(retrieved);
            Assert.Equal(created.Name, retrieved.Name);
            Assert.Equal(created.Description, retrieved.Description);
            Assert.Equal(created.Price, retrieved.Price);
            Assert.Equal(created.Stock, retrieved.Stock);
            Assert.Equal(created.CategoryId, retrieved.CategoryId);
            Assert.Equal(created.ImageUrl, retrieved.ImageUrl);
            Assert.Equal(created.IsActive, retrieved.IsActive);
        }

        [Fact]
        public async Task UpdateProduct_ThenRetrieve_ChangesReflected()
        {
            // Arrange
            var product = CreateTestProduct("Original", 1);
            var created = await _productService.CreateProductAsync(product);

            created.Name = "Modified";
            created.Price = 999.99m;
            created.Stock = 100;
            created.CategoryId = 2;
            created.IsActive = false;
            created.ImageUrl = "/new.jpg";

            // Act
            await _productService.UpdateProductAsync(created);
            var retrieved = await _productService.GetProductByIdAsync(created.Id);

            // Assert
            Assert.Equal("Modified", retrieved!.Name);
            Assert.Equal(999.99m, retrieved.Price);
            Assert.Equal(100, retrieved.Stock);
            Assert.Equal(2, retrieved.CategoryId);
            Assert.False(retrieved.IsActive);
            Assert.Equal("/new.jpg", retrieved.ImageUrl);
        }

        #endregion

        #region Enumeration Edge Cases

        [Fact]
        public async Task GetAllProducts_EnumeratingMultipleTimes_ReturnsConsistentResults()
        {
            // Arrange - Border case: multiple enumerations
            await _productService.CreateProductAsync(CreateTestProduct("P1", 1));
            await _productService.CreateProductAsync(CreateTestProduct("P2", 1));

            // Act
            var result1 = await _productService.GetAllProductsAsync();
            var result2 = await _productService.GetAllProductsAsync();
            var result3 = await _productService.GetAllProductsAsync();

            // Assert
            Assert.Equal(result1.Count, result2.Count);
            Assert.Equal(result2.Count, result3.Count);
        }

        [Fact]
        public void GetProductsQuery_EnumeratingMultipleTimes_WorksCorrectly()
        {
            // Arrange
            _context.Products.Add(CreateTestProduct("P1", 1));
            _context.Products.Add(CreateTestProduct("P2", 1));
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var list1 = query.ToList();
            var list2 = query.ToList();
            var list3 = query.ToList();

            // Assert
            Assert.Equal(list1.Count, list2.Count);
            Assert.Equal(list2.Count, list3.Count);
        }

        #endregion

        #region ID Assignment Tests

        [Fact]
        public async Task CreateMultipleProducts_AssignsSequentialIds()
        {
            // Arrange
            var products = new List<Product>
            {
                CreateTestProduct("P1", 1),
                CreateTestProduct("P2", 1),
                CreateTestProduct("P3", 1)
            };

            // Act
            var results = new List<Product>();
            foreach (var product in products)
            {
                results.Add(await _productService.CreateProductAsync(product));
            }

            // Assert
            Assert.True(results[0].Id > 0);
            Assert.True(results[1].Id > results[0].Id);
            Assert.True(results[2].Id > results[1].Id);
        }

        [Fact]
        public async Task CreateProduct_AfterDeletion_AssignsNewId()
        {
            // Arrange - Border case: ID reuse after deletion
            var product1 = CreateTestProduct("Test", 1);
            var created = await _productService.CreateProductAsync(product1);
            var firstId = created.Id;

            _context.Products.Remove(created);
            await _context.SaveChangesAsync();

            var product2 = CreateTestProduct("Test2", 1);

            // Act
            var result = await _productService.CreateProductAsync(product2);

            // Assert
            Assert.NotEqual(firstId, result.Id); // In-memory DB typically assigns new IDs
        }

        #endregion

        #region Query Performance Edge Cases

        [Fact]
        public async Task GetProductsQuery_WithLargeResultSet_Performs()
        {
            // Arrange - Border case: performance with large dataset
            var products = new List<Product>();
            for (int i = 0; i < 1000; i++)
            {
                products.Add(CreateTestProduct($"Product {i}", (i % 2) + 1));
            }
            _context.Products.AddRange(products);
            await _context.SaveChangesAsync();

            // Act
            var startTime = DateTime.UtcNow;
            var query = _productService.GetProductsQuery();
            var result = await query.Take(100).ToListAsync();
            var duration = DateTime.UtcNow - startTime;

            // Assert
            Assert.Equal(100, result.Count);
            Assert.True(duration.TotalSeconds < 5, "Query took too long");
        }

        [Fact]
        public async Task GetProductsQuery_WithComplexFilters_Performs()
        {
            // Arrange - Border case: complex query performance
            for (int i = 0; i < 500; i++)
            {
                _context.Products.Add(CreateTestProduct($"Product {i}", (i % 2) + 1));
            }
            await _context.SaveChangesAsync();

            var query = _productService.GetProductsQuery();

            // Act
            var result = await query
                .Where(p => p.IsActive == true)
                .Where(p => p.Stock > 0)
                .Where(p => p.Price >= 5.00m)
                .Where(p => p.CategoryId == 1)
                .OrderBy(p => p.Name)
                .Take(50)
                .ToListAsync();

            // Assert
            Assert.True(result.Count <= 50);
        }

        #endregion

        #region Update Conflict Scenarios

        [Fact]
        public async Task UpdateProduct_WithStaleData_StillUpdates()
        {
            // Arrange - Border case: potentially stale data
            var product = CreateTestProduct("Original", 1);
            await _productService.CreateProductAsync(product);

            // Simulate another user's update
            var sameProduct = await _context.Products.FindAsync(product.Id);
            sameProduct!.Price = 50.00m;
            await _context.SaveChangesAsync();

            // Now update with "stale" object
            product.Stock = 100;

            // Act
            var result = await _productService.UpdateProductAsync(product);

            // Assert - Last write wins
            Assert.Equal(100, result.Stock);
        }

        #endregion

        #region Mass Operations Tests

        [Fact]
        public async Task CreateManyProducts_InSequence_AllSucceed()
        {
            // Arrange - Border case: bulk creation
            var products = new List<Product>();
            for (int i = 0; i < 100; i++)
            {
                products.Add(CreateTestProduct($"Bulk Product {i}", (i % 2) + 1));
            }

            // Act
            foreach (var product in products)
            {
                await _productService.CreateProductAsync(product);
            }

            // Assert
            var count = await _context.Products.CountAsync();
            Assert.Equal(100, count);
        }

        [Fact]
        public async Task UpdateManyProducts_InSequence_AllSucceed()
        {
            // Arrange
            var products = new List<Product>();
            for (int i = 0; i < 50; i++)
            {
                var p = CreateTestProduct($"Product {i}", 1);
                products.Add(await _productService.CreateProductAsync(p));
            }

            // Act - Update all
            foreach (var product in products)
            {
                product.Price = 99.99m;
                await _productService.UpdateProductAsync(product);
            }

            // Assert
            var allProducts = await _context.Products.ToListAsync();
            Assert.All(allProducts, p => Assert.Equal(99.99m, p.Price));
        }

        #endregion

        #region Delete Scenarios (Soft Delete via IsActive)

        [Fact]
        public async Task SoftDelete_SettingIsActiveToFalse_ProductStillExists()
        {
            // Arrange - Border case: soft delete pattern
            var product = CreateTestProduct("Test", 1);
            await _productService.CreateProductAsync(product);

            product.IsActive = false;

            // Act
            await _productService.UpdateProductAsync(product);

            // Assert
            var exists = await _productService.ProductExistsAsync(product.Id);
            Assert.True(exists);

            var retrieved = await _productService.GetProductByIdAsync(product.Id);
            Assert.NotNull(retrieved);
            Assert.False(retrieved.IsActive);
        }

        [Fact]
        public async Task SoftDelete_MultipleProducts_AllRemainInDatabase()
        {
            // Arrange
            var products = new List<Product>
            {
                CreateTestProduct("P1", 1),
                CreateTestProduct("P2", 1),
                CreateTestProduct("P3", 1)
            };

            foreach (var p in products)
            {
                await _productService.CreateProductAsync(p);
            }

            // Act - "Soft delete" all
            foreach (var p in products)
            {
                p.IsActive = false;
                await _productService.UpdateProductAsync(p);
            }

            // Assert
            var totalCount = await _context.Products.CountAsync();
            var activeCount = await _context.Products.CountAsync(p => p.IsActive);
            var inactiveCount = await _context.Products.CountAsync(p => !p.IsActive);

            Assert.Equal(3, totalCount);
            Assert.Equal(0, activeCount);
            Assert.Equal(3, inactiveCount);
        }

        #endregion

        #region Field Value Transitions

        [Fact]
        public async Task UpdateProduct_AllFieldsTransitions_WorksCorrectly()
        {
            // Arrange - Border case: all possible field transitions
            var product = CreateTestProduct("Test", 1);
            product.Price = 50.00m;
            product.Stock = 10;
            product.IsActive = true;
            product.ImageUrl = "/old.jpg";

            await _productService.CreateProductAsync(product);

            // Act - Transition 1
            product.Price = 0.01m;
            await _productService.UpdateProductAsync(product);

            // Transition 2
            product.Stock = 0;
            await _productService.UpdateProductAsync(product);

            // Transition 3
            product.IsActive = false;
            await _productService.UpdateProductAsync(product);

            // Transition 4
            product.ImageUrl = null;
            await _productService.UpdateProductAsync(product);

            // Transition 5
            product.CategoryId = 2;
            await _productService.UpdateProductAsync(product);

            // Assert
            var final = await _productService.GetProductByIdAsync(product.Id);
            Assert.Equal(0.01m, final!.Price);
            Assert.Equal(0, final.Stock);
            Assert.False(final.IsActive);
            Assert.Null(final.ImageUrl);
            Assert.Equal(2, final.CategoryId);
        }

        #endregion

        #region Query Result Consistency

        [Fact]
        public async Task GetAllProducts_OrderByName_ConsistentAcrossMultipleCalls()
        {
            // Arrange
            await _productService.CreateProductAsync(CreateTestProduct("Zebra", 1));
            await _productService.CreateProductAsync(CreateTestProduct("Apple", 1));
            await _productService.CreateProductAsync(CreateTestProduct("Mango", 1));

            // Act
            var result1 = await _productService.GetAllProductsAsync();
            var result2 = await _productService.GetAllProductsAsync();

            // Assert
            Assert.Equal(result1.Count, result2.Count);
            for (int i = 0; i < result1.Count; i++)
            {
                Assert.Equal(result1[i].Name, result2[i].Name);
            }
        }

        #endregion

        #region Empty State Tests

        [Fact]
        public async Task GetAllProducts_WithNoProducts_ReturnsEmptyList()
        {
            // Arrange - Border case: empty database
            // Act
            var result = await _productService.GetAllProductsAsync();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetActiveProducts_WhenAllInactive_ReturnsEmpty()
        {
            // Arrange - Border case: all products inactive
            var product1 = CreateTestProduct("P1", 1);
            product1.IsActive = false;
            var product2 = CreateTestProduct("P2", 1);
            product2.IsActive = false;

            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);

            // Act
            var result = await _productService.GetActiveProductsAsync();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task ProductExists_InEmptyDatabase_ReturnsFalse()
        {
            // Arrange - Border case: empty database
            // Act
            var result = await _productService.ProductExistsAsync(1);

            // Assert
            Assert.False(result);
        }

        #endregion

        #region Special Character Handling

        [Theory]
        [InlineData("Product's Name")]
        [InlineData("Product \"Quoted\"")]
        [InlineData("Product & Co.")]
        [InlineData("Product <Tag>")]
        [InlineData("Product [Brackets]")]
        [InlineData("Product {Braces}")]
        [InlineData("Product (Parens)")]
        public async Task CreateProduct_WithSpecialCharsInName_CreatesAndRetrievesCorrectly(string name)
        {
            // Arrange - Border case: special characters
            var product = CreateTestProduct(name, 1);

            // Act
            var created = await _productService.CreateProductAsync(product);
            var retrieved = await _productService.GetProductByIdAsync(created.Id);

            // Assert
            Assert.Equal(name, retrieved!.Name);
        }

        [Fact]
        public async Task CreateProduct_WithHtmlInDescription_StoresAsIs()
        {
            // Arrange - Border case: HTML content
            var product = CreateTestProduct("Test", 1);
            product.Description = "<script>alert('test')</script> <b>Bold</b> <i>Italic</i>";

            // Act
            var created = await _productService.CreateProductAsync(product);
            var retrieved = await _productService.GetProductByIdAsync(created.Id);

            // Assert
            Assert.Equal(product.Description, retrieved!.Description);
        }

        [Fact]
        public async Task CreateProduct_WithSqlInjectionAttempt_StoresAsText()
        {
            // Arrange - Border case: SQL injection attempt
            var product = CreateTestProduct("Test' OR '1'='1", 1);
            product.Description = "'; DROP TABLE Products; --";

            // Act
            var created = await _productService.CreateProductAsync(product);
            var retrieved = await _productService.GetProductByIdAsync(created.Id);

            // Assert
            Assert.Equal(product.Name, retrieved!.Name);
            Assert.Equal(product.Description, retrieved.Description);
            Assert.True(await _productService.ProductExistsAsync(created.Id));
        }

        #endregion

        #region Extreme Value Tests

        [Fact]
        public async Task CreateProduct_WithAllMaximumValues_CreatesSuccessfully()
        {
            // Arrange - Border case: all fields at maximum
            var product = new Product
            {
                Name = new string('A', 200),
                Description = new string('D', 50000),
                Price = 999999.99m,
                Stock = int.MaxValue,
                CategoryId = int.MaxValue, // Will fail FK constraint
                IsActive = true,
                ImageUrl = "/uploads/products/" + new string('x', 200) + ".jpg"
            };

            // Act & Assert
            // This should fail due to FK constraint on CategoryId
            // but demonstrates handling of maximum values
            product.CategoryId = 1; // Use valid category
            var result = await _productService.CreateProductAsync(product);

            Assert.Equal(200, result.Name.Length);
            Assert.Equal(999999.99m, result.Price);
            Assert.Equal(int.MaxValue, result.Stock);
        }

        [Fact]
        public async Task CreateProduct_WithAllMinimumValidValues_CreatesSuccessfully()
        {
            // Arrange - Border case: all fields at minimum valid
            var product = new Product
            {
                Name = "A",
                Description = "",
                Price = 0.01m,
                Stock = 0,
                CategoryId = 1,
                IsActive = false,
                ImageUrl = null
            };

            // Act
            var result = await _productService.CreateProductAsync(product);

            // Assert
            Assert.Equal("A", result.Name);
            Assert.Equal(0.01m, result.Price);
            Assert.Equal(0, result.Stock);
            Assert.False(result.IsActive);
            Assert.Null(result.ImageUrl);
        }

        #endregion

        #region State Preservation Tests

        [Fact]
        public async Task UpdateProduct_PreservesUnchangedFields()
        {
            // Arrange - Border case: partial update
            var product = CreateTestProduct("Test", 1);
            product.Price = 100.00m;
            product.Stock = 50;
            product.Description = "Original Description";
            product.ImageUrl = "/original.jpg";

            var created = await _productService.CreateProductAsync(product);

            // Only change name
            created.Name = "Updated Name Only";

            // Act
            var result = await _productService.UpdateProductAsync(created);

            // Assert
            Assert.Equal("Updated Name Only", result.Name);
            Assert.Equal(100.00m, result.Price); // Unchanged
            Assert.Equal(50, result.Stock); // Unchanged
            Assert.Equal("Original Description", result.Description); // Unchanged
            Assert.Equal("/original.jpg", result.ImageUrl); // Unchanged
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
