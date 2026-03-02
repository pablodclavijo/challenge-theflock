using AdminPanel.Models;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace AdminPanel.Services
{
    public interface ICategoryService
    {
        Task<Category?> GetCategoryByIdAsync(int id);
        Task<Category?> GetCategoryWithProductsAsync(int id);
        Task<List<Category>> GetAllCategoriesAsync();
        Task<List<Category>> GetActiveCategoriesAsync();
        IQueryable<Category> GetCategoriesQuery();
        Task<List<SelectListItem>> GetCategorySelectListAsync();
        Task<Category> CreateCategoryAsync(Category category);
        Task<Category> UpdateCategoryAsync(Category category);
        Task DeleteCategoryAsync(int id);
    }
}
