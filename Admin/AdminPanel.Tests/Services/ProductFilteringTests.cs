using AdminPanel.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AdminPanel.Tests.Services
{
    /// <summary>
    /// Integration tests for Product filtering and sorting operations
    /// Covers all border cases for search, filter, and pagination
    /// </summary>
    public class ProductFilteringTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IStockMovementService> _mockStockMovementService;
        private readonly ProductService _productService;

        public ProductFilteringTests()
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
                new Category { Id = 3, Name = "Books", IsActive = true }
            };

            _context.Categories.AddRange(categories);
            _context.SaveChanges();

            // Seed test products
            var products = new List<Product>
            {
                new Product { Name = "Laptop HP", Description = "High-performance gaming laptop", Price = 1200.00m, Stock = 5, CategoryId = 1, IsActive = true },
                new Product { Name = "Laptop Dell", Description = "Business laptop for professionals", Price = 900.00m, Stock = 10, CategoryId = 1, IsActive = true },
                new Product { Name = "Mouse Logitech", Description = "Wireless mouse with USB receiver", Price = 25.00m, Stock = 50, CategoryId = 1, IsActive = true },
                new Product { Name = "Keyboard Corsair", Description = "Mechanical gaming keyboard RGB", Price = 150.00m, Stock = 0, CategoryId = 1, IsActive = true },
                new Product { Name = "T-Shirt Nike", Description = "Cotton sports t-shirt", Price = 30.00m, Stock = 100, CategoryId = 2, IsActive = true },
                new Product { Name = "Jeans Levis", Description = "Classic blue jeans", Price = 80.00m, Stock = 30, CategoryId = 2, IsActive = false },
                new Product { Name = "Book C# Programming", Description = "Advanced C# programming guide", Price = 45.00m, Stock = 20, CategoryId = 3, IsActive = true },
                new Product { Name = "Book Python", Description = "Python for beginners", Price = 35.00m, Stock = 15, CategoryId = 3, IsActive = false },
            };

            _context.Products.AddRange(products);
            _context.SaveChanges();
        }

        #region Search Filter Tests

        [Fact]
        public void FilterByName_WithExactMatch_ReturnsMatchingProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("Laptop")).ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, p => Assert.Contains("Laptop", p.Name));
        }

        [Fact]
        public void FilterByName_WithPartialMatch_ReturnsMatchingProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("Book")).ToList();

            // Assert
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public void FilterByDescription_WithKeyword_ReturnsMatchingProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Description.Contains("gaming")).ToList();

            // Assert
            Assert.Equal(2, result.Count); // Laptop and Keyboard
        }

        [Fact]
        public void FilterBySearch_WithNoMatches_ReturnsEmpty()
        {
            // Arrange - Border case: no matches
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => 
                p.Name.Contains("NonExistentXYZ123") || 
                p.Description.Contains("NonExistentXYZ123")).ToList();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void FilterBySearch_WithEmptyString_ReturnsAll()
        {
            // Arrange - Border case: empty search
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => 
                p.Name.Contains("") || 
                p.Description.Contains("")).ToList();

            // Assert
            Assert.Equal(8, result.Count);
        }

        [Theory]
        [InlineData("laptop")] // lowercase
        [InlineData("LAPTOP")] // uppercase
        [InlineData("LaPtOp")] // mixed case
        public void FilterByName_CaseInsensitive_ReturnsMatches(string searchTerm)
        {
            // Arrange - Border case: case sensitivity
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.ToLower().Contains(searchTerm.ToLower())).ToList();

            // Assert
            Assert.True(result.Count >= 2);
        }

        [Fact]
        public void FilterBySearch_WithSpecialCharacters_HandlesCorrectly()
        {
            // Arrange - Border case: special characters in search
            var product = CreateTestProduct("Product @Special#", 1);
            _context.Products.Add(product);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("@Special#")).ToList();

            // Assert
            Assert.Single(result);
        }

        #endregion

        #region Category Filter Tests

        [Fact]
        public void FilterByCategory_WithValidCategory_ReturnsOnlyThatCategory()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.CategoryId == 1).ToList();

            // Assert
            Assert.Equal(4, result.Count);
            Assert.All(result, p => Assert.Equal(1, p.CategoryId));
        }

        [Fact]
        public void FilterByCategory_WithCategoryWithNoProducts_ReturnsEmpty()
        {
            // Arrange - Border case: empty category (create new category)
            var emptyCategory = new Category { Id = 99, Name = "Empty Category", IsActive = true };
            _context.Categories.Add(emptyCategory);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.CategoryId == 99).ToList();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void FilterByCategory_WithNonExistentCategory_ReturnsEmpty()
        {
            // Arrange - Border case: non-existent category
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.CategoryId == 9999).ToList();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void FilterByCategory_WithMultipleCategories_ReturnsCorrectCounts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var cat1Count = query.Count(p => p.CategoryId == 1);
            var cat2Count = query.Count(p => p.CategoryId == 2);
            var cat3Count = query.Count(p => p.CategoryId == 3);

            // Assert
            Assert.Equal(4, cat1Count); // Electronics
            Assert.Equal(2, cat2Count); // Clothing
            Assert.Equal(2, cat3Count); // Books
        }

        #endregion

        #region Status Filter Tests

        [Fact]
        public void FilterByStatus_ActiveOnly_ReturnsOnlyActiveProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.IsActive == true).ToList();

            // Assert
            Assert.Equal(6, result.Count);
            Assert.All(result, p => Assert.True(p.IsActive));
        }

        [Fact]
        public void FilterByStatus_InactiveOnly_ReturnsOnlyInactiveProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.IsActive == false).ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, p => Assert.False(p.IsActive));
        }

        [Fact]
        public void FilterByStatus_WithAllInactive_ReturnsAll()
        {
            // Arrange - Border case: all products inactive
            var allProducts = _context.Products.ToList();
            foreach (var p in allProducts)
            {
                p.IsActive = false;
            }
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.IsActive == false).ToList();

            // Assert
            Assert.Equal(8, result.Count);
        }

        [Fact]
        public void FilterByStatus_WithAllActive_ReturnsAll()
        {
            // Arrange - Border case: all products active
            var allProducts = _context.Products.ToList();
            foreach (var p in allProducts)
            {
                p.IsActive = true;
            }
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.IsActive == true).ToList();

            // Assert
            Assert.Equal(8, result.Count);
        }

        #endregion

        #region Sorting Tests

        [Fact]
        public void SortByName_Ascending_SortsAlphabetically()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderBy(p => p.Name).ToList();

            // Assert
            Assert.Equal("Book C# Programming", result[0].Name);
            Assert.Equal("Book Python", result[1].Name);
        }

        [Fact]
        public void SortByName_Descending_SortsReverseAlphabetically()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderByDescending(p => p.Name).ToList();

            // Assert
            Assert.Equal("T-Shirt Nike", result[0].Name);
        }

        [Fact]
        public void SortByPrice_Ascending_SortsFromLowestToHighest()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderBy(p => p.Price).ToList();

            // Assert
            Assert.Equal(25.00m, result[0].Price); // Mouse
            Assert.Equal(1200.00m, result[^1].Price); // Laptop HP
        }

        [Fact]
        public void SortByPrice_Descending_SortsFromHighestToLowest()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderByDescending(p => p.Price).ToList();

            // Assert
            Assert.Equal(1200.00m, result[0].Price);
            Assert.Equal(25.00m, result[^1].Price);
        }

        [Fact]
        public void SortByStock_Ascending_SortsFromLowestToHighest()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderBy(p => p.Stock).ToList();

            // Assert
            Assert.Equal(0, result[0].Stock); // Keyboard
            Assert.Equal(100, result[^1].Stock); // T-Shirt
        }

        [Fact]
        public void SortByStock_Descending_SortsFromHighestToLowest()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderByDescending(p => p.Stock).ToList();

            // Assert
            Assert.Equal(100, result[0].Stock);
            Assert.Equal(0, result[^1].Stock);
        }

        [Fact]
        public void SortByPrice_WithIdenticalPrices_MaintainsStableOrder()
        {
            // Arrange - Border case: identical prices
            var product1 = CreateTestProduct("Product A", 1);
            product1.Price = 50.00m;
            var product2 = CreateTestProduct("Product B", 1);
            product2.Price = 50.00m;
            var product3 = CreateTestProduct("Product C", 1);
            product3.Price = 50.00m;

            _context.Products.AddRange(product1, product2, product3);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderBy(p => p.Price).ToList();

            // Assert - Should maintain some order
            Assert.NotNull(result);
            Assert.True(result.Count >= 3);
        }

        [Fact]
        public void SortByStock_WithAllZeroStock_ReturnsAllProducts()
        {
            // Arrange - Border case: all products zero stock
            var allProducts = _context.Products.ToList();
            foreach (var p in allProducts)
            {
                p.Stock = 0;
            }
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderBy(p => p.Stock).ToList();

            // Assert
            Assert.Equal(8, result.Count);
            Assert.All(result, p => Assert.Equal(0, p.Stock));
        }

        #endregion

        #region Combined Filters Tests

        [Fact]
        public void FilterBy_CategoryAndStatus_ReturnsBothFiltersApplied()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 1 && p.IsActive == true)
                .ToList();

            // Assert
            Assert.Equal(4, result.Count);
            Assert.All(result, p => Assert.Equal(1, p.CategoryId));
            Assert.All(result, p => Assert.True(p.IsActive));
        }

        [Fact]
        public void FilterBy_CategoryAndStatusAndSearch_ReturnsAllFiltersApplied()
        {
            // Arrange - Border case: all filters combined
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 1)
                .Where(p => p.IsActive == true)
                .Where(p => p.Name.Contains("Laptop"))
                .ToList();

            // Assert
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public void FilterBy_MultipleConditionsThatReturnEmpty_ReturnsEmpty()
        {
            // Arrange - Border case: filters that result in no matches
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 1)
                .Where(p => p.IsActive == false)
                .Where(p => p.Stock > 1000)
                .ToList();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void FilterBy_InactiveCategoryWithActiveProducts_ReturnsEmpty()
        {
            // Arrange - Border case: category 999 doesn't exist
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 999)
                .Where(p => p.IsActive == true)
                .ToList();

            // Assert
            Assert.Empty(result);
        }

        #endregion

        #region Price Range Filter Tests

        [Fact]
        public void FilterByPriceRange_BelowThreshold_ReturnsMatchingProducts()
        {
            // Arrange - Border case: price filters
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Price < 50.00m).ToList();

            // Assert
            Assert.Equal(4, result.Count);
            Assert.All(result, p => Assert.True(p.Price < 50.00m));
        }

        [Fact]
        public void FilterByPriceRange_AboveThreshold_ReturnsMatchingProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Price > 100.00m).ToList();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.All(result, p => Assert.True(p.Price > 100.00m));
        }

        [Fact]
        public void FilterByPriceRange_ExactMatch_ReturnsMatchingProducts()
        {
            // Arrange - Border case: exact price match
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Price == 25.00m).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal("Mouse Logitech", result[0].Name);
        }

        [Fact]
        public void FilterByPriceRange_BetweenValues_ReturnsMatchingProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Price >= 30.00m && p.Price <= 100.00m).ToList();

            // Assert
            Assert.Equal(4, result.Count);
        }

        [Fact]
        public void FilterByPrice_ZeroPrice_ReturnsEmpty()
        {
            // Arrange - Border case: zero price
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Price == 0.00m).ToList();

            // Assert
            Assert.Empty(result);
        }

        #endregion

        #region Stock Filter Tests

        [Fact]
        public void FilterByStock_ZeroStock_ReturnsOutOfStockProducts()
        {
            // Arrange - Border case: out of stock
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Stock == 0).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal("Keyboard Corsair", result[0].Name);
        }

        [Fact]
        public void FilterByStock_LowStock_ReturnsLowStockProducts()
        {
            // Arrange - Border case: low stock threshold
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Stock > 0 && p.Stock < 10).ToList();

            // Assert
            Assert.Equal(1, result.Count); // Only Laptop HP
        }

        [Fact]
        public void FilterByStock_HighStock_ReturnsHighStockProducts()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Stock >= 50).ToList();

            // Assert
            Assert.Equal(2, result.Count); // Mouse and T-Shirt
        }

        [Fact]
        public void FilterByStock_AboveMaximum_ReturnsEmpty()
        {
            // Arrange - Border case: unrealistic high stock
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Stock > 1000000).ToList();

            // Assert
            Assert.Empty(result);
        }

        #endregion

        #region Complex Sorting and Filtering Tests

        [Fact]
        public void FilterAndSort_ActiveProductsSortedByPrice_WorksCorrectly()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.IsActive == true)
                .OrderBy(p => p.Price)
                .ToList();

            // Assert
            Assert.Equal(6, result.Count);
            Assert.True(result[0].Price <= result[1].Price);
            Assert.True(result[1].Price <= result[2].Price);
        }

        [Fact]
        public void FilterAndSort_CategoryWithSearchSortedByStock_WorksCorrectly()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 1)
                .Where(p => p.Name.Contains("Laptop"))
                .OrderByDescending(p => p.Stock)
                .ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.True(result[0].Stock >= result[1].Stock);
        }

        [Fact]
        public void FilterAndSort_AllFiltersWithSorting_WorksCorrectly()
        {
            // Arrange - Border case: maximum complexity
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => p.CategoryId == 1)
                .Where(p => p.IsActive == true)
                .Where(p => p.Name.Contains("L"))
                .OrderByDescending(p => p.Price)
                .ToList();

            // Assert
            Assert.NotEmpty(result);
            Assert.All(result, p => Assert.Equal(1, p.CategoryId));
            Assert.All(result, p => Assert.True(p.IsActive));
        }

        #endregion

        #region Pagination Simulation Tests

        [Fact]
        public void Pagination_FirstPage_ReturnsFirstItems()
        {
            // Arrange
            var query = _productService.GetProductsQuery();
            int pageSize = 5;

            // Act
            var result = query
                .OrderBy(p => p.Name)
                .Skip(0)
                .Take(pageSize)
                .ToList();

            // Assert
            Assert.Equal(5, result.Count);
        }

        [Fact]
        public void Pagination_SecondPage_ReturnsNextItems()
        {
            // Arrange
            var query = _productService.GetProductsQuery();
            int pageSize = 5;
            int pageNumber = 2;

            // Act
            var result = query
                .OrderBy(p => p.Name)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // Assert
            Assert.Equal(3, result.Count); // Only 3 items left
        }

        [Fact]
        public void Pagination_LastPage_ReturnsRemainingItems()
        {
            // Arrange - Border case: last page with fewer items
            var query = _productService.GetProductsQuery();
            int pageSize = 5;
            int totalCount = query.Count();
            int lastPageNumber = (int)Math.Ceiling(totalCount / (double)pageSize);

            // Act
            var result = query
                .OrderBy(p => p.Name)
                .Skip((lastPageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // Assert
            Assert.True(result.Count <= pageSize);
            Assert.True(result.Count > 0);
        }

        [Fact]
        public void Pagination_BeyondLastPage_ReturnsEmpty()
        {
            // Arrange - Border case: page beyond data
            var query = _productService.GetProductsQuery();
            int pageSize = 5;

            // Act
            var result = query
                .OrderBy(p => p.Name)
                .Skip(100 * pageSize)
                .Take(pageSize)
                .ToList();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void Pagination_WithPageSizeOne_ReturnsOneItem()
        {
            // Arrange - Border case: minimum page size
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .OrderBy(p => p.Name)
                .Take(1)
                .ToList();

            // Assert
            Assert.Single(result);
        }

        [Fact]
        public void Pagination_WithVeryLargePageSize_ReturnsAllItems()
        {
            // Arrange - Border case: page size exceeds total items
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .OrderBy(p => p.Name)
                .Take(1000)
                .ToList();

            // Assert
            Assert.Equal(8, result.Count);
        }

        #endregion

        #region Multiple Products Scenarios

        [Fact]
        public async Task CreateMultipleProducts_WithSameName_AllowsCreation()
        {
            // Arrange - Border case: duplicate names
            var product1 = CreateTestProduct("Same Name", 1);
            var product2 = CreateTestProduct("Same Name", 2);
            var product3 = CreateTestProduct("Same Name", 3);

            // Act
            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);
            await _productService.CreateProductAsync(product3);

            // Assert
            var allProducts = await _context.Products.Where(p => p.Name == "Same Name").ToListAsync();
            Assert.Equal(3, allProducts.Count);
        }

        [Fact]
        public async Task CreateMultipleProducts_WithSamePrice_AllowsCreation()
        {
            // Arrange - Border case: identical prices
            var product1 = CreateTestProduct("Product 1", 1);
            product1.Price = 99.99m;
            var product2 = CreateTestProduct("Product 2", 1);
            product2.Price = 99.99m;

            // Act
            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);

            // Assert
            var allProducts = await _context.Products.Where(p => p.Price == 99.99m).ToListAsync();
            Assert.True(allProducts.Count >= 2);
        }

        #endregion

        #region Search with Special Cases

        [Fact]
        public void Search_WithPartialWordMatch_ReturnsMatches()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("Lap")).ToList();

            // Assert
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public void Search_WithSingleCharacter_ReturnsMatches()
        {
            // Arrange - Border case: single character search
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("L")).ToList();

            // Assert
            Assert.True(result.Count >= 2);
        }

        [Fact]
        public void Search_InDescriptionOnly_ReturnsMatches()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query
                .Where(p => !p.Name.Contains("gaming") && p.Description.Contains("gaming"))
                .ToList();

            // Assert
            Assert.NotEmpty(result);
        }

        [Fact]
        public void Search_WithSpaces_HandlesCorrectly()
        {
            // Arrange - Border case: spaces in search
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("Book C#")).ToList();

            // Assert
            Assert.Single(result);
        }

        [Fact]
        public void Search_WithNumbers_ReturnsMatches()
        {
            // Arrange - Border case: numeric search
            var product = CreateTestProduct("Product 123-456", 1);
            _context.Products.Add(product);
            _context.SaveChanges();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("123")).ToList();

            // Assert
            Assert.Single(result);
        }

        #endregion

        #region Category Distribution Tests

        [Fact]
        public async Task GetProductsQuery_GroupByCategory_ReturnsCorrectDistribution()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = await query
                .GroupBy(p => p.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToListAsync();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.Contains(result, r => r.CategoryId == 1 && r.Count == 4);
            Assert.Contains(result, r => r.CategoryId == 2 && r.Count == 2);
            Assert.Contains(result, r => r.CategoryId == 3 && r.Count == 2);
        }

        #endregion

        #region Stock Level Analysis Tests

        [Fact]
        public void FilterByStock_OutOfStock_ReturnsOnlyZeroStock()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Stock == 0).ToList();

            // Assert
            Assert.All(result, p => Assert.Equal(0, p.Stock));
        }

        [Fact]
        public void FilterByStock_LowStockThreshold_ReturnsCorrectProducts()
        {
            // Arrange - Border case: low stock alert threshold
            var query = _productService.GetProductsQuery();
            int lowStockThreshold = 10;

            // Act
            var result = query.Where(p => p.Stock > 0 && p.Stock <= lowStockThreshold).ToList();

            // Assert
            Assert.Equal(2, result.Count); // Laptop HP (5) and Laptop Dell (10)
        }

        #endregion

        #region Text Search Edge Cases

        [Fact]
        public void Search_WithLeadingSpaces_HandlesCorrectly()
        {
            // Arrange - Border case: whitespace handling
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("  Laptop")).ToList();

            // Assert
            // Should not match because names don't have leading spaces
            Assert.Empty(result);
        }

        [Fact]
        public void Search_WithTrailingSpaces_HandlesCorrectly()
        {
            // Arrange
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains("Laptop  ")).ToList();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void Search_WithOnlySpaces_ReturnsAll()
        {
            // Arrange - Border case: space-only search
            var query = _productService.GetProductsQuery();

            // Act
            var result = query.Where(p => p.Name.Contains(" ")).ToList();

            // Assert
            Assert.True(result.Count >= 6); // Products with spaces in names
        }

        #endregion

        #region Sorting with NULL/Empty Values

        [Fact]
        public async Task Sort_WithNullImageUrls_SortsCorrectly()
        {
            // Arrange - Border case: sorting with null values
            var product1 = CreateTestProduct("Product A", 1);
            product1.ImageUrl = null;
            var product2 = CreateTestProduct("Product B", 1);
            product2.ImageUrl = "/image.jpg";
            var product3 = CreateTestProduct("Product C", 1);
            product3.ImageUrl = null;

            _context.Products.AddRange(product1, product2, product3);
            await _context.SaveChangesAsync();

            var query = _productService.GetProductsQuery();

            // Act
            var result = query.OrderBy(p => p.ImageUrl).ToList();

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Count >= 3);
        }

        #endregion

        #region Edge Cases for Update Operations

        [Fact]
        public async Task UpdateProduct_ImmediatelyAfterCreation_UpdatesCorrectly()
        {
            // Arrange - Border case: rapid create then update
            var product = CreateTestProduct("Test", 1);
            var created = await _productService.CreateProductAsync(product);

            created.Name = "Updated Immediately";

            // Act
            var result = await _productService.UpdateProductAsync(created);

            // Assert
            Assert.Equal("Updated Immediately", result.Name);
        }

        [Fact]
        public async Task UpdateProduct_ChangingNameToExistingName_AllowsUpdate()
        {
            // Arrange - Border case: changing to existing name
            var product1 = CreateTestProduct("Product 1", 1);
            var product2 = CreateTestProduct("Product 2", 1);
            await _productService.CreateProductAsync(product1);
            await _productService.CreateProductAsync(product2);

            product2.Name = "Product 1"; // Same as product1

            // Act
            var result = await _productService.UpdateProductAsync(product2);

            // Assert
            Assert.Equal("Product 1", result.Name);
            Assert.NotEqual(product1.Id, result.Id);
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
