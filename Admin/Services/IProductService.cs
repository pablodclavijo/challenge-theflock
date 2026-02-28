using AdminPanel.Models;

namespace AdminPanel.Services
{
    public interface IProductService
    {
        Task<Product?> GetProductByIdAsync(int id);
        Task<Product?> GetProductWithCategoryAsync(int id);
        Task<List<StockMovement>> GetProductStockMovementsAsync(int productId, int count = 20);
        Task<List<Product>> GetAllProductsAsync();
        Task<List<Product>> GetActiveProductsAsync();
        IQueryable<Product> GetProductsQuery();
        Task<Product> CreateProductAsync(Product product);
        Task<Product> UpdateProductAsync(Product product);
        Task<bool> ProductExistsAsync(int id);
        Task ToggleProductStatusAsync(int id);
        Task AdjustStockAsync(int productId, int newStock, string movementType, string reason, string userId);
        Task QuickUpdateStockAsync(int productId, int newStock, string userId);
    }
}
