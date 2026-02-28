using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages.Products
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _context;

        public IndexModel(ApplicationDbContext context)
        {
            _context = context;
        }

        public PaginatedList<Product> Products { get; set; } = default!;
        public string CurrentFilter { get; set; } = string.Empty;
        public string CurrentSort { get; set; } = string.Empty;

        public async Task OnGetAsync(string? searchString, string? sortOrder, int? pageIndex)
        {
            CurrentFilter = searchString ?? string.Empty;
            CurrentSort = sortOrder ?? string.Empty;

            IQueryable<Product> productsQuery = _context.Products
                .Include(p => p.Category)
                .AsQueryable();

            // Filtro de búsqueda
            if (!string.IsNullOrEmpty(searchString))
            {
                productsQuery = productsQuery.Where(p => 
                    p.Name.Contains(searchString) || 
                    p.Description.Contains(searchString));
            }

            // Ordenamiento
            productsQuery = sortOrder switch
            {
                "name_desc" => productsQuery.OrderByDescending(p => p.Name),
                "price" => productsQuery.OrderBy(p => p.Price),
                "price_desc" => productsQuery.OrderByDescending(p => p.Price),
                "stock" => productsQuery.OrderBy(p => p.Stock),
                "stock_desc" => productsQuery.OrderByDescending(p => p.Stock),
                _ => productsQuery.OrderBy(p => p.Name)
            };

            int pageSize = 10;
            Products = await PaginatedList<Product>.CreateAsync(
                productsQuery, pageIndex ?? 1, pageSize);
        }
    }
}
