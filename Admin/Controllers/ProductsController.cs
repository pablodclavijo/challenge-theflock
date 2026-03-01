using AdminPanel.Constants;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Controllers
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class ProductsController : Controller
    {
        private readonly IProductService _productService;
        private readonly ICategoryService _categoryService;
        private readonly IImageService _imageService;

        public ProductsController(
            IProductService productService, 
            ICategoryService categoryService, 
            IImageService imageService)
        {
            _productService = productService;
            _categoryService = categoryService;
            _imageService = imageService;
        }

        // GET: Products
        public async Task<IActionResult> Index(string? searchString, string? sortOrder, int? categoryId, bool? isActive, int? pageIndex)
        {
            ViewData["CurrentFilter"] = searchString ?? string.Empty;
            ViewData["CurrentSort"] = sortOrder ?? string.Empty;
            ViewData["CurrentCategory"] = categoryId;
            ViewData["CurrentStatus"] = isActive;
            ViewData["Categories"] = await _categoryService.GetCategorySelectListAsync();

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
            var products = await PaginatedList<Product>.CreateAsync(productsQuery, pageIndex ?? 1, pageSize);

            return View(products);
        }

        // GET: Products/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var product = await _productService.GetProductWithCategoryAsync(id.Value);

            if (product == null)
            {
                return NotFound();
            }

            var stockMovements = await _productService.GetProductStockMovementsAsync(id.Value);
            ViewBag.StockMovements = stockMovements;

            return PartialView("_ProductDetailsModal", product);
        }

        // GET: Products/Create
        public async Task<IActionResult> Create()
        {
            ViewBag.Categories = await _categoryService.GetCategorySelectListAsync();
            return View();
        }

        // POST: Products/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ProductCreateViewModel model)
        {
            if (!ModelState.IsValid)
            {
                ViewBag.Categories = await _categoryService.GetCategorySelectListAsync();
                return View(model);
            }

            var product = new Product
            {
                Name = model.Name,
                Description = model.Description,
                Price = model.Price,
                Stock = model.Stock,
                CategoryId = model.CategoryId,
                IsActive = model.IsActive
            };

            if (model.ImageFile != null && model.ImageFile.Length > 0)
            {
                var imageUrl = await _imageService.SaveImageAsync(model.ImageFile, "products");
                product.ImageUrl = imageUrl;
            }

            await _productService.CreateProductAsync(product);

            TempData["SuccessMessage"] = $"Producto '{product.Name}' creado exitosamente";
            return RedirectToAction(nameof(Index));
        }

        // GET: Products/Edit/5
        public async Task<IActionResult> Edit(int? id)
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

            var model = new ProductEditViewModel
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                IsActive = product.IsActive,
                CurrentImageUrl = product.ImageUrl
            };

            ViewBag.Categories = await _categoryService.GetCategorySelectListAsync();
            return View(model);
        }

        // POST: Products/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, ProductEditViewModel model)
        {
            if (id != model.Id)
            {
                return NotFound();
            }

            if (!ModelState.IsValid)
            {
                ViewBag.Categories = await _categoryService.GetCategorySelectListAsync();
                return View(model);
            }

            var product = await _productService.GetProductByIdAsync(model.Id);

            if (product == null)
            {
                return NotFound();
            }

            product.Name = model.Name;
            product.Description = model.Description;
            product.Price = model.Price;
            product.Stock = model.Stock;
            product.CategoryId = model.CategoryId;
            product.IsActive = model.IsActive;

            if (model.RemoveImage && !string.IsNullOrEmpty(product.ImageUrl))
            {
                _imageService.DeleteImage(product.ImageUrl);
                product.ImageUrl = null;
            }

            if (model.ImageFile != null && model.ImageFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(product.ImageUrl))
                {
                    _imageService.DeleteImage(product.ImageUrl);
                }

                var imageUrl = await _imageService.SaveImageAsync(model.ImageFile, "products");
                product.ImageUrl = imageUrl;
            }

            try
            {
                await _productService.UpdateProductAsync(product);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _productService.ProductExistsAsync(model.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            TempData["SuccessMessage"] = $"Producto '{product.Name}' actualizado exitosamente";
            return RedirectToAction(nameof(Index));
        }

        // GET: Products/AdjustStock/5
        public async Task<IActionResult> AdjustStock(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var product = await _productService.GetProductWithCategoryAsync(id.Value);

            if (product == null)
            {
                return NotFound();
            }

            var model = new StockAdjustmentViewModel
            {
                ProductId = product.Id,
                ProductName = product.Name,
                CurrentStock = product.Stock,
                AdjustmentType = AdjustmentType.Add,
                Quantity = 1
            };

            ViewBag.Product = product;
            return View(model);
        }

        // POST: Products/AdjustStock/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AdjustStock(StockAdjustmentViewModel model)
        {
            if (!ModelState.IsValid)
            {
                var product = await _productService.GetProductWithCategoryAsync(model.ProductId);
                ViewBag.Product = product;
                return View(model);
            }

            var productToUpdate = await _productService.GetProductByIdAsync(model.ProductId);

            if (productToUpdate == null)
            {
                return NotFound();
            }

            var oldStock = productToUpdate.Stock;
            var newStock = CalculateNewStock(oldStock, model.Quantity, model.AdjustmentType);
            var reason = model.Reason ?? "Ajuste manual";
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";

            await _productService.AdjustStockAsync(model.ProductId, newStock, model.AdjustmentType.ToString(), reason, userId);

            TempData["SuccessMessage"] = $"Stock de '{productToUpdate.Name}' actualizado: {oldStock} ? {newStock} unidades";

            return RedirectToAction(nameof(Details), new { id = model.ProductId });
        }

        // POST: Products/ToggleStatus/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ToggleStatus(int? id, string? returnUrl)
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

            await _productService.ToggleProductStatusAsync(id.Value);

            TempData["SuccessMessage"] = $"Producto '{product.Name}' {(product.IsActive ? "desactivado" : "activado")} exitosamente";

            if (!string.IsNullOrEmpty(returnUrl))
            {
                return LocalRedirect(returnUrl);
            }

            return RedirectToAction(nameof(Index));
        }

        // AJAX: Get product data
        [HttpGet]
        public async Task<IActionResult> GetProductData(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return Json(new { success = false });
            }

            return Json(new
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

        // AJAX: Quick stock update
        [HttpPost]
        public async Task<IActionResult> QuickStockUpdate(int productId, int newStock)
        {
            var product = await _productService.GetProductByIdAsync(productId);
            if (product == null)
            {
                return Json(new { success = false, message = "Producto no encontrado" });
            }

            var oldStock = product.Stock;
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";

            try
            {
                await _productService.QuickUpdateStockAsync(productId, newStock, userId);
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "Error al actualizar el stock" });
            }

            return Json(new 
            { 
                success = true, 
                message = $"Stock de '{product.Name}' actualizado: {oldStock} ? {newStock} unidades" 
            });
        }

        // AJAX: Save product (for modal editing)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveProduct(ProductEditViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            Product product;
            bool isNew = model.Id == 0;

            if (isNew)
            {
                product = new Product();
            }
            else
            {
                product = await _productService.GetProductByIdAsync(model.Id);
                if (product == null)
                {
                    return Json(new { success = false, errors = new[] { "Producto no encontrado" } });
                }
            }

            product.Name = model.Name;
            product.Description = model.Description;
            product.Price = model.Price;
            product.Stock = model.Stock;
            product.CategoryId = model.CategoryId;
            product.IsActive = model.IsActive;

            if (model.RemoveImage && !string.IsNullOrEmpty(product.ImageUrl))
            {
                _imageService.DeleteImage(product.ImageUrl);
                product.ImageUrl = null;
            }

            if (model.ImageFile != null && model.ImageFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(product.ImageUrl))
                {
                    _imageService.DeleteImage(product.ImageUrl);
                }

                var imageUrl = await _imageService.SaveImageAsync(model.ImageFile, "products");
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

            return Json(new 
            { 
                success = true, 
                message = isNew ? $"Producto '{product.Name}' creado exitosamente" : $"Producto '{product.Name}' actualizado exitosamente" 
            });
        }

        private int CalculateNewStock(int currentStock, int quantity, AdjustmentType adjustmentType)
        {
            return adjustmentType switch
            {
                AdjustmentType.Add => currentStock + quantity,
                AdjustmentType.Subtract => Math.Max(0, currentStock - quantity),
                AdjustmentType.Set => quantity,
                _ => currentStock
            };
        }
    }

    // View Models
    public class ProductCreateViewModel
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

    public class ProductEditViewModel
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

        public string? CurrentImageUrl { get; set; }
    }

    public class StockAdjustmentViewModel
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = default!;
        public int CurrentStock { get; set; }

        [Required(ErrorMessage = "El tipo de ajuste es requerido")]
        [Display(Name = "Tipo de Ajuste")]
        public AdjustmentType AdjustmentType { get; set; }

        [Required(ErrorMessage = "La cantidad es requerida")]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0")]
        [Display(Name = "Cantidad")]
        public int Quantity { get; set; }

        [Display(Name = "Motivo")]
        [StringLength(500, ErrorMessage = "El motivo no puede exceder 500 caracteres")]
        public string? Reason { get; set; }
    }

    public enum AdjustmentType
    {
        [Display(Name = "Agregar (Entrada de mercancía)")]
        Add,
        [Display(Name = "Restar (Salida de mercancía)")]
        Subtract,
        [Display(Name = "Establecer cantidad exacta")]
        Set
    }
}
