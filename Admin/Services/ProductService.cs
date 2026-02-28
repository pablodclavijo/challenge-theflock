using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly IStockMovementService _stockMovementService;

        public ProductService(ApplicationDbContext context, IStockMovementService stockMovementService)
        {
            _context = context;
            _stockMovementService = stockMovementService;
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            return await _context.Products.FindAsync(id);
        }

        public async Task<Product?> GetProductWithCategoryAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<List<StockMovement>> GetProductStockMovementsAsync(int productId, int count = 20)
        {
            return await _stockMovementService.GetProductStockMovementsAsync(productId, count);
        }

        public async Task<List<Product>> GetAllProductsAsync()
        {
            return await _context.Products
                .Include(p => p.Category)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<List<Product>> GetActiveProductsAsync()
        {
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public IQueryable<Product> GetProductsQuery()
        {
            return _context.Products.Include(p => p.Category);
        }

        public async Task<Product> CreateProductAsync(Product product)
        {
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<Product> UpdateProductAsync(Product product)
        {
            product.UpdatedAt = DateTime.UtcNow;
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<bool> ProductExistsAsync(int id)
        {
            return await _context.Products.AnyAsync(e => e.Id == id);
        }

        public async Task ToggleProductStatusAsync(int id)
        {
            var product = await GetProductByIdAsync(id);
            if (product != null)
            {
                product.IsActive = !product.IsActive;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task AdjustStockAsync(int productId, int newStock, string movementType, string reason, string userId)
        {
            var product = await GetProductByIdAsync(productId);
            if (product == null)
            {
                throw new InvalidOperationException($"Product with ID {productId} not found");
            }

            var oldStock = product.Stock;
            product.Stock = newStock;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var quantity = Math.Abs(newStock - oldStock);
            
            await _stockMovementService.CreateStockMovementAsync(
                productId, oldStock, newStock, quantity, movementType, reason, userId);
        }

        public async Task QuickUpdateStockAsync(int productId, int newStock, string userId)
        {
            var product = await GetProductByIdAsync(productId);
            if (product == null)
            {
                throw new InvalidOperationException($"Product with ID {productId} not found");
            }

            var oldStock = product.Stock;
            product.Stock = newStock;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var quantity = Math.Abs(newStock - oldStock);
            var movementType = newStock > oldStock ? "Add" : (newStock < oldStock ? "Subtract" : "Set");
            
            await _stockMovementService.CreateStockMovementAsync(
                productId, oldStock, newStock, quantity, movementType, "Ajuste rápido desde listado", userId);
        }
    }
}
