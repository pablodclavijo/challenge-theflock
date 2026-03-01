using AdminPanel.Enums;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Xunit;
using OrderDetailsModel = AdminPanel.Pages.Orders.DetailsModel;

namespace AdminPanel.Tests.Pages.Orders
{
    /// <summary>
    /// Tests for Orders Details page model
    /// Covers order details retrieval and status change operations
    /// </summary>
    public class OrderDetailsModelTests
    {
        private readonly Mock<IOrderService> _mockOrderService;
        private readonly OrderDetailsModel _pageModel;
        private readonly DefaultHttpContext _httpContext;

        public OrderDetailsModelTests()
        {
            _mockOrderService = new Mock<IOrderService>();
            _pageModel = new OrderDetailsModel(_mockOrderService.Object);

            // Setup HttpContext and User
            _httpContext = new DefaultHttpContext();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
                new Claim(ClaimTypes.Email, "test@test.com")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _httpContext.User = claimsPrincipal;

            _pageModel.PageContext = new Microsoft.AspNetCore.Mvc.RazorPages.PageContext
            {
                HttpContext = _httpContext
            };

            _pageModel.TempData = new TempDataDictionary(_httpContext, Mock.Of<ITempDataProvider>());
        }

        #region OnGetAsync Tests

        [Fact]
        public async Task OnGetAsync_WithValidId_ReturnsPageResult()
        {
            // Arrange
            var order = CreateTestOrder(1, OrderStatus.Pending);
            _mockOrderService.Setup(s => s.GetOrderWithDetailsAsync(1))
                .ReturnsAsync(order);

            // Act
            var result = await _pageModel.OnGetAsync(1);

            // Assert
            Assert.IsType<Microsoft.AspNetCore.Mvc.RazorPages.PageResult>(result);
            Assert.NotNull(_pageModel.Order);
            Assert.Equal(1, _pageModel.Order.Id);
        }

        [Fact]
        public async Task OnGetAsync_WithNullId_ReturnsNotFound()
        {
            // Act
            var result = await _pageModel.OnGetAsync(null);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task OnGetAsync_WithNonExistentOrder_ReturnsNotFound()
        {
            // Arrange
            _mockOrderService.Setup(s => s.GetOrderWithDetailsAsync(999))
                .ReturnsAsync((Order?)null);

            // Act
            var result = await _pageModel.OnGetAsync(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-999)]
        public async Task OnGetAsync_WithInvalidId_ReturnsNotFound(int id)
        {
            // Arrange
            _mockOrderService.Setup(s => s.GetOrderWithDetailsAsync(id))
                .ReturnsAsync((Order?)null);

            // Act
            var result = await _pageModel.OnGetAsync(id);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task OnGetAsync_WithValidOrder_SetsOrderProperty()
        {
            // Arrange
            var order = CreateTestOrder(1, OrderStatus.Confirmed);
            _mockOrderService.Setup(s => s.GetOrderWithDetailsAsync(1))
                .ReturnsAsync(order);

            // Act
            await _pageModel.OnGetAsync(1);

            // Assert
            Assert.NotNull(_pageModel.Order);
            Assert.Equal(OrderStatus.Confirmed, _pageModel.Order.Status);
            Assert.Equal("test@test.com", _pageModel.Order.User.Email);
        }

        #endregion

        #region OnPostChangeStatusAsync Tests

        [Fact]
        public async Task OnPostChangeStatusAsync_WithValidStatusChange_RedirectsWithSuccess()
        {
            // Arrange
            var order = CreateTestOrder(1, OrderStatus.Confirmed);
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Confirmed, It.IsAny<string>()))
                .ReturnsAsync(order);

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Confirmed);

