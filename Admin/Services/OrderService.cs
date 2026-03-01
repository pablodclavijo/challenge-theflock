using AdminPanel.Data;
using AdminPanel.Enums;
using AdminPanel.Models;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Services
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductService _productService;
        private readonly IStockMovementService _stockMovementService;

        public OrderService(
            ApplicationDbContext context,
            IProductService productService,
            IStockMovementService stockMovementService)
        {
            _context = context;
            _productService = productService;
            _stockMovementService = stockMovementService;
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            return await _context.Orders.FindAsync(id);
        }

        public async Task<Order?> GetOrderWithDetailsAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<List<Order>> GetOrdersAsync()
        {
            return await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public IQueryable<Order> GetOrdersQuery()
        {
            return _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .AsQueryable();
        }

        public async Task<bool> OrderExistsAsync(int id)
        {
            return await _context.Orders.AnyAsync(o => o.Id == id);
        }

        public async Task<Order> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string userId)
        {
            var order = await GetOrderWithDetailsAsync(orderId);
            if (order == null)
            {
                throw new InvalidOperationException("Pedido no encontrado");
            }

            var oldStatus = order.Status;

            if (!IsValidStatusTransition(oldStatus, newStatus))
            {
                throw new InvalidOperationException($"No se puede cambiar el estado de {oldStatus} a {newStatus}");
            }

            if (newStatus == OrderStatus.Confirmed && oldStatus == OrderStatus.Pending)
            {
                await DeductStockForOrderAsync(orderId, userId);
            }

            order.Status = newStatus;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return order;
        }

        public async Task DeductStockForOrderAsync(int orderId, string userId)
        {
            var order = await GetOrderWithDetailsAsync(orderId);
            if (order == null)
            {
                throw new InvalidOperationException("Pedido no encontrado");
            }

            foreach (var item in order.Items)
            {
                var product = await _productService.GetProductByIdAsync(item.ProductId);
                if (product == null)
                {
                    throw new InvalidOperationException($"Producto {item.ProductId} no encontrado");
                }

                if (product.Stock < item.Quantity)
                {
                    throw new InvalidOperationException(
                        $"Stock insuficiente para {product.Name}. Disponible: {product.Stock}, Requerido: {item.Quantity}");
                }

                var oldStock = product.Stock;
                var newStock = oldStock - item.Quantity;

                product.Stock = newStock;

                await _stockMovementService.CreateStockMovementAsync(
                    product.Id,
                    oldStock,
                    newStock,
                    item.Quantity,
                    "OrderConfirmation",
                    $"Descuento por confirmación de pedido #{orderId}",
                    userId);
            }

            await _context.SaveChangesAsync();
        }

        private bool IsValidStatusTransition(OrderStatus from, OrderStatus to)
        {
            return (from, to) switch
            {
                (OrderStatus.Pending, OrderStatus.Confirmed) => true,
                (OrderStatus.Confirmed, OrderStatus.Shipped) => true,
                (OrderStatus.Shipped, OrderStatus.Delivered) => true,
                _ => false
            };
        }
    }
}
