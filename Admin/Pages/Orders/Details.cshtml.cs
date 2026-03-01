using AdminPanel.Constants;
using AdminPanel.Enums;
using AdminPanel.Models;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Orders
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class DetailsModel : PageModel
    {
        private readonly IOrderService _orderService;

        public DetailsModel(IOrderService orderService)
        {
            _orderService = orderService;
        }

        public Order Order { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var order = await _orderService.GetOrderWithDetailsAsync(id.Value);

            if (order == null)
            {
                return NotFound();
            }

            Order = order;
            return Page();
        }

        public async Task<IActionResult> OnGetOrderDetailsAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var order = await _orderService.GetOrderWithDetailsAsync(id.Value);

            if (order == null)
            {
                return NotFound();
            }

            Order = order;
            return Partial("_OrderDetailsPartial", Order);
        }

        public async Task<IActionResult> OnPostChangeStatusAsync(int orderId, int newStatus)
        {
            if (!await _orderService.OrderExistsAsync(orderId))
            {
                return NotFound();
            }

            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
                var order = await _orderService.UpdateOrderStatusAsync(orderId, (OrderStatus)newStatus, userId);

                var statusText = ((OrderStatus)newStatus) switch
                {
                    OrderStatus.Confirmed => "confirmado",
                    OrderStatus.Shipped => "enviado",
                    OrderStatus.Delivered => "entregado",
                    _ => "actualizado"
                };

                TempData["SuccessMessage"] = $"Pedido #{order.Id} {statusText} exitosamente";
            }
            catch (InvalidOperationException ex)
            {
                TempData["ErrorMessage"] = ex.Message;
            }
            catch (Exception)
            {
                TempData["ErrorMessage"] = "Error al cambiar el estado del pedido";
            }

            return RedirectToPage(new { id = orderId });
        }
    }
}
