using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class IndexModel : PageModel
    {
        private readonly IDashboardService _dashboardService;

        public IndexModel(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        public int TotalProducts { get; set; }
        public int TotalCategories { get; set; }
        public int TotalOrders { get; set; }
        public int TotalUsers { get; set; }
        public decimal TotalRevenue { get; set; }
        public int LowStockProducts { get; set; }
        public int PendingOrders { get; set; }
        public int TodayOrders { get; set; }
        public decimal TodayRevenue { get; set; }
        public bool IsAdmin { get; set; }

        public async Task OnGetAsync()
        {
            IsAdmin = User.IsInRole(Roles.Admin);

            if (IsAdmin)
            {
                var metrics = await _dashboardService.GetDashboardMetricsAsync();
                
                TotalProducts = metrics.TotalProducts;
                TotalCategories = metrics.TotalCategories;
                TotalOrders = metrics.TotalOrders;
                TotalUsers = metrics.TotalUsers;
                TotalRevenue = metrics.TotalRevenue;
                LowStockProducts = metrics.LowStockProducts;
                PendingOrders = metrics.PendingOrders;
                TodayOrders = metrics.TodayOrders;
                TodayRevenue = metrics.TodayRevenue;
            }
            else
            {
                var metrics = await _dashboardService.GetVendedorDashboardMetricsAsync();
                
                TotalProducts = metrics.TotalProducts;
                TotalOrders = metrics.TotalOrders;
                TotalRevenue = metrics.TotalRevenue;
                LowStockProducts = metrics.LowStockProducts;
                PendingOrders = metrics.PendingOrders;
                TodayOrders = metrics.TodayOrders;
                TodayRevenue = metrics.TodayRevenue;
            }
        }
    }
}
