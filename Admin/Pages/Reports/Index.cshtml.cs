using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages.Reports
{
    [Authorize(Roles = Roles.Admin)]
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _context;

        public IndexModel(ApplicationDbContext context)
        {
            _context = context;
        }

        // Ventas por período
        public decimal TodaySales { get; set; }
        public decimal WeekSales { get; set; }
        public decimal MonthSales { get; set; }
        public decimal TotalSales { get; set; }

        // Órdenes por estado
        public int PendingOrders { get; set; }
        public int ConfirmedOrders { get; set; }
        public int ShippedOrders { get; set; }
        public int DeliveredOrders { get; set; }

        // Productos más vendidos
        public List<TopProductViewModel> TopProducts { get; set; } = new();

        // Estadísticas generales
        public int TotalOrders { get; set; }
        public int TotalProducts { get; set; }
        public int TotalCategories { get; set; }
        public int TotalUsers { get; set; }
        public int LowStockProducts { get; set; }

        public class TopProductViewModel
        {
            public string ProductName { get; set; } = default!;
            public int QuantitySold { get; set; }
            public decimal TotalRevenue { get; set; }
        }

        public async Task OnGetAsync()
        {
            var today = DateTime.UtcNow.Date;
            var weekAgo = today.AddDays(-7);
            var monthAgo = today.AddMonths(-1);

            // Ventas por período
            TodaySales = await _context.Orders
                .Where(o => o.CreatedAt.Date == today && o.Status == OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.Total) ?? 0;

            WeekSales = await _context.Orders
                .Where(o => o.CreatedAt >= weekAgo && o.Status == OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.Total) ?? 0;

            MonthSales = await _context.Orders
                .Where(o => o.CreatedAt >= monthAgo && o.Status == OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.Total) ?? 0;

            TotalSales = await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.Total) ?? 0;

            // Órdenes por estado
            PendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
            ConfirmedOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Confirmed);
            ShippedOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Shipped);
            DeliveredOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Delivered);

            // Productos más vendidos
            TopProducts = await _context.OrderItems
                .GroupBy(oi => new { oi.ProductId, oi.ProductNameSnapshot })
                .Select(g => new TopProductViewModel
                {
                    ProductName = g.Key.ProductNameSnapshot,
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.LineTotal)
                })
                .OrderByDescending(p => p.QuantitySold)
                .Take(10)
                .ToListAsync();

            // Estadísticas generales
            TotalOrders = await _context.Orders.CountAsync();
            TotalProducts = await _context.Products.CountAsync();
            TotalCategories = await _context.Categories.CountAsync();
            TotalUsers = await _context.Users.CountAsync();
            LowStockProducts = await _context.Products.CountAsync(p => p.Stock < 10 && p.Stock > 0);
        }
    }
}
