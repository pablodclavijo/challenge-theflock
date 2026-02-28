using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Services
{
    public class StockMovementService : IStockMovementService
    {
        private readonly ApplicationDbContext _context;

        public StockMovementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<StockMovement> CreateStockMovementAsync(int productId, int previousStock, int newStock, int quantity, string movementType, string reason, string userId)
        {
            var movement = new StockMovement
            {
                ProductId = productId,
                PreviousStock = previousStock,
                NewStock = newStock,
                Quantity = quantity,
                MovementType = movementType,
                Reason = reason,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.StockMovements.Add(movement);
            await _context.SaveChangesAsync();

            return movement;
        }

        public async Task<List<StockMovement>> GetProductStockMovementsAsync(int productId, int count = 20)
        {
            return await _context.StockMovements
                .Include(sm => sm.User)
                .Where(sm => sm.ProductId == productId)
                .OrderByDescending(sm => sm.CreatedAt)
                .Take(count)
                .ToListAsync();
        }
    }
}
