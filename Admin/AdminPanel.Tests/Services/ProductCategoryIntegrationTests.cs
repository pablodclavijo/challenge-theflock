using AdminPanel.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Rendering;
using Xunit;

namespace AdminPanel.Tests.Services
{
    /// <summary>
    /// Integration tests for product-category relationship
    /// Covers border cases for category filtering and assignment
    /// </summary>
    public class ProductCategoryIntegrationTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IStockMovementService> _mockStockMovementService;
        private readonly ProductService _productService;

        public ProductCategoryIntegrationTests()
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
                new Category { Id = 1, Name = "Active Category 1", IsActive = true },
                new Category { Id = 2, Name = "Active Category 2", IsActive = true },
                new Category { Id = 3, Name = "Inactive Category", IsActive = false }
            };

            _context.Categories.AddRange(categories);
            _context.SaveChanges();
        }

        #region Product Creation with Category Tests

        [Fact]
        public async Task CreateProduct_WithActiveCategory_CreatesSuccessfully()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);

            // Act
            var result = await _productService.CreateProductAsync(product);
            var productWithCategory = await _productService.GetProductWithCategoryAsync(result.Id);

            // Assert
            Assert.NotNull(productWithCategory);
            Assert.NotNull(productWithCategory.Category);
            Assert.Equal("Active Category 1", productWithCategory.Category.Name);
            Assert.True(productWithCategory.Category.IsActive);
        }

        [Fact]
        public async Task CreateProduct_WithInactiveCategory_CreatesSuccessfully()
        {
            // Arrange - Border case: creating product in inactive category
            var product = CreateTestProduct("Test", 3);

            // Act
            var result = await _productService.CreateProductAsync(product);
            var productWithCategory = await _productService.GetProductWithCategoryAsync(result.Id);

            // Assert
            Assert.NotNull(productWithCategory);
            Assert.NotNull(productWithCategory.Category);
            Assert.False(productWithCategory.Category.IsActive);
        }

        [Fact]
        public async Task CreateMultipleProducts_InSameCategory_AllLinkCorrectly()
        {
            // Arrange - Border case: multiple products in one category
            var product1 = CreateTestProduct("Product 1", 1);
            var product2 = CreateTestProduct("Product 2", 1);
            var product3 = CreateTestProduct("Product 3", 1);

            // Act
            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);
            await _productService.CreateProductAsync(product3);

            // Assert
            var productsInCategory = await _context.Products
                .Where(p => p.CategoryId == 1)
                .ToListAsync();
            Assert.Equal(3, productsInCategory.Count);
        }

        [Fact]
        public async Task CreateProduct_WithEachCategory_DistributesCorrectly()
        {
            // Arrange - Border case: distribution across categories
            var product1 = CreateTestProduct("Product 1", 1);
            var product2 = CreateTestProduct("Product 2", 2);
            var product3 = CreateTestProduct("Product 3", 3);

            // Act
            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);
            await _productService.CreateProductAsync(product3);

            // Assert
            Assert.Single(await _context.Products.Where(p => p.CategoryId == 1).ToListAsync());
            Assert.Single(await _context.Products.Where(p => p.CategoryId == 2).ToListAsync());
            Assert.Single(await _context.Products.Where(p => p.CategoryId == 3).ToListAsync());
        }

        #endregion

        #region Update Category Tests

        [Fact]
        public async Task UpdateProduct_ChangingCategory_UpdatesRelationship()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            await _productService.CreateProductAsync(product);

            product.CategoryId = 2;

            // Act
            await _productService.UpdateProductAsync(product);
            var updated = await _productService.GetProductWithCategoryAsync(product.Id);

            // Assert
            Assert.NotNull(updated);
            Assert.Equal(2, updated.CategoryId);
            Assert.Equal("Active Category 2", updated.Category.Name);
        }

        [Fact]
        public async Task UpdateProduct_FromActiveCategoryToInactive_UpdatesSuccessfully()
        {
            // Arrange - Border case: moving to inactive category
            var product = CreateTestProduct("Test", 1);
            await _productService.CreateProductAsync(product);

            product.CategoryId = 3; // Inactive category

            // Act
            await _productService.UpdateProductAsync(product);
            var updated = await _productService.GetProductWithCategoryAsync(product.Id);

            // Assert
            Assert.Equal(3, updated!.CategoryId);
            Assert.False(updated.Category.IsActive);
        }

        [Fact]
        public async Task UpdateMultipleProducts_ToSameCategory_AllUpdateCorrectly()
        {
            // Arrange - Border case: bulk category change
            var product1 = CreateTestProduct("Product 1", 1);
            var product2 = CreateTestProduct("Product 2", 2);
            var product3 = CreateTestProduct("Product 3", 3);

            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);
            await _productService.CreateProductAsync(product3);

            product1.CategoryId = 2;
            product2.CategoryId = 2;
            product3.CategoryId = 2;

            // Act
            await _productService.UpdateProductAsync(product1);
            await _productService.UpdateProductAsync(product2);
            await _productService.UpdateProductAsync(product3);

            // Assert
            var productsInCategory2 = await _context.Products
                .Where(p => p.CategoryId == 2)
                .ToListAsync();
            Assert.Equal(3, productsInCategory2.Count);
        }

        #endregion

        #region Category Filter with Active/Inactive Tests

        [Fact]
        public void FilterByCategoryAndStatus_ActiveProductsInActiveCategory_ReturnsCorrect()
        {
            // Arrange
            var activeProduct = CreateTestProduct("Active in Active", 1);
            activeProduct.IsActive = true;
            _context.Products.Add(activeProduct);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 1 && p.IsActive == true)
                .ToList();

            // Assert
            Assert.Single(result);
            Assert.True(result[0].IsActive);
            Assert.True(result[0].Category.IsActive);
        }

        [Fact]
        public void FilterByCategoryAndStatus_InactiveProductsInActiveCategory_ReturnsCorrect()
        {
            // Arrange - Border case: inactive products in active category
            var inactiveProduct = CreateTestProduct("Inactive in Active", 1);
            inactiveProduct.IsActive = false;
            _context.Products.Add(inactiveProduct);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 1 && p.IsActive == false)
                .ToList();

            // Assert
            Assert.Single(result);
            Assert.False(result[0].IsActive);
            Assert.True(result[0].Category.IsActive);
        }

        [Fact]
        public void FilterByCategoryAndStatus_ActiveProductsInInactiveCategory_ReturnsCorrect()
        {
            // Arrange - Border case: active products in inactive category
            var product = CreateTestProduct("Active in Inactive", 3);
            product.IsActive = true;
            _context.Products.Add(product);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 3 && p.IsActive == true)
                .ToList();

            // Assert
            Assert.Single(result);
            Assert.True(result[0].IsActive);
            Assert.False(result[0].Category.IsActive);
        }

        [Fact]
        public void FilterByCategoryAndStatus_InactiveProductsInInactiveCategory_ReturnsCorrect()
        {
            // Arrange - Border case: both inactive
            var product = CreateTestProduct("Inactive in Inactive", 3);
            product.IsActive = false;
            _context.Products.Add(product);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 3 && p.IsActive == false)
                .ToList();

            // Assert
            Assert.Single(result);
            Assert.False(result[0].IsActive);
            Assert.False(result[0].Category.IsActive);
        }

        #endregion

        #region Category Count Tests

        [Fact]
        public async Task GetProductsPerCategory_WithVariousDistributions_CalculatesCorrectly()
        {
            // Arrange - Border case: uneven distribution
            for (int i = 0; i < 10; i++) await _productService.CreateProductAsync(CreateTestProduct($"Cat1_{i}", 1));
            for (int i = 0; i < 5; i++) await _productService.CreateProductAsync(CreateTestProduct($"Cat2_{i}", 2));
            for (int i = 0; i < 2; i++) await _productService.CreateProductAsync(CreateTestProduct($"Cat3_{i}", 3));

            var query = _productService.GetProductsQuery();

            // Act
            var counts = await query
                .GroupBy(p => p.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToListAsync();

            // Assert
            Assert.Equal(3, counts.Count);
            Assert.Contains(counts, c => c.CategoryId == 1 && c.Count == 10);
            Assert.Contains(counts, c => c.CategoryId == 2 && c.Count == 5);
            Assert.Contains(counts, c => c.CategoryId == 3 && c.Count == 2);
        }

        [Fact]
        public async Task GetProductsPerCategory_WithEmptyCategory_ReturnsZeroCount()
        {
            // Arrange - Border case: empty category
            var emptyCategory = new Category { Id = 99, Name = "Empty", IsActive = true };
            _context.Categories.Add(emptyCategory);
            await _context.SaveChangesAsync();

            var query = _productService.GetProductsQuery();

            // Act
            var count = await query.CountAsync(p => p.CategoryId == 99);

            // Assert
            Assert.Equal(0, count);
        }

        #endregion

        #region Products Query with Category Include Tests

        [Fact]
        public void GetProductsQuery_IncludesCategory_ForAllProducts()
        {
            // Arrange
            _context.Products.Add(CreateTestProduct("Test 1", 1));
            _context.Products.Add(CreateTestProduct("Test 2", 2));
            _context.SaveChanges();

            // Act
            var query = _productService.GetProductsQuery();
            var products = query.ToList();

            // Assert
            Assert.All(products, p => Assert.NotNull(p.Category));
        }

        [Fact]
        public void GetProductsQuery_Category_HasCorrectProperties()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            _context.Products.Add(product);
            _context.SaveChanges();

            // Act
            var query = _productService.GetProductsQuery();
            var result = query.First();

            // Assert
            Assert.Equal(1, result.Category.Id);
            Assert.Equal("Active Category 1", result.Category.Name);
            Assert.True(result.Category.IsActive);
        }

        #endregion

        #region Edge Cases for Category Changes

        [Fact]
        public async Task UpdateProduct_ImmediatelyChangingCategory_UpdatesCorrectly()
        {
            // Arrange - Border case: rapid category change
            var product = CreateTestProduct("Test", 1);
            await _productService.CreateProductAsync(product);

            product.CategoryId = 2;
            await _productService.UpdateProductAsync(product);

            product.CategoryId = 3;

            // Act
            await _productService.UpdateProductAsync(product);

            // Assert
            var updated = await _productService.GetProductWithCategoryAsync(product.Id);
            Assert.Equal(3, updated!.CategoryId);
        }

        [Fact]
        public async Task FilterByCategory_AfterUpdatingProductCategory_ReflectsChange()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            await _productService.CreateProductAsync(product);

            // Verify initial category
            var initialQuery = _productService.GetProductsQuery();
            var initialInCat1 = initialQuery.Count(p => p.CategoryId == 1);
            Assert.Equal(1, initialInCat1);

            // Update category
            product.CategoryId = 2;
            await _productService.UpdateProductAsync(product);

            // Act
            var updatedQuery = _productService.GetProductsQuery();
            var nowInCat1 = updatedQuery.Count(p => p.CategoryId == 1);
            var nowInCat2 = updatedQuery.Count(p => p.CategoryId == 2);

            // Assert
            Assert.Equal(0, nowInCat1);
            Assert.Equal(1, nowInCat2);
        }

        #endregion

        #region Multiple Category Operations

        [Fact]
        public async Task GetAllProducts_GroupedByCategory_HandlesCorrectly()
        {
            // Arrange
            await _productService.CreateProductAsync(CreateTestProduct("P1", 1));
            await _productService.CreateProductAsync(CreateTestProduct("P2", 1));
            await _productService.CreateProductAsync(CreateTestProduct("P3", 2));

            // Act
            var query = _productService.GetProductsQuery();
            var grouped = await query
                .GroupBy(p => p.Category.Name)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToListAsync();

            // Assert
            Assert.Contains(grouped, g => g.Category == "Active Category 1" && g.Count == 2);
            Assert.Contains(grouped, g => g.Category == "Active Category 2" && g.Count == 1);
        }

        #endregion

        #region Category Status and Product Status Combinations

        [Fact]
        public async Task Filter_ActiveProductInActiveCategory_ReturnsProduct()
        {
            // Arrange
            var product = CreateTestProduct("Test", 1);
            product.IsActive = true;
            await _productService.CreateProductAsync(product);

            // Act
            var query = _productService.GetProductsQuery();
            var result = await query
                .Where(p => p.IsActive == true && p.Category.IsActive == true)
                .ToListAsync();

            // Assert
            Assert.Single(result);
        }

        [Fact]
        public async Task Filter_InactiveProductInActiveCategory_ReturnsProduct()
        {
            // Arrange - Border case: product inactive, category active
            var product = CreateTestProduct("Test", 1);
            product.IsActive = false;
            await _productService.CreateProductAsync(product);

            // Act
            var query = _productService.GetProductsQuery();
            var result = await query
                .Where(p => p.IsActive == false && p.Category.IsActive == true)
                .ToListAsync();

            // Assert
            Assert.Single(result);
        }

        [Fact]
        public async Task Filter_ActiveProductInInactiveCategory_ReturnsProduct()
        {
            // Arrange - Border case: product active, category inactive
            var product = CreateTestProduct("Test", 3);
            product.IsActive = true;
            await _productService.CreateProductAsync(product);

            // Act
            var query = _productService.GetProductsQuery();
            var result = await query
                .Where(p => p.IsActive == true && p.Category.IsActive == false)
                .ToListAsync();

            // Assert
            Assert.Single(result);
        }

        [Fact]
        public async Task Filter_InactiveProductInInactiveCategory_ReturnsProduct()
        {
            // Arrange - Border case: both inactive
            var product = CreateTestProduct("Test", 3);
            product.IsActive = false;
            await _productService.CreateProductAsync(product);

            // Act
            var query = _productService.GetProductsQuery();
            var result = await query
                .Where(p => p.IsActive == false && p.Category.IsActive == false)
                .ToListAsync();

            // Assert
            Assert.Single(result);
        }

        #endregion

        #region Category Selection Border Cases

        [Fact]
        public void FilterByMultipleCategories_ReturnsAllMatches()
        {
            // Arrange
            _context.Products.Add(CreateTestProduct("P1", 1));
            _context.Products.Add(CreateTestProduct("P2", 2));
            _context.Products.Add(CreateTestProduct("P3", 3));
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();
            var categoryIds = new[] { 1, 2 };

            // Act
            var result = query.Where(p => categoryIds.Contains(p.CategoryId)).ToList();

            // Assert
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public void FilterByCategory_WithNoProductsInCategory_ReturnsEmpty()
        {
            // Arrange - Border case: category exists but no products
            var emptyCategory = new Category { Id = 99, Name = "Empty", IsActive = true };
            _context.Categories.Add(emptyCategory);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.CategoryId == 99).ToList();

            // Assert
            Assert.Empty(result);
        }

        #endregion

        #region Sorting with Category Tests

        [Fact]
        public async Task SortByCategoryName_ThenByProductName_WorksCorrectly()
        {
            // Arrange
            await _productService.CreateProductAsync(CreateTestProduct("Z Product", 1));
            await _productService.CreateProductAsync(CreateTestProduct("A Product", 2));
            await _productService.CreateProductAsync(CreateTestProduct("M Product", 1));

            var query = _productService.GetProductsQuery();

            // Act
            var result = await query
                .OrderBy(p => p.Category.Name)
                .ThenBy(p => p.Name)
                .ToListAsync();

            // Assert
            Assert.Equal(3, result.Count);
            // First two should be from Category 1 (Active Category 1)
            Assert.Equal(1, result[0].CategoryId);
            Assert.Equal(1, result[1].CategoryId);
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
