using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages.Orders
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _context;

        public IndexModel(ApplicationDbContext context)
        {
            _context = context;
        }

        public PaginatedList<Order> Orders { get; set; } = default!;
        public string CurrentStatusFilter { get; set; } = string.Empty;

        public async Task OnGetAsync(string? statusFilter, int? pageIndex)
        {
            CurrentStatusFilter = statusFilter ?? string.Empty;

            IQueryable<Order> ordersQuery = _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .AsQueryable();

            // Filtro por estado
            if (!string.IsNullOrEmpty(statusFilter) && Enum.TryParse<Enums.OrderStatus>(statusFilter, out var status))
            {
                ordersQuery = ordersQuery.Where(o => o.Status == status);
            }

            ordersQuery = ordersQuery.OrderByDescending(o => o.CreatedAt);

            int pageSize = 15;
            Orders = await PaginatedList<Order>.CreateAsync(
                ordersQuery, pageIndex ?? 1, pageSize);
        }
    }
}
