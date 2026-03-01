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
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }

        public async Task OnGetAsync(string? statusFilter, DateTime? dateFrom, DateTime? dateTo, int? pageIndex)
        {
            CurrentStatusFilter = statusFilter ?? string.Empty;
            DateFrom = dateFrom;
            DateTo = dateTo;

            IQueryable<Order> ordersQuery = _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .AsQueryable();

            // Filtro por estado
            if (!string.IsNullOrEmpty(statusFilter) && Enum.TryParse<Enums.OrderStatus>(statusFilter, out var status))
            {
                ordersQuery = ordersQuery.Where(o => o.Status == status);
            }

            // Filtro por rango de fechas
            if (dateFrom.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.CreatedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                var dateToEnd = dateTo.Value.AddDays(1);
                ordersQuery = ordersQuery.Where(o => o.CreatedAt < dateToEnd);
            }

            ordersQuery = ordersQuery.OrderByDescending(o => o.CreatedAt);

            int pageSize = 15;
            Orders = await PaginatedList<Order>.CreateAsync(
                ordersQuery, pageIndex ?? 1, pageSize);
        }
    }
}
