using AdminPanel.Constants;
using AdminPanel.Enums;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Orders
{
    [Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
    public class ChangeStatusModel : PageModel
    {
        private readonly IOrderService _orderService;

        public ChangeStatusModel(IOrderService orderService)
        {
            _orderService = orderService;
        }

        public async Task<IActionResult> OnPostChangeStatusAsync([FromBody] ChangeStatusRequest request)
        {
            if (!await _orderService.OrderExistsAsync(request.OrderId))
            {
                return new JsonResult(new { success = false, message = "Pedido no encontrado" });
            }

            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
                var order = await _orderService.UpdateOrderStatusAsync(request.OrderId, (OrderStatus)request.NewStatus, userId);

                var statusText = ((OrderStatus)request.NewStatus) switch
                {
                    OrderStatus.Confirmed => "confirmado",
                    OrderStatus.Shipped => "enviado",
                    OrderStatus.Delivered => "entregado",
                    OrderStatus.Paid => "pagado",
                    OrderStatus.PaymentFailed => "con pago fallido",
                    _ => "actualizado"
                };

                return new JsonResult(new 
                { 
                    success = true, 
                    message = $"Pedido #{order.Id} {statusText} exitosamente" 
                });
            }
            catch (InvalidOperationException ex)
            {
                return new JsonResult(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, message = "Error al cambiar el estado del pedido: " + ex.Message });
            }
        }

        public class ChangeStatusRequest
        {
            public int OrderId { get; set; }
            public int NewStatus { get; set; }
        }
    }
}
