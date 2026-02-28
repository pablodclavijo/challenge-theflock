using AdminPanel.Constants;
using AdminPanel.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _context;

        public IndexModel(ApplicationDbContext context)
        {
            _context = context;
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

            TotalProducts = await _context.Products.CountAsync();
            TotalOrders = await _context.Orders.CountAsync();

            TotalRevenue = await _context.Orders
                .Where(o => o.Status == Enums.OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.Total) ?? 0;

            LowStockProducts = await _context.Products
                .Where(p => p.Stock < 10 && p.Stock > 0)
                .CountAsync();

            PendingOrders = await _context.Orders
                .Where(o => o.Status == Enums.OrderStatus.Pending)
                .CountAsync();

            var today = DateTime.UtcNow.Date;
            TodayOrders = await _context.Orders
                .Where(o => o.CreatedAt.Date == today)
                .CountAsync();

            TodayRevenue = await _context.Orders
                .Where(o => o.CreatedAt.Date == today && o.Status == Enums.OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.Total) ?? 0;

            // Solo admin ve estas estadísticas
            if (IsAdmin)
            {
                TotalCategories = await _context.Categories.CountAsync();
                TotalUsers = await _context.Users.CountAsync();
            }
        }
    }
}