            // Assert
            var redirectResult = Assert.IsType<RedirectToPageResult>(result);
            Assert.Equal("Pedido #1 confirmado exitosamente", _pageModel.TempData["SuccessMessage"]);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_ChangingToShipped_ShowsCorrectMessage()
        {
            // Arrange
            var order = CreateTestOrder(1, OrderStatus.Shipped);
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Shipped, It.IsAny<string>()))
                .ReturnsAsync(order);

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Shipped);

            // Assert
            Assert.Equal("Pedido #1 enviado exitosamente", _pageModel.TempData["SuccessMessage"]);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_ChangingToDelivered_ShowsCorrectMessage()
        {
            // Arrange
            var order = CreateTestOrder(1, OrderStatus.Delivered);
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Delivered, It.IsAny<string>()))
                .ReturnsAsync(order);

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Delivered);

            // Assert
            Assert.Equal("Pedido #1 entregado exitosamente", _pageModel.TempData["SuccessMessage"]);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_WithNonExistentOrder_ReturnsNotFound()
        {
            // Arrange
            _mockOrderService.Setup(s => s.OrderExistsAsync(999))
                .ReturnsAsync(false);

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(999, (int)OrderStatus.Confirmed);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_WithInvalidTransition_SetsErrorMessage()
        {
            // Arrange
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Shipped, It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("Invalid status transition"));

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Shipped);

            // Assert
            var redirectResult = Assert.IsType<RedirectToPageResult>(result);
            Assert.Equal("Invalid status transition", _pageModel.TempData["ErrorMessage"]);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_WithInsufficientStock_SetsErrorMessage()
        {
            // Arrange
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Confirmed, It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("Stock insuficiente"));

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Confirmed);

            // Assert
            var redirectResult = Assert.IsType<RedirectToPageResult>(result);
            Assert.Equal("Stock insuficiente", _pageModel.TempData["ErrorMessage"]);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_WithGeneralException_SetsGenericErrorMessage()
        {
            // Arrange
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Confirmed, It.IsAny<string>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Confirmed);

            // Assert
            var redirectResult = Assert.IsType<RedirectToPageResult>(result);
            Assert.Equal("Error al cambiar el estado del pedido", _pageModel.TempData["ErrorMessage"]);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_RedirectsToCorrectPage()
        {
            // Arrange
            var order = CreateTestOrder(5, OrderStatus.Confirmed);
            _mockOrderService.Setup(s => s.OrderExistsAsync(5))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(5, OrderStatus.Confirmed, It.IsAny<string>()))
                .ReturnsAsync(order);

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(5, (int)OrderStatus.Confirmed);

            // Assert
            var redirectResult = Assert.IsType<RedirectToPageResult>(result);
            Assert.Equal(5, redirectResult.RouteValues!["id"]);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_PassesUserIdToService()
        {
            // Arrange
            var order = CreateTestOrder(1, OrderStatus.Confirmed);
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Confirmed, "test-user-id"))
                .ReturnsAsync(order);

            // Act
            await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Confirmed);

            // Assert
            _mockOrderService.Verify(s => s.UpdateOrderStatusAsync(1, OrderStatus.Confirmed, "test-user-id"), Times.Once);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_WithUnknownStatus_ShowsGenericMessage()
        {
            // Arrange
            var order = CreateTestOrder(1, (OrderStatus)99);
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, (OrderStatus)99, It.IsAny<string>()))
                .ReturnsAsync(order);

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, 99);

            // Assert
            Assert.Equal("Pedido #1 actualizado exitosamente", _pageModel.TempData["SuccessMessage"]);
        }

        #endregion

        #region Edge Cases

        [Theory]
        [InlineData(int.MaxValue)]
        [InlineData(int.MinValue)]
        public async Task OnGetAsync_WithExtremeIds_HandlesGracefully(int id)
        {
            // Arrange
            _mockOrderService.Setup(s => s.GetOrderWithDetailsAsync(id))
                .ReturnsAsync((Order?)null);

            // Act
            var result = await _pageModel.OnGetAsync(id);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task OnPostChangeStatusAsync_WithEmptyUserId_StillWorks()
        {
            // Arrange
            var emptyUserContext = new DefaultHttpContext();
            emptyUserContext.User = new ClaimsPrincipal(new ClaimsIdentity());
            _pageModel.PageContext.HttpContext = emptyUserContext;

            var order = CreateTestOrder(1, OrderStatus.Confirmed);
            _mockOrderService.Setup(s => s.OrderExistsAsync(1))
                .ReturnsAsync(true);
            _mockOrderService.Setup(s => s.UpdateOrderStatusAsync(1, OrderStatus.Confirmed, ""))
                .ReturnsAsync(order);

            // Act
            var result = await _pageModel.OnPostChangeStatusAsync(1, (int)OrderStatus.Confirmed);

            // Assert
            var redirectResult = Assert.IsType<RedirectToPageResult>(result);
            _mockOrderService.Verify(s => s.UpdateOrderStatusAsync(1, OrderStatus.Confirmed, ""), Times.Once);
        }

        #endregion

        #region Helper Methods

        private Order CreateTestOrder(int id, OrderStatus status)
        {
            return new Order
            {
                Id = id,
                UserId = "test-user-id",
                Status = status,
                ShippingAddress = "123 Test Street",
                Subtotal = 100.00m,
                Tax = 10.00m,
                Total = 110.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                User = new ApplicationUser
                {
                    Id = "test-user-id",
                    Email = "test@test.com",
                    UserName = "test@test.com",
                    FullName = "Test User"
                },
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        Id = 1,
                        OrderId = id,
                        ProductId = 1,
                        Quantity = 2,
                        ProductNameSnapshot = "Test Product",
                        UnitPriceSnapshot = 50.00m,
                        LineTotal = 100.00m,
                        Product = new Product
                        {
                            Id = 1,
                            Name = "Test Product",
                            Price = 50.00m,
                            Stock = 10
                        }
                    }
                }
            };
        }

        #endregion
    }
}
