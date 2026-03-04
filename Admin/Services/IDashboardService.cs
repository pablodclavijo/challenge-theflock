namespace AdminPanel.Services
{
    public interface IDashboardService
    {
        Task<DashboardMetrics> GetDashboardMetricsAsync();
        Task<DashboardMetrics> GetVendedorDashboardMetricsAsync();
    }

    public class DashboardMetrics
    {
        public int TotalProducts { get; set; }
        public int TotalCategories { get; set; }
        public int TotalOrders { get; set; }
        public int TotalUsers { get; set; }
        public decimal TotalRevenue { get; set; }
        public int LowStockProducts { get; set; }
        public int PendingOrders { get; set; }
        public int TodayOrders { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal WeekRevenue { get; set; }
        public decimal MonthRevenue { get; set; }
        public int ConfirmedOrders { get; set; }
        public int ShippedOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public int PaidOrders { get; set; }
        public int PaymentFailedOrders { get; set; }
        public List<TopProductDto> TopProducts { get; set; } = new();
    }
}
