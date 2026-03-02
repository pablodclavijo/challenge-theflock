using AdminPanel.Data;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AdminPanel.Tests.Services
{
    public class CategoryServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly CategoryService _categoryService;

        public CategoryServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _categoryService = new CategoryService(_context);

            SeedDatabase();
        }

        private void SeedDatabase()
        {
            var categories = new List<Category>
            {
                new Category { Id = 1, Name = "Electronics", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
                new Category { Id = 2, Name = "Clothing", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-20) },
                new Category { Id = 3, Name = "Books", IsActive = false, CreatedAt = DateTime.UtcNow.AddDays(-10) }
            };

            _context.Categories.AddRange(categories);
            _context.SaveChanges();

            var products = new List<Product>
            {
                new Product { Name = "Laptop", Description = "Test", Price = 1000, Stock = 5, CategoryId = 1, IsActive = true },
                new Product { Name = "Mouse", Description = "Test", Price = 25, Stock = 10, CategoryId = 1, IsActive = true },
                new Product { Name = "T-Shirt", Description = "Test", Price = 30, Stock = 20, CategoryId = 2, IsActive = true }
            };

            _context.Products.AddRange(products);
            _context.SaveChanges();
        }

        #region GetCategoryByIdAsync Tests

        [Fact]
        public async Task GetCategoryByIdAsync_WithValidId_ReturnsCategory()
        {
            // Act
            var result = await _categoryService.GetCategoryByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Electronics", result.Name);
            Assert.True(result.IsActive);
        }

        [Fact]
        public async Task GetCategoryByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Act
            var result = await _categoryService.GetCategoryByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region GetCategoryWithProductsAsync Tests

        [Fact]
        public async Task GetCategoryWithProductsAsync_WithValidId_ReturnsCategoryWithProducts()
        {
            // Act
            var result = await _categoryService.GetCategoryWithProductsAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Electronics", result.Name);
            Assert.NotNull(result.Products);
            Assert.Equal(2, result.Products.Count);
        }

        [Fact]
        public async Task GetCategoryWithProductsAsync_WithCategoryWithoutProducts_ReturnsEmptyCollection()
        {
            // Act
            var result = await _categoryService.GetCategoryWithProductsAsync(3);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Books", result.Name);
            Assert.Empty(result.Products);
        }

        [Fact]
        public async Task GetCategoryWithProductsAsync_WithInvalidId_ReturnsNull()
        {
            // Act
            var result = await _categoryService.GetCategoryWithProductsAsync(999);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region GetAllCategoriesAsync Tests

        [Fact]
        public async Task GetAllCategoriesAsync_ReturnsAllCategories()
        {
            // Act
            var result = await _categoryService.GetAllCategoriesAsync();

            // Assert
            Assert.Equal(3, result.Count);
        }

        [Fact]
        public async Task GetAllCategoriesAsync_ReturnsOrderedByName()
        {
            // Act
            var result = await _categoryService.GetAllCategoriesAsync();

            // Assert
            Assert.Equal("Books", result[0].Name);
            Assert.Equal("Clothing", result[1].Name);
            Assert.Equal("Electronics", result[2].Name);
        }

        #endregion

        #region GetActiveCategoriesAsync Tests

        [Fact]
        public async Task GetActiveCategoriesAsync_ReturnsOnlyActiveCategories()
        {
            // Act
            var result = await _categoryService.GetActiveCategoriesAsync();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, c => Assert.True(c.IsActive));
        }

        [Fact]
        public async Task GetActiveCategoriesAsync_WithAllInactive_ReturnsEmpty()
        {
            // Arrange
            foreach (var cat in _context.Categories)
            {
                cat.IsActive = false;
            }
            await _context.SaveChangesAsync();

            // Act
            var result = await _categoryService.GetActiveCategoriesAsync();

            // Assert
            Assert.Empty(result);
        }

        #endregion

        #region GetCategoriesQuery Tests

        [Fact]
        public void GetCategoriesQuery_ReturnsQueryableWithProducts()
        {
            // Act
            var query = _categoryService.GetCategoriesQuery();
            var result = query.ToList();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.All(result, c => Assert.NotNull(c.Products));
        }

        [Fact]
        public void GetCategoriesQuery_CanBeFiltered()
        {
            // Act
            var query = _categoryService.GetCategoriesQuery();
            var result = query.Where(c => c.IsActive).ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, c => Assert.True(c.IsActive));
        }

        [Fact]
        public void GetCategoriesQuery_CanBeSorted()
        {
            // Act
            var query = _categoryService.GetCategoriesQuery();
            var result = query.OrderByDescending(c => c.Name).ToList();

            // Assert
            Assert.Equal("Electronics", result[0].Name);
            Assert.Equal("Clothing", result[1].Name);
            Assert.Equal("Books", result[2].Name);
        }

        [Fact]
        public void GetCategoriesQuery_CanCountProducts()
        {
            // Act
            var query = _categoryService.GetCategoriesQuery();
            var result = query
                .Select(c => new { c.Name, ProductCount = c.Products.Count })
                .ToList();

            // Assert
            Assert.Contains(result, r => r.Name == "Electronics" && r.ProductCount == 2);
            Assert.Contains(result, r => r.Name == "Clothing" && r.ProductCount == 1);
            Assert.Contains(result, r => r.Name == "Books" && r.ProductCount == 0);
        }

        #endregion

        #region CreateCategoryAsync Tests

        [Fact]
        public async Task CreateCategoryAsync_WithValidData_CreatesCategory()
        {
            // Arrange
            var category = new Category
            {
                Name = "New Category",
                IsActive = true
            };

            // Act
            var result = await _categoryService.CreateCategoryAsync(category);

            // Assert
            Assert.NotEqual(0, result.Id);
            Assert.Equal("New Category", result.Name);
            Assert.True(result.IsActive);
            Assert.NotEqual(default(DateTime), result.CreatedAt);
        }

        [Fact]
        public async Task CreateCategoryAsync_SetsCreatedAt()
        {
            // Arrange
            var category = new Category { Name = "Test", IsActive = true };
            var beforeCreate = DateTime.UtcNow;

            // Act
            var result = await _categoryService.CreateCategoryAsync(category);

            // Assert
            Assert.True(result.CreatedAt >= beforeCreate);
            Assert.True(result.CreatedAt <= DateTime.UtcNow);
        }

        [Fact]
        public async Task CreateCategoryAsync_MultipleCategoriesWithSameName_AllowsCreation()
        {
            // Arrange - Border case: duplicate names allowed
            var category1 = new Category { Name = "Duplicate", IsActive = true };
            var category2 = new Category { Name = "Duplicate", IsActive = true };

            // Act
            await _categoryService.CreateCategoryAsync(category1);
            await _categoryService.CreateCategoryAsync(category2);

            // Assert
            var allCategories = await _context.Categories.Where(c => c.Name == "Duplicate").ToListAsync();
            Assert.Equal(2, allCategories.Count);
        }

        #endregion

        #region UpdateCategoryAsync Tests

        [Fact]
        public async Task UpdateCategoryAsync_WithValidData_UpdatesCategory()
        {
            // Arrange
            var category = await _categoryService.GetCategoryByIdAsync(1);
            category!.Name = "Updated Electronics";
            category.IsActive = false;

            // Act
            var result = await _categoryService.UpdateCategoryAsync(category);

            // Assert
            Assert.Equal("Updated Electronics", result.Name);
            Assert.False(result.IsActive);
        }

        [Fact]
        public async Task UpdateCategoryAsync_ChangingStatus_UpdatesCorrectly()
        {
            // Arrange
            var category = await _categoryService.GetCategoryByIdAsync(1);
            category!.IsActive = false;

            // Act
            await _categoryService.UpdateCategoryAsync(category);
            var updated = await _categoryService.GetCategoryByIdAsync(1);

            // Assert
            Assert.False(updated!.IsActive);
        }

        [Fact]
        public async Task UpdateCategoryAsync_WithProducts_UpdatesSuccessfully()
        {
            // Arrange - Border case: update category with products
            var category = await _categoryService.GetCategoryWithProductsAsync(1);
            Assert.NotEmpty(category!.Products);
            
            category.Name = "Updated with Products";

            // Act
            var result = await _categoryService.UpdateCategoryAsync(category);

            // Assert
            Assert.Equal("Updated with Products", result.Name);
        }

        #endregion

        #region DeleteCategoryAsync Tests

        [Fact]
        public async Task DeleteCategoryAsync_WithoutProducts_DeletesSuccessfully()
        {
            // Arrange - Category 3 has no products
            var beforeCount = await _context.Categories.CountAsync();

            // Act
            await _categoryService.DeleteCategoryAsync(3);

            // Assert
            var afterCount = await _context.Categories.CountAsync();
            Assert.Equal(beforeCount - 1, afterCount);
            Assert.Null(await _categoryService.GetCategoryByIdAsync(3));
        }

        [Fact]
        public async Task DeleteCategoryAsync_WithInvalidId_HandlesGracefully()
        {
            // Arrange
            var beforeCount = await _context.Categories.CountAsync();

            // Act
            await _categoryService.DeleteCategoryAsync(999);

            // Assert
            var afterCount = await _context.Categories.CountAsync();
            Assert.Equal(beforeCount, afterCount);
        }

        [Fact]
        public async Task DeleteCategoryAsync_WithProducts_ThrowsException()
        {
            // Arrange - Category 1 has 2 products, should fail due to FK constraint

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _categoryService.DeleteCategoryAsync(1);
            });
        }

        #endregion

        #region GetCategorySelectListAsync Tests

        [Fact]
        public async Task GetCategorySelectListAsync_ReturnsOnlyActiveCategories()
        {
            // Act
            var result = await _categoryService.GetCategorySelectListAsync();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, item => 
            {
                var categoryId = int.Parse(item.Value);
                var category = _context.Categories.Find(categoryId);
                Assert.True(category?.IsActive);
            });
        }

        [Fact]
        public async Task GetCategorySelectListAsync_ReturnsOrderedByName()
        {
            // Act
            var result = await _categoryService.GetCategorySelectListAsync();

            // Assert
            Assert.Equal("Clothing", result[0].Text);
            Assert.Equal("Electronics", result[1].Text);
        }

        [Fact]
        public async Task GetCategorySelectListAsync_WithNoActiveCategories_ReturnsEmpty()
        {
            // Arrange
            foreach (var cat in _context.Categories)
            {
                cat.IsActive = false;
            }
            await _context.SaveChangesAsync();

            // Act
            var result = await _categoryService.GetCategorySelectListAsync();

            // Assert
            Assert.Empty(result);
        }

        #endregion

        #region Filtering and Sorting Tests

        [Fact]
        public void FilterByName_WithPartialMatch_ReturnsMatches()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.Where(c => c.Name.Contains("ing")).ToList();

            // Assert
            Assert.Equal(1, result.Count);
            Assert.Equal("Clothing", result[0].Name);
        }

        [Fact]
        public void FilterByName_CaseInsensitive_ReturnsMatches()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.Where(c => c.Name.ToLower().Contains("electronics".ToLower())).ToList();

            // Assert
            Assert.Single(result);
        }

        [Fact]
        public void FilterByStatus_ActiveOnly_ReturnsActiveCategories()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.Where(c => c.IsActive).ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, c => Assert.True(c.IsActive));
        }

        [Fact]
        public void FilterByStatus_InactiveOnly_ReturnsInactiveCategories()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.Where(c => !c.IsActive).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal("Books", result[0].Name);
        }

        [Fact]
        public void SortByName_Ascending_SortsAlphabetically()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.OrderBy(c => c.Name).ToList();

            // Assert
            Assert.Equal("Books", result[0].Name);
            Assert.Equal("Clothing", result[1].Name);
            Assert.Equal("Electronics", result[2].Name);
        }

        [Fact]
        public void SortByName_Descending_SortsReverseAlphabetically()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.OrderByDescending(c => c.Name).ToList();

            // Assert
            Assert.Equal("Electronics", result[0].Name);
            Assert.Equal("Clothing", result[1].Name);
            Assert.Equal("Books", result[2].Name);
        }

        [Fact]
        public void SortByProductCount_Ascending_SortsCorrectly()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.OrderBy(c => c.Products.Count).ToList();

            // Assert
            Assert.Equal("Books", result[0].Name);
            Assert.Equal(0, result[0].Products.Count);
            Assert.Equal("Electronics", result[2].Name);
            Assert.Equal(2, result[2].Products.Count);
        }

        [Fact]
        public void SortByProductCount_Descending_SortsCorrectly()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.OrderByDescending(c => c.Products.Count).ToList();

            // Assert
            Assert.Equal("Electronics", result[0].Name);
            Assert.Equal(2, result[0].Products.Count);
        }

        [Fact]
        public void SortByDate_Ascending_SortsOldestFirst()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query.OrderBy(c => c.CreatedAt).ToList();

            // Assert
            Assert.Equal("Electronics", result[0].Name);
            Assert.Equal("Books", result[2].Name);
        }

        #endregion

        #region Combined Filtering and Sorting Tests

        [Fact]
        public void FilterAndSort_ActiveCategoriesSortedByName_WorksCorrectly()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToList();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal("Clothing", result[0].Name);
            Assert.Equal("Electronics", result[1].Name);
        }

        [Fact]
        public void FilterByNameAndStatus_ReturnsCorrectResults()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act
            var result = query
                .Where(c => c.Name.Contains("o") && c.IsActive)
                .ToList();

            // Assert
            Assert.Equal(2, result.Count); // Electronics and Clothing
        }

        #endregion

        #region Edge Cases

        [Fact]
        public async Task CreateCategory_WithEmptyProductsList_CreatesSuccessfully()
        {
            // Arrange
            var category = new Category { Name = "Empty Category", IsActive = true };

            // Act
            var result = await _categoryService.CreateCategoryAsync(category);
            var withProducts = await _categoryService.GetCategoryWithProductsAsync(result.Id);

            // Assert
            Assert.Empty(withProducts!.Products);
        }

        [Fact]
        public async Task UpdateCategory_ChangingToInactiveWithProducts_UpdatesSuccessfully()
        {
            // Arrange - Border case: deactivating category with products
            var category = await _categoryService.GetCategoryByIdAsync(1);
            category!.IsActive = false;

            // Act
            await _categoryService.UpdateCategoryAsync(category);
            var updated = await _categoryService.GetCategoryByIdAsync(1);

            // Assert
            Assert.False(updated!.IsActive);
        }

        [Fact]
        public void GetCategoriesQuery_WithSearchAndSort_ReturnsCorrectOrder()
        {
            // Arrange
            var query = _categoryService.GetCategoriesQuery();

            // Act - Search for "o" matches Electronics, Clothing, Books (all contain "o")
            var result = query
                .Where(c => c.Name.Contains("o"))
                .OrderByDescending(c => c.Products.Count)
                .ToList();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.Equal("Electronics", result[0].Name); // 2 products
            Assert.Equal("Clothing", result[1].Name); // 1 product
            Assert.Equal("Books", result[2].Name); // 0 products
        }

        [Fact]
        public async Task CreateMultipleCategories_InRapidSuccession_AllCreateSuccessfully()
        {
            // Arrange
            var categories = Enumerable.Range(1, 5)
                .Select(i => new Category { Name = $"Category {i}", IsActive = true })
                .ToList();

            // Act
            foreach (var category in categories)
            {
                await _categoryService.CreateCategoryAsync(category);
            }

            // Assert
            var allCategories = await _categoryService.GetAllCategoriesAsync();
            Assert.Equal(8, allCategories.Count);
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
