using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Reports
{
    [Authorize(Roles = Roles.Admin)]
    public class IndexModel : PageModel
    {
        private readonly IDashboardService _dashboardService;

        public IndexModel(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
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
            var metrics = await _dashboardService.GetDashboardMetricsAsync();

            TodaySales = metrics.TodayRevenue;
            WeekSales = metrics.WeekRevenue;
            MonthSales = metrics.MonthRevenue;
            TotalSales = metrics.TotalRevenue;

            PendingOrders = metrics.PendingOrders;
            ConfirmedOrders = metrics.ConfirmedOrders;
            ShippedOrders = metrics.ShippedOrders;
            DeliveredOrders = metrics.DeliveredOrders;

            TopProducts = metrics.TopProducts.Select(p => new TopProductViewModel
            {
                ProductName = p.ProductName,
                QuantitySold = p.QuantitySold,
                TotalRevenue = p.TotalRevenue
            }).ToList();

            TotalOrders = metrics.TotalOrders;
            TotalProducts = metrics.TotalProducts;
            TotalCategories = metrics.TotalCategories;
            TotalUsers = metrics.TotalUsers;
            LowStockProducts = metrics.LowStockProducts;
        }
    }
}
