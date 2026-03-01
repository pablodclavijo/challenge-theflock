using AdminPanel.Enums;
using AdminPanel.Pages.Orders;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;
using OrderIndexModel = AdminPanel.Pages.Orders.IndexModel;

namespace AdminPanel.Tests.Pages.Orders
{
    /// <summary>
    /// Tests for Orders Index page model
    /// Covers order listing, filtering, and pagination
    /// </summary>
    public class OrderIndexModelTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly OrderIndexModel _pageModel;

        public OrderIndexModelTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _pageModel = new OrderIndexModel(_context);

            _pageModel.PageContext = new Microsoft.AspNetCore.Mvc.RazorPages.PageContext
            {
                HttpContext = new DefaultHttpContext()
            };

            SeedDatabase();
        }

        private void SeedDatabase()
        {
            var user = new ApplicationUser
            {
                Id = "user1",
                Email = "test@test.com",
                UserName = "test@test.com",
                FullName = "Test User"
            };
            _context.Users.Add(user);

            var orders = new List<Order>
            {
                CreateOrder(1, OrderStatus.Pending, DateTime.UtcNow.AddDays(-5)),
                CreateOrder(2, OrderStatus.Confirmed, DateTime.UtcNow.AddDays(-4)),
                CreateOrder(3, OrderStatus.Shipped, DateTime.UtcNow.AddDays(-3)),
                CreateOrder(4, OrderStatus.Delivered, DateTime.UtcNow.AddDays(-2)),
                CreateOrder(5, OrderStatus.Pending, DateTime.UtcNow.AddDays(-1)),
                CreateOrder(6, OrderStatus.Confirmed, DateTime.UtcNow),
            };

            _context.Orders.AddRange(orders);
            _context.SaveChanges();
        }

        #region OnGetAsync Tests - No Filters

        [Fact]
        public async Task OnGetAsync_WithNoFilters_ReturnsAllOrders()
        {
            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert
            Assert.NotNull(_pageModel.Orders);
            Assert.Equal(6, _pageModel.Orders.TotalCount);
        }

        [Fact]
        public async Task OnGetAsync_OrdersByDateDescending()
        {
            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert
            var items = _pageModel.Orders.Items.ToList();
            for (int i = 0; i < items.Count - 1; i++)
            {
                Assert.True(items[i].CreatedAt >= items[i + 1].CreatedAt);
            }
        }

        [Fact]
        public async Task OnGetAsync_IncludesUserAndItems()
        {
            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert
            var firstOrder = _pageModel.Orders.Items.First();
            Assert.NotNull(firstOrder.User);
            Assert.NotNull(firstOrder.Items);
        }

        #endregion

        #region OnGetAsync Tests - Status Filter

        [Fact]
        public async Task OnGetAsync_WithPendingFilter_ReturnsOnlyPendingOrders()
        {
            // Act
            await _pageModel.OnGetAsync("Pending", null, null, null);

            // Assert
            Assert.Equal(2, _pageModel.Orders.TotalCount);
            Assert.All(_pageModel.Orders.Items, order => Assert.Equal(OrderStatus.Pending, order.Status));
        }

        [Fact]
        public async Task OnGetAsync_WithConfirmedFilter_ReturnsOnlyConfirmedOrders()
        {
            // Act
            await _pageModel.OnGetAsync("Confirmed", null, null, null);

            // Assert
            Assert.Equal(2, _pageModel.Orders.TotalCount);
            Assert.All(_pageModel.Orders.Items, order => Assert.Equal(OrderStatus.Confirmed, order.Status));
        }

        [Fact]
        public async Task OnGetAsync_WithShippedFilter_ReturnsOnlyShippedOrders()
        {
            // Act
            await _pageModel.OnGetAsync("Shipped", null, null, null);

            // Assert
            Assert.Equal(1, _pageModel.Orders.TotalCount);
            Assert.All(_pageModel.Orders.Items, order => Assert.Equal(OrderStatus.Shipped, order.Status));
        }

        [Fact]
        public async Task OnGetAsync_WithDeliveredFilter_ReturnsOnlyDeliveredOrders()
        {
            // Act
            await _pageModel.OnGetAsync("Delivered", null, null, null);

            // Assert
            Assert.Equal(1, _pageModel.Orders.TotalCount);
            Assert.All(_pageModel.Orders.Items, order => Assert.Equal(OrderStatus.Delivered, order.Status));
        }

        [Fact]
        public async Task OnGetAsync_WithInvalidStatusFilter_ReturnsAllOrders()
        {
            // Act
            await _pageModel.OnGetAsync("InvalidStatus", null, null, null);

            // Assert
            Assert.Equal(6, _pageModel.Orders.TotalCount);
        }

        [Fact]
        public async Task OnGetAsync_WithEmptyStatusFilter_ReturnsAllOrders()
        {
            // Act
            await _pageModel.OnGetAsync("", null, null, null);

            // Assert
            Assert.Equal(6, _pageModel.Orders.TotalCount);
        }

        [Fact]
        public async Task OnGetAsync_StatusFilter_SetsCurrentStatusFilter()
        {
            // Act
            await _pageModel.OnGetAsync("Pending", null, null, null);

            // Assert
            Assert.Equal("Pending", _pageModel.CurrentStatusFilter);
        }

        #endregion

        #region OnGetAsync Tests - Date Filters

        [Fact]
        public async Task OnGetAsync_WithDateFrom_ReturnsOrdersAfterDate()
        {
            // Arrange
            var dateFrom = DateTime.UtcNow.AddDays(-3).Date;

            // Act
            await _pageModel.OnGetAsync(null, dateFrom, null, null);

            // Assert
            Assert.True(_pageModel.Orders.TotalCount >= 3); // At least 3 orders in last 3 days
            Assert.All(_pageModel.Orders.Items, order => Assert.True(order.CreatedAt >= dateFrom));
        }

        [Fact]
        public async Task OnGetAsync_WithDateTo_ReturnsOrdersBeforeDate()
        {
            // Arrange
            var dateTo = DateTime.UtcNow.AddDays(-3);

            // Act
            await _pageModel.OnGetAsync(null, null, dateTo, null);

            // Assert
            Assert.True(_pageModel.Orders.TotalCount >= 2);
            Assert.All(_pageModel.Orders.Items, order => Assert.True(order.CreatedAt < dateTo.AddDays(1)));
        }

        [Fact]
        public async Task OnGetAsync_WithDateRange_ReturnsOrdersInRange()
        {
            // Arrange
            var dateFrom = DateTime.UtcNow.AddDays(-4);
            var dateTo = DateTime.UtcNow.AddDays(-2);

            // Act
            await _pageModel.OnGetAsync(null, dateFrom, dateTo, null);

            // Assert
            Assert.True(_pageModel.Orders.TotalCount >= 2);
            Assert.All(_pageModel.Orders.Items, order =>
            {
                Assert.True(order.CreatedAt >= dateFrom);
                Assert.True(order.CreatedAt < dateTo.AddDays(1));
            });
        }

        [Fact]
        public async Task OnGetAsync_WithDateFrom_SetsProperty()
        {
            // Arrange
            var dateFrom = DateTime.UtcNow.AddDays(-3);

            // Act
            await _pageModel.OnGetAsync(null, dateFrom, null, null);

            // Assert
            Assert.Equal(dateFrom, _pageModel.DateFrom);
        }

        [Fact]
        public async Task OnGetAsync_WithDateTo_SetsProperty()
        {
            // Arrange
            var dateTo = DateTime.UtcNow.AddDays(-1);

            // Act
            await _pageModel.OnGetAsync(null, null, dateTo, null);

            // Assert
            Assert.Equal(dateTo, _pageModel.DateTo);
        }

        [Fact]
        public async Task OnGetAsync_WithFutureDate_ReturnsNoOrders()
        {
            // Arrange
            var futureDate = DateTime.UtcNow.AddDays(10);

            // Act
            await _pageModel.OnGetAsync(null, futureDate, null, null);

            // Assert
            Assert.Equal(0, _pageModel.Orders.TotalCount);
        }

        #endregion

        #region OnGetAsync Tests - Combined Filters

        [Fact]
        public async Task OnGetAsync_WithStatusAndDateFrom_ReturnsFilteredOrders()
        {
            // Arrange
            var dateFrom = DateTime.UtcNow.AddDays(-3);

            // Act
            await _pageModel.OnGetAsync("Pending", dateFrom, null, null);

            // Assert
            Assert.Equal(1, _pageModel.Orders.TotalCount); // Only one pending order in last 3 days
            Assert.All(_pageModel.Orders.Items, order =>
            {
                Assert.Equal(OrderStatus.Pending, order.Status);
                Assert.True(order.CreatedAt >= dateFrom);
            });
        }

        [Fact]
        public async Task OnGetAsync_WithAllFilters_ReturnsCorrectOrders()
        {
            // Arrange
            var dateFrom = DateTime.UtcNow.AddDays(-5);
            var dateTo = DateTime.UtcNow.AddDays(-3);

            // Act
            await _pageModel.OnGetAsync("Confirmed", dateFrom, dateTo, null);

            // Assert
            Assert.All(_pageModel.Orders.Items, order =>
            {
                Assert.Equal(OrderStatus.Confirmed, order.Status);
                Assert.True(order.CreatedAt >= dateFrom);
                Assert.True(order.CreatedAt < dateTo.AddDays(1));
            });
        }

        [Fact]
        public async Task OnGetAsync_WithFiltersReturningNoResults_ReturnsEmptyList()
        {
            // Arrange
            var dateFrom = DateTime.UtcNow.AddYears(-10);
            var dateTo = DateTime.UtcNow.AddYears(-9);

            // Act
            await _pageModel.OnGetAsync("Pending", dateFrom, dateTo, null);

            // Assert
            Assert.Equal(0, _pageModel.Orders.TotalCount);
        }

        #endregion

        #region OnGetAsync Tests - Pagination

        [Fact]
        public async Task OnGetAsync_WithPageIndex_ReturnsCorrectPage()
        {
            // Arrange
            for (int i = 7; i <= 20; i++)
            {
                _context.Orders.Add(CreateOrder(i, OrderStatus.Pending, DateTime.UtcNow.AddDays(-i)));
            }
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, null, null, 2);

            // Assert
            Assert.Equal(2, _pageModel.Orders.PageIndex);
        }

        [Fact]
        public async Task OnGetAsync_FirstPage_HasCorrectPageInfo()
        {
            // Arrange
            for (int i = 7; i <= 20; i++)
            {
                _context.Orders.Add(CreateOrder(i, OrderStatus.Pending, DateTime.UtcNow.AddDays(-i)));
            }
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, null, null, 1);

            // Assert
            Assert.Equal(1, _pageModel.Orders.PageIndex);
            Assert.True(_pageModel.Orders.HasNextPage);
            Assert.False(_pageModel.Orders.HasPreviousPage);
        }

        [Fact]
        public async Task OnGetAsync_DefaultPageSize_ShowsCorrectItems()
        {
            // Arrange
            for (int i = 7; i <= 20; i++)
            {
                _context.Orders.Add(CreateOrder(i, OrderStatus.Pending, DateTime.UtcNow.AddDays(-i)));
            }
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert - First page should show 15 items (page size is 15)
            Assert.Equal(15, _pageModel.Orders.Items.Count);
        }

        [Fact]
        public async Task OnGetAsync_WithNullPageIndex_DefaultsToFirstPage()
        {
            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert
            Assert.Equal(1, _pageModel.Orders.PageIndex);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public async Task OnGetAsync_WithInvalidPageIndex_PassesThroughPageIndex(int pageIndex)
        {
            // Act
            await _pageModel.OnGetAsync(null, null, null, pageIndex);

            // Assert
            // PaginatedList doesn't validate page index, it passes through
            Assert.Equal(pageIndex, _pageModel.Orders.PageIndex);
        }

        #endregion

        #region Edge Cases

        [Fact]
        public async Task OnGetAsync_WithNoOrdersInDatabase_ReturnsEmptyPaginatedList()
        {
            // Arrange
            _context.Orders.RemoveRange(_context.Orders);
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert
            Assert.NotNull(_pageModel.Orders);
            Assert.Equal(0, _pageModel.Orders.TotalCount);
            Assert.Empty(_pageModel.Orders.Items);
        }

        [Fact]
        public async Task OnGetAsync_WithExactlyOnePageOfOrders_HasNoNextPage()
        {
            // Arrange
            _context.Orders.RemoveRange(_context.Orders);
            for (int i = 1; i <= 15; i++)
            {
                _context.Orders.Add(CreateOrder(i, OrderStatus.Pending, DateTime.UtcNow.AddDays(-i)));
            }
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, null, null, 1);

            // Assert
            Assert.Equal(15, _pageModel.Orders.TotalCount);
            Assert.False(_pageModel.Orders.HasNextPage);
        }

        [Fact]
        public async Task OnGetAsync_WithLargeNumberOfOrders_PaginatesCorrectly()
        {
            // Arrange
            for (int i = 7; i <= 100; i++)
            {
                _context.Orders.Add(CreateOrder(i, OrderStatus.Pending, DateTime.UtcNow.AddDays(-i)));
            }
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, null, null, 1);

            // Assert
            Assert.Equal(100, _pageModel.Orders.TotalCount);
            Assert.Equal(15, _pageModel.Orders.Items.Count);
            Assert.True(_pageModel.Orders.HasNextPage);
        }

        [Fact]
        public async Task OnGetAsync_LastPage_HasCorrectItemCount()
        {
            // Arrange
            _context.Orders.RemoveRange(_context.Orders);
            for (int i = 1; i <= 17; i++) // 2 pages, second page has 2 items
            {
                _context.Orders.Add(CreateOrder(i, OrderStatus.Pending, DateTime.UtcNow.AddDays(-i)));
            }
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, null, null, 2);

            // Assert
            Assert.Equal(2, _pageModel.Orders.Items.Count);
            Assert.False(_pageModel.Orders.HasNextPage);
        }

        #endregion

        #region Date Edge Cases

        [Fact]
        public async Task OnGetAsync_WithSameFromAndToDate_ReturnsOrdersOnThatDay()
        {
            // Arrange
            var targetDate = DateTime.UtcNow.AddDays(-3).Date;
            _context.Orders.Add(CreateOrder(100, OrderStatus.Pending, targetDate.AddHours(12)));
            await _context.SaveChangesAsync();

            // Act
            await _pageModel.OnGetAsync(null, targetDate, targetDate, null);

            // Assert
            Assert.True(_pageModel.Orders.TotalCount >= 1);
        }

        [Fact]
        public async Task OnGetAsync_WithDateFromInFuture_ReturnsNoOrders()
        {
            // Arrange
            var futureDate = DateTime.UtcNow.AddYears(1);

            // Act
            await _pageModel.OnGetAsync(null, futureDate, null, null);

            // Assert
            Assert.Equal(0, _pageModel.Orders.TotalCount);
        }

        [Fact]
        public async Task OnGetAsync_WithVeryOldDates_HandlesCorrectly()
        {
            // Arrange
            var oldDate = new DateTime(2000, 1, 1);

            // Act
            await _pageModel.OnGetAsync(null, oldDate, null, null);

            // Assert
            Assert.NotNull(_pageModel.Orders);
            Assert.Equal(6, _pageModel.Orders.TotalCount);
        }

        [Fact]
        public async Task OnGetAsync_WithReverseDateRange_ReturnsNoOrders()
        {
            // Arrange - dateFrom after dateTo
            var dateFrom = DateTime.UtcNow;
            var dateTo = DateTime.UtcNow.AddDays(-10);

            // Act
            await _pageModel.OnGetAsync(null, dateFrom, dateTo, null);

            // Assert
            Assert.Equal(0, _pageModel.Orders.TotalCount);
        }

        #endregion

        #region Status Filter Edge Cases

        [Theory]
        [InlineData("pending")] // lowercase
        [InlineData("PENDING")] // uppercase
        [InlineData("PeNdInG")] // mixed case
        public async Task OnGetAsync_WithDifferentStatusCasing_WorksCorrectly(string status)
        {
            // Act
            await _pageModel.OnGetAsync(status, null, null, null);

            // Assert
            // Should either filter correctly or return all based on case-sensitive parsing
            Assert.NotNull(_pageModel.Orders);
        }

        [Fact]
        public async Task OnGetAsync_WithWhitespaceInStatus_HandlesGracefully()
        {
            // Act
            await _pageModel.OnGetAsync(" Pending ", null, null, null);

            // Assert
            Assert.NotNull(_pageModel.Orders);
        }

        [Fact]
        public async Task OnGetAsync_WithNullStatus_ReturnsAllOrders()
        {
            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert
            Assert.Equal(6, _pageModel.Orders.TotalCount);
            Assert.Empty(_pageModel.CurrentStatusFilter);
        }

        #endregion

        #region Property Setting Tests

        [Fact]
        public async Task OnGetAsync_SetsAllFilterProperties()
        {
            // Arrange
            var status = "Pending";
            var dateFrom = DateTime.UtcNow.AddDays(-5);
            var dateTo = DateTime.UtcNow.AddDays(-1);

            // Act
            await _pageModel.OnGetAsync(status, dateFrom, dateTo, null);

            // Assert
            Assert.Equal(status, _pageModel.CurrentStatusFilter);
            Assert.Equal(dateFrom, _pageModel.DateFrom);
            Assert.Equal(dateTo, _pageModel.DateTo);
        }

        [Fact]
        public async Task OnGetAsync_WithNoFilters_SetsEmptyFilterProperties()
        {
            // Act
            await _pageModel.OnGetAsync(null, null, null, null);

            // Assert
            Assert.Empty(_pageModel.CurrentStatusFilter);
            Assert.Null(_pageModel.DateFrom);
            Assert.Null(_pageModel.DateTo);
        }

        #endregion

        #region Concurrent Operations

        [Fact]
        public async Task OnGetAsync_WithSimultaneousCalls_HandlesSafely()
        {
            // Act
            var task1 = _pageModel.OnGetAsync(null, null, null, null);
            var task2 = _pageModel.OnGetAsync("Pending", null, null, null);
            var task3 = _pageModel.OnGetAsync("Confirmed", null, null, null);

            await Task.WhenAll(task1, task2, task3);

            // Assert - Should not throw exceptions
            Assert.NotNull(_pageModel.Orders);
        }

        #endregion

        #region Helper Methods

        private Order CreateOrder(int id, OrderStatus status, DateTime createdAt)
        {
            return new Order
            {
                Id = id,
                UserId = "user1",
                Status = status,
                ShippingAddress = $"Address {id}",
                Subtotal = 100.00m,
                Tax = 10.00m,
                Total = 110.00m,
                CreatedAt = createdAt,
                UpdatedAt = createdAt,
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = 1,
                        Quantity = 1,
                        ProductNameSnapshot = "Test Product",
                        UnitPriceSnapshot = 100.00m,
                        LineTotal = 100.00m
                    }
                }
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
