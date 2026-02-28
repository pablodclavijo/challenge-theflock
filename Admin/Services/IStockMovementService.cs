using AdminPanel.Models;

namespace AdminPanel.Services
{
    public interface IStockMovementService
    {
        Task<StockMovement> CreateStockMovementAsync(int productId, int previousStock, int newStock, int quantity, string movementType, string reason, string userId);
        Task<List<StockMovement>> GetProductStockMovementsAsync(int productId, int count = 20);
    }
}
