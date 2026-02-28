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
    public class IndexModel : PageModel
    {
        private readonly IProductService _productService;
        private readonly ICategoryService _categoryService;
        private readonly IWebHostEnvironment _environment;

        public IndexModel(IProductService productService, ICategoryService categoryService, IWebHostEnvironment environment)
        {
            _productService = productService;
            _categoryService = categoryService;
            _environment = environment;
        }

        public PaginatedList<Product> Products { get; set; } = default!;
        public string CurrentFilter { get; set; } = string.Empty;
        public string CurrentSort { get; set; } = string.Empty;
        public int? CurrentCategory { get; set; }
        public bool? CurrentStatus { get; set; }
        public List<SelectListItem> Categories { get; set; } = new();

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public class InputModel
        {
            public int? Id { get; set; }

            [Required(ErrorMessage = "El nombre es requerido")]
            [StringLength(200, ErrorMessage = "El nombre no puede exceder 200 caracteres")]
            public string Name { get; set; } = default!;

            [Required(ErrorMessage = "La descripción es requerida")]
            public string Description { get; set; } = default!;

            [Required(ErrorMessage = "El precio es requerido")]
            [Range(0.01, 999999.99, ErrorMessage = "El precio debe estar entre 0.01 y 999,999.99")]
            public decimal Price { get; set; }

            [Required(ErrorMessage = "El stock es requerido")]
            [Range(0, int.MaxValue, ErrorMessage = "El stock debe ser mayor o igual a 0")]
            public int Stock { get; set; } = 0;

            [Required(ErrorMessage = "La categoría es requerida")]
            public int CategoryId { get; set; }

            public IFormFile? ImageFile { get; set; }

            public bool IsActive { get; set; } = true;

            public bool RemoveImage { get; set; } = false;
        }

        public async Task OnGetAsync(string? searchString, string? sortOrder, int? categoryId, bool? isActive, int? pageIndex)
        {
            CurrentFilter = searchString ?? string.Empty;
            CurrentSort = sortOrder ?? string.Empty;
            CurrentCategory = categoryId;
            CurrentStatus = isActive;

            await LoadCategoriesAsync();

            IQueryable<Product> productsQuery = _productService.GetProductsQuery();

            if (!string.IsNullOrEmpty(searchString))
            {
                productsQuery = productsQuery.Where(p => 
                    p.Name.Contains(searchString) || 
                    p.Description.Contains(searchString));
            }

            if (categoryId.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.CategoryId == categoryId.Value);
            }

            if (isActive.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.IsActive == isActive.Value);
            }

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

        public async Task<IActionResult> OnPostSaveAsync()
        {
            if (!ModelState.IsValid)
            {
                return new JsonResult(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            Product product;
            bool isNew = !Input.Id.HasValue;

            if (isNew)
            {
                product = new Product();
            }
            else
            {
                product = await _productService.GetProductByIdAsync(Input.Id.Value);
                if (product == null)
                {
                    return new JsonResult(new { success = false, errors = new[] { "Producto no encontrado" } });
                }
            }

            product.Name = Input.Name;
            product.Description = Input.Description;
            product.Price = Input.Price;
            product.Stock = Input.Stock;
            product.CategoryId = Input.CategoryId;
            product.IsActive = Input.IsActive;

            if (Input.RemoveImage && !string.IsNullOrEmpty(product.ImageUrl))
            {
                DeleteImage(product.ImageUrl);
                product.ImageUrl = null;
            }

            if (Input.ImageFile != null && Input.ImageFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(product.ImageUrl))
                {
                    DeleteImage(product.ImageUrl);
                }

                var imageUrl = await SaveImageAsync(Input.ImageFile);
                product.ImageUrl = imageUrl;
            }

            if (isNew)
            {
                await _productService.CreateProductAsync(product);
            }
            else
            {
                await _productService.UpdateProductAsync(product);
            }

            return new JsonResult(new 
            { 
                success = true, 
                message = isNew ? $"Producto '{product.Name}' creado exitosamente" : $"Producto '{product.Name}' actualizado exitosamente" 
            });
        }

        public async Task<IActionResult> OnPostQuickStockUpdateAsync(int productId, int newStock)
        {
            var product = await _productService.GetProductByIdAsync(productId);
            if (product == null)
            {
                return new JsonResult(new { success = false, message = "Producto no encontrado" });
            }

            var oldStock = product.Stock;

            try
            {
                await _productService.QuickUpdateStockAsync(productId, newStock, GetUserId());
            }
            catch (Exception)
            {
                return new JsonResult(new { success = false, message = "Error al actualizar el stock" });
            }

            return new JsonResult(new 
            { 
                success = true, 
                message = $"Stock de '{product.Name}' actualizado: {oldStock} ? {newStock} unidades" 
            });
        }

        public async Task<IActionResult> OnGetProductDataAsync(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return new JsonResult(new { success = false });
            }

            return new JsonResult(new
            {
                success = true,
                data = new
                {
                    product.Id,
                    product.Name,
                    product.Description,
                    product.Price,
                    product.Stock,
                    product.CategoryId,
                    product.IsActive,
                    product.ImageUrl
                }
            });
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

        private string GetUserId()
        {
            return User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        }
    }
}
