using AdminPanel.Constants;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Categories
{
    [Authorize(Roles = Roles.Admin)]
    public class IndexModel : PageModel
    {
        private readonly ICategoryService _categoryService;

        public IndexModel(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        public PaginatedList<CategoryViewModel> Categories { get; set; } = default!;

        [BindProperty(SupportsGet = true)]
        public string? SearchString { get; set; }

        [BindProperty(SupportsGet = true)]
        public bool? IsActive { get; set; }

        [BindProperty(SupportsGet = true)]
        public string? SortOrder { get; set; }

        [BindProperty(SupportsGet = true)]
        public int PageIndex { get; set; } = 1;

        public string? CurrentFilter => SearchString;
        public bool? CurrentStatus => IsActive;
        public string? CurrentSort => SortOrder;

        public class CategoryViewModel
        {
            public int Id { get; set; }
            public string Name { get; set; } = default!;
            public bool IsActive { get; set; }
            public DateTime CreatedAt { get; set; }
            public int ProductCount { get; set; }
        }

        public async Task OnGetAsync()
        {
            var query = _categoryService.GetCategoriesQuery();

            if (!string.IsNullOrEmpty(SearchString))
            {
                query = query.Where(c => c.Name.Contains(SearchString));
            }

            if (IsActive.HasValue)
            {
                query = query.Where(c => c.IsActive == IsActive.Value);
            }

            query = SortOrder switch
            {
                "name_desc" => query.OrderByDescending(c => c.Name),
                "date" => query.OrderBy(c => c.CreatedAt),
                "date_desc" => query.OrderByDescending(c => c.CreatedAt),
                "products" => query.OrderBy(c => c.Products.Count),
                "products_desc" => query.OrderByDescending(c => c.Products.Count),
                _ => query.OrderBy(c => c.Name)
            };

            var viewModelQuery = query.Select(c => new CategoryViewModel
            {
                Id = c.Id,
                Name = c.Name,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                ProductCount = c.Products.Count
            });

            Categories = await PaginatedList<CategoryViewModel>.CreateAsync(viewModelQuery, PageIndex, 10);
        }
    }
}
