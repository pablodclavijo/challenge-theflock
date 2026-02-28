using AdminPanel.Models;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace AdminPanel.Services
{
    public interface ICategoryService
    {
        Task<Category?> GetCategoryByIdAsync(int id);
        Task<List<Category>> GetAllCategoriesAsync();
        Task<List<Category>> GetActiveCategoriesAsync();
        Task<List<SelectListItem>> GetCategorySelectListAsync();
    }
}
