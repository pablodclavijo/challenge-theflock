using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Categories
{
    [Authorize(Roles = Roles.Admin)]
    public class CreateModel : PageModel
    {
        private readonly ICategoryService _categoryService;

        public CreateModel(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public class InputModel
        {
            [Required(ErrorMessage = "El nombre es requerido")]
            [StringLength(150, ErrorMessage = "El nombre no puede exceder {1} caracteres")]
            [Display(Name = "Nombre de la Categoría")]
            public string Name { get; set; } = default!;

            [Display(Name = "Activa")]
            public bool IsActive { get; set; } = true;
        }

        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            var category = new Models.Category
            {
                Name = Input.Name,
                IsActive = Input.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            await _categoryService.CreateCategoryAsync(category);

            TempData["SuccessMessage"] = $"Categoría '{category.Name}' creada exitosamente";
            return RedirectToPage("./Index");
        }
    }
}
