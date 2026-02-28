using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Products
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class ToggleStatusModel : PageModel
    {
        private readonly IProductService _productService;

        public ToggleStatusModel(IProductService productService)
        {
            _productService = productService;
        }

        public async Task<IActionResult> OnPostAsync(int? id)
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

            var returnUrl = Request.Query["returnUrl"].ToString();
            if (!string.IsNullOrEmpty(returnUrl))
            {
                return LocalRedirect(returnUrl);
            }

            return RedirectToPage("./Index");
        }
    }
}
