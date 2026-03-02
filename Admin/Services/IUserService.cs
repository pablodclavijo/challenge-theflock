using AdminPanel.Models;

namespace AdminPanel.Services
{
    public interface IUserService
    {
        Task<ApplicationUser?> GetUserByIdAsync(string id);
        Task<List<UserDto>> GetAllUsersWithRolesAsync();
        Task<ApplicationUser> CreateUserAsync(string email, string fullName, string password, string role, bool isActive = true, bool emailConfirmed = true);
        Task<ApplicationUser> UpdateUserAsync(string id, string email, string fullName, string? shippingAddress, string role, bool isActive, bool emailConfirmed);
        Task UpdateUserPasswordAsync(string userId, string newPassword);
        Task ToggleUserStatusAsync(string id, string currentUserId);
    }

    public class UserDto
    {
        public string Id { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string FullName { get; set; } = default!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Role { get; set; } = default!;
        public bool EmailConfirmed { get; set; }
    }
}
