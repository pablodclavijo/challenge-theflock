using AdminPanel.Constants;
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages.Categories
{
    [Authorize(Roles = Roles.Admin)]
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _context;

        public IndexModel(ApplicationDbContext context)
        {
            _context = context;
        }

        public List<Category> Categories { get; set; } = new();

        public async Task OnGetAsync()
        {
            Categories = await _context.Categories
                .Include(c => c.Products)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
    }
}
