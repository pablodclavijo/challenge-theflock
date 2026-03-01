using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Tests.Helpers
{
    /// <summary>
    /// Helper class for creating testable DbContext and IQueryable instances
    /// that support EF Core async operations
    /// </summary>
    public static class TestDbHelper
    {
        public static ApplicationDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new ApplicationDbContext(options);
            SeedTestData(context);
            return context;
        }

        private static void SeedTestData(ApplicationDbContext context)
        {
            var categories = new List<Category>
            {
                new Category { Id = 1, Name = "Electronics", IsActive = true },
                new Category { Id = 2, Name = "Clothing", IsActive = true },
                new Category { Id = 3, Name = "Books", IsActive = true }
            };

            context.Categories.AddRange(categories);
            context.SaveChanges();
        }

        public static IQueryable<Product> CreateTestProductQuery(ApplicationDbContext context, List<Product> products)
        {
            context.Products.AddRange(products);
            context.SaveChanges();
            return context.Products.Include(p => p.Category);
        }
    }
}
