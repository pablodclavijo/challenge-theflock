using AdminPanel.Constants;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Products
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class CreateModel : PageModel
    {
        private readonly IProductService _productService;
        private readonly ICategoryService _categoryService;
        private readonly IImageService _imageService;

        public CreateModel(IProductService productService, ICategoryService categoryService, IImageService imageService)
        {
            _productService = productService;
            _categoryService = categoryService;
            _imageService = imageService;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public List<SelectListItem> Categories { get; set; } = new();

        public class InputModel
        {
            [Required(ErrorMessage = "El nombre es requerido")]
            [StringLength(200, ErrorMessage = "El nombre no puede exceder 200 caracteres")]
            [Display(Name = "Nombre")]
            public string Name { get; set; } = default!;

            [Required(ErrorMessage = "La descripción es requerida")]
            [Display(Name = "Descripción")]
            public string Description { get; set; } = default!;

            [Required(ErrorMessage = "El precio es requerido")]
            [Range(0.01, 999999.99, ErrorMessage = "El precio debe estar entre 0.01 y 999,999.99")]
            [Display(Name = "Precio")]
            public decimal Price { get; set; }

            [Required(ErrorMessage = "El stock es requerido")]
            [Range(0, int.MaxValue, ErrorMessage = "El stock debe ser mayor o igual a 0")]
            [Display(Name = "Stock")]
            public int Stock { get; set; }

            [Required(ErrorMessage = "La categoría es requerida")]
            [Display(Name = "Categoría")]
            public int CategoryId { get; set; }

            [Display(Name = "Imagen")]
            public IFormFile? ImageFile { get; set; }

            [Display(Name = "Activo")]
            public bool IsActive { get; set; } = true;
        }

        public async Task OnGetAsync()
        {
            await LoadCategoriesAsync();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                await LoadCategoriesAsync();
                return Page();
            }

            var product = new Product
            {
                Name = Input.Name,
                Description = Input.Description,
                Price = Input.Price,
                Stock = Input.Stock,
                CategoryId = Input.CategoryId,
                IsActive = Input.IsActive
            };

            if (Input.ImageFile != null && Input.ImageFile.Length > 0)
            {
                var imageUrl = await _imageService.SaveImageAsync(Input.ImageFile, "products");
                product.ImageUrl = imageUrl;
            }

            await _productService.CreateProductAsync(product);

            TempData["SuccessMessage"] = $"Producto '{product.Name}' creado exitosamente";
            return RedirectToPage("./Index");
        }

        private async Task LoadCategoriesAsync()
        {
            Categories = await _categoryService.GetCategorySelectListAsync();
        }
    }
}
