using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Categories
{
    [Authorize(Roles = Roles.Admin)]
    public class EditModel : PageModel
    {
        private readonly ICategoryService _categoryService;

        public EditModel(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public class InputModel
        {
            public int Id { get; set; }

            [Required(ErrorMessage = "El nombre es requerido")]
            [StringLength(150, ErrorMessage = "El nombre no puede exceder {1} caracteres")]
            [Display(Name = "Nombre de la Categoría")]
            public string Name { get; set; } = default!;

            [Display(Name = "Activa")]
            public bool IsActive { get; set; }
        }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var category = await _categoryService.GetCategoryByIdAsync(id.Value);

            if (category == null)
            {
                return NotFound();
            }

            Input = new InputModel
            {
                Id = category.Id,
                Name = category.Name,
                IsActive = category.IsActive
            };

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            var category = await _categoryService.GetCategoryByIdAsync(Input.Id);

            if (category == null)
            {
                return NotFound();
            }

            category.Name = Input.Name;
            category.IsActive = Input.IsActive;

            await _categoryService.UpdateCategoryAsync(category);

            TempData["SuccessMessage"] = $"Categoría '{category.Name}' actualizada exitosamente";
            return RedirectToPage("./Index");
        }
    }
}
