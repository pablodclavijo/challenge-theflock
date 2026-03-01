using AdminPanel.Enums;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AdminPanel.Tests.Services
{
    /// <summary>
    /// Integration tests for OrderService
    /// Covers order retrieval, status changes, and stock deduction
    /// Uses in-memory database for testing
    /// </summary>
    public class OrderServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IProductService> _mockProductService;
        private readonly Mock<IStockMovementService> _mockStockMovementService;
        private readonly OrderService _orderService;

        public OrderServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockProductService = new Mock<IProductService>();
            _mockStockMovementService = new Mock<IStockMovementService>();
            _orderService = new OrderService(_context, _mockProductService.Object, _mockStockMovementService.Object);

            SeedDatabase();
        }

        private void SeedDatabase()
        {
            var category = new Category { Id = 1, Name = "Electronics", IsActive = true };
            _context.Categories.Add(category);

            var products = new List<Product>
            {
                new Product { Id = 1, Name = "Product 1", Description = "Description 1", Price = 10.00m, Stock = 100, CategoryId = 1, IsActive = true },
                new Product { Id = 2, Name = "Product 2", Description = "Description 2", Price = 20.00m, Stock = 50, CategoryId = 1, IsActive = true },
                new Product { Id = 3, Name = "Product 3", Description = "Description 3", Price = 30.00m, Stock = 10, CategoryId = 1, IsActive = true },
                new Product { Id = 4, Name = "Product 4", Description = "Description 4", Price = 40.00m, Stock = 0, CategoryId = 1, IsActive = true }
            };
            _context.Products.AddRange(products);

            var user = new ApplicationUser
            {
                Id = "user1",
                Email = "test@test.com",
                UserName = "test@test.com",
                FullName = "Test User"
            };
            _context.Users.Add(user);

            _context.SaveChanges();
        }

        #region GetOrderByIdAsync Tests

        [Fact]
        public async Task GetOrderByIdAsync_WithValidId_ReturnsOrder()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.GetOrderByIdAsync(order.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(order.Id, result.Id);
        }

        [Fact]
        public async Task GetOrderByIdAsync_WithNonExistentId_ReturnsNull()
        {
            // Act
            var result = await _orderService.GetOrderByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-999)]
        public async Task GetOrderByIdAsync_WithInvalidId_ReturnsNull(int id)
        {
            // Act
            var result = await _orderService.GetOrderByIdAsync(id);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region GetOrderWithDetailsAsync Tests

        [Fact]
        public async Task GetOrderWithDetailsAsync_WithValidId_ReturnsOrderWithUserAndItems()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.GetOrderWithDetailsAsync(order.Id);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.User);
            Assert.NotNull(result.Items);
            Assert.Equal(2, result.Items.Count);
        }

        [Fact]
        public async Task GetOrderWithDetailsAsync_WithNonExistentId_ReturnsNull()
        {
            // Act
            var result = await _orderService.GetOrderWithDetailsAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetOrderWithDetailsAsync_IncludesProductDetails()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.GetOrderWithDetailsAsync(order.Id);

            // Assert
            Assert.NotNull(result);
            Assert.All(result.Items, item => Assert.NotNull(item.Product));
        }

        #endregion

        #region GetOrdersAsync Tests

        [Fact]
        public async Task GetOrdersAsync_WithNoOrders_ReturnsEmptyList()
        {
            // Act
            var result = await _orderService.GetOrdersAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetOrdersAsync_WithMultipleOrders_ReturnsAllOrderedByDate()
        {
            // Arrange
            var order1 = CreateTestOrder(OrderStatus.Pending);
            order1.CreatedAt = DateTime.UtcNow.AddDays(-2);
            var order2 = CreateTestOrder(OrderStatus.Confirmed);
            order2.CreatedAt = DateTime.UtcNow.AddDays(-1);
            var order3 = CreateTestOrder(OrderStatus.Shipped);
            order3.CreatedAt = DateTime.UtcNow;

            _context.Orders.AddRange(order1, order2, order3);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.GetOrdersAsync();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.True(result[0].CreatedAt >= result[1].CreatedAt);
            Assert.True(result[1].CreatedAt >= result[2].CreatedAt);
        }

        [Fact]
        public async Task GetOrdersAsync_IncludesUserAndItems()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.GetOrdersAsync();

            // Assert
            Assert.Single(result);
            Assert.NotNull(result[0].User);
            Assert.NotNull(result[0].Items);
        }

        #endregion

        #region GetOrdersQuery Tests

        [Fact]
        public void GetOrdersQuery_ReturnsQueryable()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            _context.SaveChanges();

            // Act
            var query = _orderService.GetOrdersQuery();

            // Assert
            Assert.NotNull(query);
            Assert.IsAssignableFrom<IQueryable<Order>>(query);
        }

        [Fact]
        public void GetOrdersQuery_IncludesUserAndItems()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            _context.SaveChanges();

            // Act
            var query = _orderService.GetOrdersQuery();
            var result = query.First();

            // Assert
            Assert.NotNull(result.User);
            Assert.NotNull(result.Items);
        }

        #endregion

        #region OrderExistsAsync Tests

        [Fact]
        public async Task OrderExistsAsync_WithExistingOrder_ReturnsTrue()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.OrderExistsAsync(order.Id);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task OrderExistsAsync_WithNonExistentOrder_ReturnsFalse()
        {
            // Act
            var result = await _orderService.OrderExistsAsync(999);

            // Assert
            Assert.False(result);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public async Task OrderExistsAsync_WithInvalidId_ReturnsFalse(int id)
        {
            // Act
            var result = await _orderService.OrderExistsAsync(id);

            // Assert
            Assert.False(result);
        }

        #endregion

        #region UpdateOrderStatusAsync Tests

        [Fact]
        public async Task UpdateOrderStatusAsync_FromPendingToConfirmed_UpdatesStatusAndDeductsStock()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            SetupProductServiceMocks();

            // Act
            var result = await _orderService.UpdateOrderStatusAsync(order.Id, OrderStatus.Confirmed, "user1");

            // Assert
            Assert.Equal(OrderStatus.Confirmed, result.Status);
            _mockProductService.Verify(p => p.GetProductByIdAsync(It.IsAny<int>()), Times.Exactly(2));
            _mockStockMovementService.Verify(s => s.CreateStockMovementAsync(
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
                "OrderConfirmation", It.IsAny<string>(), "user1"), Times.Exactly(2));
        }

        [Fact]
        public async Task UpdateOrderStatusAsync_FromConfirmedToShipped_UpdatesStatusWithoutStockChange()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Confirmed);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.UpdateOrderStatusAsync(order.Id, OrderStatus.Shipped, "user1");

            // Assert
            Assert.Equal(OrderStatus.Shipped, result.Status);
            _mockProductService.Verify(p => p.GetProductByIdAsync(It.IsAny<int>()), Times.Never);
            _mockStockMovementService.Verify(s => s.CreateStockMovementAsync(
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task UpdateOrderStatusAsync_FromShippedToDelivered_UpdatesStatusWithoutStockChange()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Shipped);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.UpdateOrderStatusAsync(order.Id, OrderStatus.Delivered, "user1");

            // Assert
            Assert.Equal(OrderStatus.Delivered, result.Status);
        }

        [Fact]
        public async Task UpdateOrderStatusAsync_WithInvalidTransition_ThrowsException()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _orderService.UpdateOrderStatusAsync(order.Id, OrderStatus.Shipped, "user1"));
        }

        [Theory]
        [InlineData(OrderStatus.Pending, OrderStatus.Shipped)]
        [InlineData(OrderStatus.Pending, OrderStatus.Delivered)]
        [InlineData(OrderStatus.Confirmed, OrderStatus.Delivered)]
        [InlineData(OrderStatus.Shipped, OrderStatus.Pending)]
        [InlineData(OrderStatus.Confirmed, OrderStatus.Pending)]
        [InlineData(OrderStatus.Delivered, OrderStatus.Pending)]
        public async Task UpdateOrderStatusAsync_WithInvalidTransitions_ThrowsException(OrderStatus from, OrderStatus to)
        {
            // Arrange
            var order = CreateTestOrder(from);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _orderService.UpdateOrderStatusAsync(order.Id, to, "user1"));
        }

        [Fact]
        public async Task UpdateOrderStatusAsync_WithNonExistentOrder_ThrowsException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _orderService.UpdateOrderStatusAsync(999, OrderStatus.Confirmed, "user1"));
        }

        [Fact]
        public async Task UpdateOrderStatusAsync_UpdatesTimestamp()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Confirmed);
            order.UpdatedAt = DateTime.UtcNow.AddHours(-1);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var beforeUpdate = DateTime.UtcNow.AddSeconds(-1);

            // Act
            var result = await _orderService.UpdateOrderStatusAsync(order.Id, OrderStatus.Shipped, "user1");

            // Assert
            Assert.True(result.UpdatedAt > beforeUpdate);
        }

        #endregion

        #region DeductStockForOrderAsync Tests

        [Fact]
        public async Task DeductStockForOrderAsync_WithSufficientStock_DeductsCorrectly()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            SetupProductServiceMocks();

            // Act
            await _orderService.DeductStockForOrderAsync(order.Id, "user1");

            // Assert
            _mockProductService.Verify(p => p.GetProductByIdAsync(1), Times.Once);
            _mockProductService.Verify(p => p.GetProductByIdAsync(2), Times.Once);
            _mockStockMovementService.Verify(s => s.CreateStockMovementAsync(
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
                "OrderConfirmation", It.IsAny<string>(), "user1"), Times.Exactly(2));
        }

        [Fact]
        public async Task DeductStockForOrderAsync_WithInsufficientStock_ThrowsException()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Add(new OrderItem
            {
                ProductId = 4,
                Quantity = 10,
                ProductNameSnapshot = "Product 4",
                UnitPriceSnapshot = 40.00m,
                LineTotal = 400.00m
            });
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var product4 = await _context.Products.FindAsync(4);
            _mockProductService.Setup(p => p.GetProductByIdAsync(4))
                .ReturnsAsync(product4);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _orderService.DeductStockForOrderAsync(order.Id, "user1"));
        }

        [Fact]
        public async Task DeductStockForOrderAsync_WithNonExistentOrder_ThrowsException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _orderService.DeductStockForOrderAsync(999, "user1"));
        }

        [Fact]
        public async Task DeductStockForOrderAsync_WithNonExistentProduct_ThrowsException()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Add(new OrderItem
            {
                ProductId = 999,
                Quantity = 1,
                ProductNameSnapshot = "Non-existent Product",
                UnitPriceSnapshot = 10.00m,
                LineTotal = 10.00m
            });
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _mockProductService.Setup(p => p.GetProductByIdAsync(999))
                .ReturnsAsync((Product?)null);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _orderService.DeductStockForOrderAsync(order.Id, "user1"));
        }

        [Fact]
        public async Task DeductStockForOrderAsync_WithMultipleItems_DeductsAllCorrectly()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Add(new OrderItem
            {
                ProductId = 3,
                Quantity = 5,
                ProductNameSnapshot = "Product 3",
                UnitPriceSnapshot = 30.00m,
                LineTotal = 150.00m
            });
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            SetupProductServiceMocks();

            var product3 = await _context.Products.FindAsync(3);
            _mockProductService.Setup(p => p.GetProductByIdAsync(3))
                .ReturnsAsync(product3);

            // Act
            await _orderService.DeductStockForOrderAsync(order.Id, "user1");

            // Assert
            _mockProductService.Verify(p => p.GetProductByIdAsync(It.IsAny<int>()), Times.Exactly(3));
            _mockStockMovementService.Verify(s => s.CreateStockMovementAsync(
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
                "OrderConfirmation", It.IsAny<string>(), "user1"), Times.Exactly(3));
        }

        [Fact]
        public async Task DeductStockForOrderAsync_UpdatesProductStockInDatabase()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            SetupProductServiceMocksForRealStockUpdate();

            var product1Before = await _context.Products.FindAsync(1);
            var product2Before = await _context.Products.FindAsync(2);
            var stockBefore1 = product1Before!.Stock;
            var stockBefore2 = product2Before!.Stock;

            // Act
            await _orderService.DeductStockForOrderAsync(order.Id, "user1");

            // Assert
            var product1After = await _context.Products.FindAsync(1);
            var product2After = await _context.Products.FindAsync(2);
            Assert.Equal(stockBefore1 - 2, product1After!.Stock);
            Assert.Equal(stockBefore2 - 3, product2After!.Stock);
        }

        #endregion

        #region Valid Status Transitions Tests

        [Theory]
        [InlineData(OrderStatus.Pending, OrderStatus.Confirmed, true)]
        [InlineData(OrderStatus.Confirmed, OrderStatus.Shipped, true)]
        [InlineData(OrderStatus.Shipped, OrderStatus.Delivered, true)]
        public async Task UpdateOrderStatusAsync_WithValidTransitions_Succeeds(OrderStatus from, OrderStatus to, bool shouldSucceed)
        {
            // Arrange
            var order = CreateTestOrder(from);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            if (from == OrderStatus.Pending && to == OrderStatus.Confirmed)
            {
                SetupProductServiceMocks();
            }

            // Act
            var result = await _orderService.UpdateOrderStatusAsync(order.Id, to, "user1");

            // Assert
            Assert.Equal(to, result.Status);
        }

        #endregion

        #region Edge Cases

        [Fact]
        public async Task UpdateOrderStatusAsync_WithEmptyUserId_StillWorks()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Confirmed);
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.UpdateOrderStatusAsync(order.Id, OrderStatus.Shipped, "");

            // Assert
            Assert.Equal(OrderStatus.Shipped, result.Status);
        }

        [Fact]
        public async Task DeductStockForOrderAsync_WithZeroQuantityItem_DoesNotDeductStock()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Clear();
            order.Items.Add(new OrderItem
            {
                ProductId = 1,
                Quantity = 0,
                ProductNameSnapshot = "Product 1",
                UnitPriceSnapshot = 10.00m,
                LineTotal = 0m
            });
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var product1 = await _context.Products.FindAsync(1);
            _mockProductService.Setup(p => p.GetProductByIdAsync(1))
                .ReturnsAsync(product1);

            var stockBefore = product1!.Stock;

            // Act
            await _orderService.DeductStockForOrderAsync(order.Id, "user1");

            // Assert
            var product1After = await _context.Products.FindAsync(1);
            Assert.Equal(stockBefore, product1After!.Stock);
        }

        [Fact]
        public async Task DeductStockForOrderAsync_WithEmptyOrder_DoesNotThrow()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Clear();
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            await _orderService.DeductStockForOrderAsync(order.Id, "user1");

            // Assert - No exception thrown
            Assert.True(true);
        }

        [Fact]
        public async Task GetOrderWithDetailsAsync_WithLargeNumberOfItems_RetrievesAll()
        {
            // Arrange
            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Clear();
            for (int i = 1; i <= 100; i++)
            {
                order.Items.Add(new OrderItem
                {
                    ProductId = 1,
                    Quantity = 1,
                    ProductNameSnapshot = $"Product {i}",
                    UnitPriceSnapshot = 10.00m,
                    LineTotal = 10.00m
                });
            }
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _orderService.GetOrderWithDetailsAsync(order.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100, result.Items.Count);
        }

        #endregion

        #region Boundary Value Tests

        [Theory]
        [InlineData(1)]
        [InlineData(10)]
        [InlineData(100)]
        [InlineData(1000)]
        public async Task DeductStockForOrderAsync_WithVariousQuantities_DeductsCorrectly(int quantity)
        {
            // Arrange
            var product = await _context.Products.FindAsync(1);
            product!.Stock = 10000; // Ensure sufficient stock
            await _context.SaveChangesAsync();

            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Clear();
            order.Items.Add(new OrderItem
            {
                ProductId = 1,
                Quantity = quantity,
                ProductNameSnapshot = "Product 1",
                UnitPriceSnapshot = 10.00m,
                LineTotal = 10.00m * quantity
            });
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _mockProductService.Setup(p => p.GetProductByIdAsync(1))
                .ReturnsAsync(product);

            // Act
            await _orderService.DeductStockForOrderAsync(order.Id, "user1");

            // Assert
            var productAfter = await _context.Products.FindAsync(1);
            Assert.Equal(10000 - quantity, productAfter!.Stock);
        }

        [Fact]
        public async Task DeductStockForOrderAsync_DeductingExactStock_LeavesZero()
        {
            // Arrange
            var product = await _context.Products.FindAsync(3);
            product!.Stock = 10;
            await _context.SaveChangesAsync();

            var order = CreateTestOrder(OrderStatus.Pending);
            order.Items.Clear();
            order.Items.Add(new OrderItem
            {
                ProductId = 3,
                Quantity = 10,
                ProductNameSnapshot = "Product 3",
                UnitPriceSnapshot = 30.00m,
                LineTotal = 300.00m
            });
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _mockProductService.Setup(p => p.GetProductByIdAsync(3))
                .ReturnsAsync(product);

            // Act
            await _orderService.DeductStockForOrderAsync(order.Id, "user1");

            // Assert
            var productAfter = await _context.Products.FindAsync(3);
            Assert.Equal(0, productAfter!.Stock);
        }

        #endregion

        #region Helper Methods

        private Order CreateTestOrder(OrderStatus status)
        {
            var order = new Order
            {
                UserId = "user1",
                Status = status,
                ShippingAddress = "123 Test Street, Test City, TC 12345",
                Subtotal = 80.00m,
                Tax = 8.00m,
                Total = 88.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = 1,
                        Quantity = 2,
                        ProductNameSnapshot = "Product 1",
                        UnitPriceSnapshot = 10.00m,
                        LineTotal = 20.00m
                    },
                    new OrderItem
                    {
                        ProductId = 2,
                        Quantity = 3,
                        ProductNameSnapshot = "Product 2",
                        UnitPriceSnapshot = 20.00m,
                        LineTotal = 60.00m
                    }
                }
            };

            return order;
        }

        private void SetupProductServiceMocks()
        {
            var products = _context.Products.ToList();
            foreach (var product in products)
            {
                _mockProductService.Setup(p => p.GetProductByIdAsync(product.Id))
                    .ReturnsAsync(product);
            }

            _mockStockMovementService.Setup(s => s.CreateStockMovementAsync(
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((int productId, int previousStock, int newStock, int quantity, string type, string reason, string userId) =>
                    new StockMovement
                    {
                        ProductId = productId,
                        PreviousStock = previousStock,
                        NewStock = newStock,
                        Quantity = quantity,
                        MovementType = type,
                        Reason = reason,
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    });
        }

        private void SetupProductServiceMocksForRealStockUpdate()
        {
            _mockProductService.Setup(p => p.GetProductByIdAsync(It.IsAny<int>()))
                .ReturnsAsync((int id) => _context.Products.Find(id));

            _mockStockMovementService.Setup(s => s.CreateStockMovementAsync(
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((int productId, int previousStock, int newStock, int quantity, string type, string reason, string userId) =>
                    new StockMovement
                    {
                        ProductId = productId,
                        PreviousStock = previousStock,
                        NewStock = newStock,
                        Quantity = quantity,
                        MovementType = type,
                        Reason = reason,
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    });
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
