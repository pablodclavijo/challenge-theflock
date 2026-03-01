using AdminPanel.Enums;
using AdminPanel.Models;

namespace AdminPanel.Services
{
    public interface IOrderService
    {
        Task<Order?> GetOrderByIdAsync(int id);
        Task<Order?> GetOrderWithDetailsAsync(int id);
        Task<List<Order>> GetOrdersAsync();
        IQueryable<Order> GetOrdersQuery();
        Task<bool> OrderExistsAsync(int id);
        Task<Order> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string userId);
        Task DeductStockForOrderAsync(int orderId, string userId);
    }
}
