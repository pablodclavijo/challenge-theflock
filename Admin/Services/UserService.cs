using AdminPanel.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UserService(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<ApplicationUser?> GetUserByIdAsync(string id)
        {
            return await _userManager.FindByIdAsync(id);
        }

        public async Task<List<UserDto>> GetAllUsersWithRolesAsync()
        {
            var allUsers = await _userManager.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var userDtos = new List<UserDto>();

            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "Sin rol";

                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FullName = user.FullName,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    Role = role,
                    EmailConfirmed = user.EmailConfirmed
                });
            }

            return userDtos;
        }

        public async Task<ApplicationUser> CreateUserAsync(string email, string fullName, string password, string role, bool isActive = true, bool emailConfirmed = true)
        {
            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                IsActive = isActive,
                EmailConfirmed = emailConfirmed,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            await _userManager.AddToRoleAsync(user, role);

            return user;
        }

        public async Task<ApplicationUser> UpdateUserAsync(string id, string email, string fullName, string? shippingAddress, string role, bool isActive, bool emailConfirmed)
        {
            var user = await GetUserByIdAsync(id);
            if (user == null)
            {
                throw new InvalidOperationException("Usuario no encontrado");
            }

            user.Email = email;
            user.UserName = email;
            user.FullName = fullName;
            user.ShippingAddress = shippingAddress;
            user.IsActive = isActive;
            user.EmailConfirmed = emailConfirmed;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join(", ", updateResult.Errors.Select(e => e.Description)));
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(role))
            {
                if (currentRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                }
                await _userManager.AddToRoleAsync(user, role);
            }

            return user;
        }

        public async Task UpdateUserPasswordAsync(string userId, string newPassword)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("Usuario no encontrado");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

            if (!result.Succeeded)
            {
                throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        public async Task ToggleUserStatusAsync(string id, string currentUserId)
        {
            var user = await GetUserByIdAsync(id);
            if (user == null)
            {
                throw new InvalidOperationException("Usuario no encontrado");
            }

            if (user.Id == currentUserId)
            {
                throw new InvalidOperationException("No puedes desactivar tu propia cuenta");
            }

            var userRoles = await _userManager.GetRolesAsync(user);
            if (userRoles.Contains(Constants.Roles.Admin))
            {
                throw new InvalidOperationException("No puedes desactivar la cuenta de otro administrador");
            }

            user.IsActive = !user.IsActive;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                throw new InvalidOperationException("Error al actualizar el estado del usuario");
            }
        }
    }
}
