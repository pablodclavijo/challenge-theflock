using AdminPanel.Data;
using AdminPanel.Enums;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IOrderService _orderService;

        public DashboardService(ApplicationDbContext context, IOrderService orderService)
        {
            _context = context;
            _orderService = orderService;
        }

        public async Task<DashboardMetrics> GetDashboardMetricsAsync()
        {
            var today = DateTime.UtcNow.Date;
            var weekAgo = today.AddDays(-7);
            var monthAgo = today.AddMonths(-1);

            var metrics = new DashboardMetrics
            {
                TotalProducts = await _context.Products.CountAsync(),
                TotalCategories = await _context.Categories.CountAsync(),
                TotalOrders = await _context.Orders.CountAsync(),
                TotalUsers = await _context.Users.CountAsync(),

                TotalRevenue = await _orderService.GetSalesByPeriodAsync(DateTime.MinValue, DateTime.MaxValue),
                TodayRevenue = await _orderService.GetSalesByPeriodAsync(today, today.AddDays(1).AddSeconds(-1)),
                WeekRevenue = await _orderService.GetSalesByPeriodAsync(weekAgo, DateTime.UtcNow),
                MonthRevenue = await _orderService.GetSalesByPeriodAsync(monthAgo, DateTime.UtcNow),

                LowStockProducts = await _context.Products
                    .Where(p => p.Stock < 10 && p.Stock > 0)
                    .CountAsync(),

                TodayOrders = await _context.Orders
                    .Where(o => o.CreatedAt.Date == today)
                    .CountAsync(),

                PendingOrders = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Pending),
                ConfirmedOrders = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Confirmed),
                ShippedOrders = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Shipped),
                DeliveredOrders = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Delivered),
                PaidOrders = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Paid),
                PaymentFailedOrders = await _orderService.GetOrderCountByStatusAsync(OrderStatus.PaymentFailed),

                TopProducts = await _orderService.GetTopSellingProductsAsync(10)
            };

            return metrics;
        }

        public async Task<DashboardMetrics> GetVendedorDashboardMetricsAsync()
        {
            var today = DateTime.UtcNow.Date;

            var metrics = new DashboardMetrics
            {
                TotalProducts = await _context.Products.CountAsync(),
                TotalOrders = await _context.Orders.CountAsync(),

                TotalRevenue = await _orderService.GetSalesByPeriodAsync(DateTime.MinValue, DateTime.MaxValue),
                TodayRevenue = await _orderService.GetSalesByPeriodAsync(today, today.AddDays(1).AddSeconds(-1)),

                LowStockProducts = await _context.Products
                    .Where(p => p.Stock < 10 && p.Stock > 0)
                    .CountAsync(),

                TodayOrders = await _context.Orders
                    .Where(o => o.CreatedAt.Date == today)
                    .CountAsync(),

                PendingOrders = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Pending)
            };

            return metrics;
        }
    }
}
