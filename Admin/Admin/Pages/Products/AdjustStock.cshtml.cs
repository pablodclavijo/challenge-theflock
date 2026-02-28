using AdminPanel.Constants;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Products
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class AdjustStockModel : PageModel
    {
        private readonly IProductService _productService;

        public AdjustStockModel(IProductService productService)
        {
            _productService = productService;
        }

        public Product Product { get; set; } = default!;

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public class InputModel
        {
            public int ProductId { get; set; }

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

        public async Task<IActionResult> OnGetAsync(int? id)
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

            Product = product;
            Input = new InputModel
            {
                ProductId = product.Id,
                AdjustmentType = AdjustmentType.Add,
                Quantity = 1
            };

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                Product = await _productService.GetProductWithCategoryAsync(Input.ProductId) ?? default!;
                return Page();
            }

            var product = await _productService.GetProductByIdAsync(Input.ProductId);

            if (product == null)
            {
                return NotFound();
            }

            var oldStock = product.Stock;
            var newStock = CalculateNewStock(oldStock, Input.Quantity, Input.AdjustmentType);
            var reason = Input.Reason ?? "Ajuste manual";

            await _productService.AdjustStockAsync(Input.ProductId, newStock, Input.AdjustmentType.ToString(), reason, GetUserId());

            TempData["SuccessMessage"] = $"Stock de '{product.Name}' actualizado: {oldStock} ? {newStock} unidades";

            return RedirectToPage("./Details", new { id = product.Id });
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

        private string GetUserId()
        {
            return User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        }
    }
}
