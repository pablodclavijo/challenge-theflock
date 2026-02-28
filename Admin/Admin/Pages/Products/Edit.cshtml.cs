using AdminPanel.Constants;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Products
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class EditModel : PageModel
    {
        private readonly IProductService _productService;
        private readonly ICategoryService _categoryService;
        private readonly IWebHostEnvironment _environment;

        public EditModel(IProductService productService, ICategoryService categoryService, IWebHostEnvironment environment)
        {
            _productService = productService;
            _categoryService = categoryService;
            _environment = environment;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public List<SelectListItem> Categories { get; set; } = new();
        public string? CurrentImageUrl { get; set; }

        public class InputModel
        {
            public int Id { get; set; }

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

            [Display(Name = "Nueva Imagen")]
            public IFormFile? ImageFile { get; set; }

            [Display(Name = "Activo")]
            public bool IsActive { get; set; }

            [Display(Name = "Eliminar imagen actual")]
            public bool RemoveImage { get; set; }
        }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var product = await _productService.GetProductByIdAsync(id.Value);

            if (product == null)
            {
                return NotFound();
            }

            Input = new InputModel
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                IsActive = product.IsActive
            };

            CurrentImageUrl = product.ImageUrl;
            await LoadCategoriesAsync();

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                await LoadCategoriesAsync();
                var productForImage = await _productService.GetProductByIdAsync(Input.Id);
                CurrentImageUrl = productForImage?.ImageUrl;
                return Page();
            }

            var product = await _productService.GetProductByIdAsync(Input.Id);

            if (product == null)
            {
                return NotFound();
            }

            product.Name = Input.Name;
            product.Description = Input.Description;
            product.Price = Input.Price;
            product.Stock = Input.Stock;
            product.CategoryId = Input.CategoryId;
            product.IsActive = Input.IsActive;

            // Handle image removal
            if (Input.RemoveImage && !string.IsNullOrEmpty(product.ImageUrl))
            {
                DeleteImage(product.ImageUrl);
                product.ImageUrl = null;
            }

            // Handle new image upload
            if (Input.ImageFile != null && Input.ImageFile.Length > 0)
            {
                // Delete old image if exists
                if (!string.IsNullOrEmpty(product.ImageUrl))
                {
                    DeleteImage(product.ImageUrl);
                }

                var imageUrl = await SaveImageAsync(Input.ImageFile);
                product.ImageUrl = imageUrl;
            }

            try
            {
                await _productService.UpdateProductAsync(product);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _productService.ProductExistsAsync(Input.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            TempData["SuccessMessage"] = $"Producto '{product.Name}' actualizado exitosamente";
            return RedirectToPage("./Index");
        }

        private async Task LoadCategoriesAsync()
        {
            Categories = await _categoryService.GetCategorySelectListAsync();
        }

        private async Task<string> SaveImageAsync(IFormFile imageFile)
        {
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "products");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var fileExtension = Path.GetExtension(imageFile.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            return $"/uploads/products/{fileName}";
        }

        private void DeleteImage(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return;

            var filePath = Path.Combine(_environment.WebRootPath, imageUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
    }
}
