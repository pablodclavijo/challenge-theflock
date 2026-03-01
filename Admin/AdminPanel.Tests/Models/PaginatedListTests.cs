using Xunit;

namespace AdminPanel.Tests.Models
{
    /// <summary>
    /// Tests for PaginatedList functionality
    /// Covers all border cases for pagination logic
    /// </summary>
    public class PaginatedListTests
    {
        #region Constructor Tests

        [Fact]
        public void Constructor_WithValidParameters_CreatesPaginatedList()
        {
            // Arrange
            var items = new List<Product> { new Product { Id = 1, Name = "Test" } };

            // Act
            var result = new PaginatedList<Product>(items, 10, 1, 5);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Equal(1, result.PageIndex);
            Assert.Equal(2, result.TotalPages); // 10 items / 5 per page = 2 pages
            Assert.Equal(10, result.TotalCount);
        }

        [Fact]
        public void Constructor_WithEmptyList_CreatesEmptyPaginatedList()
        {
            // Arrange - Border case: empty list
            var items = new List<Product>();

            // Act
            var result = new PaginatedList<Product>(items, 0, 1, 5);

            // Assert
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
            Assert.Equal(0, result.TotalPages);
        }

        [Fact]
        public void Constructor_WithSingleItem_CalculatesCorrectly()
        {
            // Arrange - Border case: single item
            var items = new List<Product> { new Product { Id = 1, Name = "Test" } };

            // Act
            var result = new PaginatedList<Product>(items, 1, 1, 10);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal(1, result.TotalPages);
            Assert.Equal(1, result.TotalCount);
        }

        [Fact]
        public void Constructor_WithExactMultipleOfPageSize_CalculatesCorrectly()
        {
            // Arrange - Border case: exact multiple
            var items = new List<Product> { new Product { Id = 1 }, new Product { Id = 2 } };

            // Act
            var result = new PaginatedList<Product>(items, 10, 1, 5);

            // Assert
            Assert.Equal(2, result.TotalPages); // 10 / 5 = 2 exactly
        }

        [Fact]
        public void Constructor_WithNonMultipleOfPageSize_RoundsUpPages()
        {
            // Arrange - Border case: requires rounding
            var items = new List<Product>();

            // Act
            var result = new PaginatedList<Product>(items, 11, 1, 5);

            // Assert
            Assert.Equal(3, result.TotalPages); // 11 / 5 = 2.2 ? rounds to 3
        }

        [Theory]
        [InlineData(1, 5, 1)]
        [InlineData(4, 5, 1)]
        [InlineData(5, 5, 1)]
        [InlineData(6, 5, 2)]
        [InlineData(10, 5, 2)]
        [InlineData(11, 5, 3)]
        public void Constructor_CalculatesTotalPages_Correctly(int totalCount, int pageSize, int expectedPages)
        {
            // Arrange - Border case: various page calculations
            var items = new List<Product>();

            // Act
            var result = new PaginatedList<Product>(items, totalCount, 1, pageSize);

            // Assert
            Assert.Equal(expectedPages, result.TotalPages);
        }

        #endregion

        #region HasPreviousPage Tests

        [Fact]
        public void HasPreviousPage_OnFirstPage_ReturnsFalse()
        {
            // Arrange - Border case: first page
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 10, 1, 5);

            // Act & Assert
            Assert.False(result.HasPreviousPage);
        }

        [Fact]
        public void HasPreviousPage_OnSecondPage_ReturnsTrue()
        {
            // Arrange
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 10, 2, 5);

