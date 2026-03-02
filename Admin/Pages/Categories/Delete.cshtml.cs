using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Categories
{
    [Authorize(Roles = Roles.Admin)]
    public class DeleteModel : PageModel
    {
        private readonly ICategoryService _categoryService;

        public DeleteModel(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [BindProperty]
        public Models.Category Category { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var category = await _categoryService.GetCategoryWithProductsAsync(id.Value);

            if (category == null)
            {
                return NotFound();
            }

            Category = category;

            return Page();
        }

        public async Task<IActionResult> OnPostAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var category = await _categoryService.GetCategoryWithProductsAsync(id.Value);

            if (category == null)
            {
                return NotFound();
            }

            if (category.Products != null && category.Products.Any())
            {
                TempData["ErrorMessage"] = $"No se puede eliminar la categoría '{category.Name}' porque tiene {category.Products.Count} producto(s) asociado(s)";
                return RedirectToPage("./Index");
            }

            await _categoryService.DeleteCategoryAsync(id.Value);

            TempData["SuccessMessage"] = $"Categoría '{category.Name}' eliminada exitosamente";
            return RedirectToPage("./Index");
        }
    }
}
