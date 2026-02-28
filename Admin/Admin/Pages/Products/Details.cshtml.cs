using AdminPanel.Constants;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Products
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class DetailsModel : PageModel
    {
        private readonly IProductService _productService;

        public DetailsModel(IProductService productService)
        {
            _productService = productService;
        }

        public Product Product { get; set; } = default!;
        public List<StockMovement> StockMovements { get; set; } = new();

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
            StockMovements = await _productService.GetProductStockMovementsAsync(id.Value);

            return Page();
        }
    }
}