            // Act & Assert
            Assert.True(result.HasPreviousPage);
        }

        [Fact]
        public void HasPreviousPage_OnLastPage_ReturnsTrue()
        {
            // Arrange
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 10, 2, 5);

            // Act & Assert
            Assert.True(result.HasPreviousPage);
        }

        #endregion

        #region HasNextPage Tests

        [Fact]
        public void HasNextPage_OnFirstPageOfTwo_ReturnsTrue()
        {
            // Arrange
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 10, 1, 5);

            // Act & Assert
            Assert.True(result.HasNextPage);
        }

        [Fact]
        public void HasNextPage_OnLastPage_ReturnsFalse()
        {
            // Arrange - Border case: last page
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 10, 2, 5);

            // Act & Assert
            Assert.False(result.HasNextPage);
        }

        [Fact]
        public void HasNextPage_OnSinglePage_ReturnsFalse()
        {
            // Arrange - Border case: only one page
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 5, 1, 10);

            // Act & Assert
            Assert.False(result.HasNextPage);
        }

        #endregion

        #region Create Method Tests

        [Fact]
        public void Create_WithValidQuery_CreatesPaginatedList()
        {
            // Arrange
            var products = GetTestProducts(20);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 10);

            // Assert
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(2, result.TotalPages);
            Assert.Equal(20, result.TotalCount);
        }

        [Fact]
        public void Create_WithEmptyQuery_CreatesEmptyPaginatedList()
        {
            // Arrange - Border case: empty query
            var products = new List<Product>();
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 10);

            // Assert
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalPages);
            Assert.Equal(0, result.TotalCount);
        }

        [Fact]
        public void Create_WithPageIndexZero_HandlesGracefully()
        {
            // Arrange - Border case: zero page index
            var products = GetTestProducts(20);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 0, 10);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.PageIndex);
        }

        [Fact]
        public void Create_WithNegativePageIndex_HandlesGracefully()
        {
            // Arrange - Border case: negative page index
            var products = GetTestProducts(20);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, -1, 10);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(-1, result.PageIndex);
        }

        [Fact]
        public void Create_WithPageIndexExceedingTotal_ReturnsEmptyItems()
        {
            // Arrange - Border case: page beyond data
            var products = GetTestProducts(5);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 10, 5);

            // Assert
            Assert.Empty(result.Items);
            Assert.Equal(1, result.TotalPages);
            Assert.Equal(5, result.TotalCount);
        }

        [Theory]
        [InlineData(1)]
        [InlineData(5)]
        [InlineData(10)]
        [InlineData(25)]
        [InlineData(50)]
        [InlineData(100)]
        public void Create_WithVariousPageSizes_WorksCorrectly(int pageSize)
        {
            // Arrange - Border case: various page sizes
            var products = GetTestProducts(100);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, pageSize);

            // Assert
            Assert.True(result.Items.Count <= pageSize);
            Assert.Equal(100, result.TotalCount);
        }

        [Fact]
        public void Create_WithPageSizeLargerThanTotal_ReturnsAllItems()
        {
            // Arrange - Border case: page size exceeds total
            var products = GetTestProducts(5);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 100);

            // Assert
            Assert.Equal(5, result.Items.Count);
            Assert.Equal(1, result.TotalPages);
        }

        [Fact]
        public void Create_LastPageWithFewerItems_ReturnsRemainingItems()
        {
            // Arrange - Border case: partial last page
            var products = GetTestProducts(13);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 3, 5);

            // Assert
            Assert.Equal(3, result.Items.Count); // 13 total: page1=5, page2=5, page3=3
            Assert.Equal(3, result.TotalPages);
        }

        [Fact]
        public void Create_WithSingleItemPerPage_WorksCorrectly()
        {
            // Arrange - Border case: minimum page size
            var products = GetTestProducts(5);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 3, 1);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal(5, result.TotalPages);
            Assert.Equal(3, result.PageIndex);
        }

        #endregion

        #region Navigation Properties Tests

        [Fact]
        public void HasPreviousPage_AndHasNextPage_OnMiddlePage_BothTrue()
        {
            // Arrange - Border case: middle page
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 30, 2, 10);

            // Act & Assert
            Assert.True(result.HasPreviousPage);
            Assert.True(result.HasNextPage);
        }

        [Fact]
        public void HasPreviousPage_AndHasNextPage_OnFirstPage_CorrectValues()
        {
            // Arrange - Border case: first page of multiple
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 20, 1, 10);

            // Act & Assert
            Assert.False(result.HasPreviousPage);
            Assert.True(result.HasNextPage);
        }

        [Fact]
        public void HasPreviousPage_AndHasNextPage_OnLastPage_CorrectValues()
        {
            // Arrange - Border case: last page
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 20, 2, 10);

            // Act & Assert
            Assert.True(result.HasPreviousPage);
            Assert.False(result.HasNextPage);
        }

        [Fact]
        public void HasPreviousPage_AndHasNextPage_OnOnlyPage_BothFalse()
        {
            // Arrange - Border case: single page only
            var items = new List<Product>();
            var result = new PaginatedList<Product>(items, 5, 1, 10);

            // Act & Assert
            Assert.False(result.HasPreviousPage);
            Assert.False(result.HasNextPage);
        }

        #endregion

        #region Edge Cases for Page Calculations

        [Fact]
        public void TotalPages_WithZeroItems_ReturnsZero()
        {
            // Arrange - Border case: no items
            var items = new List<Product>();

            // Act
            var result = new PaginatedList<Product>(items, 0, 1, 10);

            // Assert
            Assert.Equal(0, result.TotalPages);
        }

        [Fact]
        public void TotalPages_WithOneItem_ReturnsOne()
        {
            // Arrange - Border case: single item
            var items = new List<Product> { new Product() };

            // Act
            var result = new PaginatedList<Product>(items, 1, 1, 10);

            // Assert
            Assert.Equal(1, result.TotalPages);
        }

        [Theory]
        [InlineData(10, 10, 1)]
        [InlineData(11, 10, 2)]
        [InlineData(20, 10, 2)]
        [InlineData(21, 10, 3)]
        [InlineData(100, 10, 10)]
        [InlineData(101, 10, 11)]
        public void TotalPages_WithVariousCounts_CalculatesCorrectly(int totalCount, int pageSize, int expectedPages)
        {
            // Arrange - Border case: various pagination scenarios
            var items = new List<Product>();

            // Act
            var result = new PaginatedList<Product>(items, totalCount, 1, pageSize);

            // Assert
            Assert.Equal(expectedPages, result.TotalPages);
        }

        #endregion

        #region Synchronous Create Tests

        [Fact]
        public void Create_Synchronous_WorksCorrectly()
        {
            // Arrange
            var products = GetTestProducts(25);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 2, 10);

            // Assert
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(3, result.TotalPages);
            Assert.Equal(25, result.TotalCount);
            Assert.Equal(2, result.PageIndex);
        }

        [Fact]
        public void Create_Synchronous_WithEmptyQuery_CreatesEmptyList()
        {
            // Arrange - Border case: empty query
            var products = new List<Product>();
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 10);

            // Assert
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalPages);
        }

        #endregion

        #region Large Dataset Tests

        [Fact]
        public void Create_WithLargeDataset_PaginatesCorrectly()
        {
            // Arrange - Border case: large dataset
            var products = GetTestProducts(1000);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 50, 10);

            // Assert
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(100, result.TotalPages);
            Assert.Equal(1000, result.TotalCount);
        }

        [Fact]
        public void Create_LastPageOfLargeDataset_ReturnsCorrectItems()
        {
            // Arrange - Border case: last page of large dataset
            var products = GetTestProducts(95);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 10, 10);

            // Assert
            Assert.Equal(5, result.Items.Count); // Last page has 5 items
            Assert.Equal(10, result.TotalPages);
        }

        #endregion

        #region Page Size Edge Cases

        [Fact]
        public void Create_WithPageSizeOne_CreatesCorrectly()
        {
            // Arrange - Border case: minimum page size
            var products = GetTestProducts(10);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 5, 1);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal(10, result.TotalPages);
            Assert.Equal(5, result.PageIndex);
        }

        [Fact]
        public void Create_WithVeryLargePageSize_ReturnsAllItems()
        {
            // Arrange - Border case: very large page size
            var products = GetTestProducts(50);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 10000);

            // Assert
            Assert.Equal(50, result.Items.Count);
            Assert.Equal(1, result.TotalPages);
        }

        #endregion

        #region Multiple Pages Navigation Tests

        [Fact]
        public void Navigation_ThroughAllPages_WorksCorrectly()
        {
            // Arrange - Border case: navigating through all pages
            var products = GetTestProducts(25);
            var query = products.AsQueryable();

            // Act & Assert - Page 1
            var page1 = PaginatedList<Product>.Create(query, 1, 10);
            Assert.False(page1.HasPreviousPage);
            Assert.True(page1.HasNextPage);

            // Act & Assert - Page 2
            var page2 = PaginatedList<Product>.Create(query, 2, 10);
            Assert.True(page2.HasPreviousPage);
            Assert.True(page2.HasNextPage);

            // Act & Assert - Page 3 (last)
            var page3 = PaginatedList<Product>.Create(query, 3, 10);
            Assert.True(page3.HasPreviousPage);
            Assert.False(page3.HasNextPage);
            Assert.Equal(5, page3.Items.Count); // Only 5 items on last page
        }

        #endregion

        #region Filtered Query Pagination Tests

        [Fact]
        public void Create_WithFilteredQuery_PaginatesFilteredResults()
        {
            // Arrange - Border case: pagination of filtered data
            var products = GetTestProducts(50);
            // Filter to only products with even IDs
            var query = products.Where(p => p.Id % 2 == 0).AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 10);

            // Assert
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(25, result.TotalCount); // Half of 50
            Assert.Equal(3, result.TotalPages); // 25 / 10 = 3 pages
        }

        [Fact]
        public void Create_WithFilterThatReturnsNoResults_CreatesEmptyList()
        {
            // Arrange - Border case: filter returns nothing
            var products = GetTestProducts(50);
            var query = products.Where(p => p.Id > 1000).AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 10);

            // Assert
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalPages);
            Assert.Equal(0, result.TotalCount);
        }

        #endregion

        #region Sorted Query Pagination Tests

        [Fact]
        public void Create_WithSortedQuery_MaintainsSortOrder()
        {
            // Arrange
            var products = GetTestProducts(20);
            var query = products.OrderByDescending(p => p.Price).AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 1, 5);

            // Assert
            Assert.Equal(5, result.Items.Count);
            // Verify descending order
            for (int i = 0; i < result.Items.Count - 1; i++)
            {
                Assert.True(result.Items[i].Price >= result.Items[i + 1].Price);
            }
        }

        #endregion

        #region Complex Scenarios

        [Fact]
        public void Create_WithFilteredAndSortedQuery_PaginatesCorrectly()
        {
            // Arrange - Border case: complex query
            var products = GetTestProducts(100);
            var query = products
                .Where(p => p.Price > 50)
                .OrderBy(p => p.Name)
                .AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 2, 10);

            // Assert
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(2, result.PageIndex);
            Assert.True(result.HasPreviousPage);
        }

        [Fact]
        public void Create_SecondPageOfExactTwoPages_WorksCorrectly()
        {
            // Arrange - Border case: exact page boundary
            var products = GetTestProducts(20);
            var query = products.AsQueryable();

            // Act
            var result = PaginatedList<Product>.Create(query, 2, 10);

            // Assert
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(2, result.TotalPages);
            Assert.True(result.HasPreviousPage);
            Assert.False(result.HasNextPage);
        }

        #endregion

        #region Helper Methods

        private List<Product> GetTestProducts(int count)
        {
            var products = new List<Product>();
            for (int i = 1; i <= count; i++)
            {
                products.Add(new Product
                {
                    Id = i,
                    Name = $"Product {i}",
                    Description = $"Description {i}",
                    Price = 10.00m * i,
                    Stock = i,
                    CategoryId = (i % 3) + 1,
                    IsActive = i % 2 == 0,
                    Category = new Category { Id = (i % 3) + 1, Name = $"Category {(i % 3) + 1}" }
                });
            }
            return products;
        }

        #endregion
    }
}
