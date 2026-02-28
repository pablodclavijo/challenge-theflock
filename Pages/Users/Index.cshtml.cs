using AdminPanel.Constants;
using AdminPanel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages.Users
{
    [Authorize(Roles = Roles.Admin)]
    public class IndexModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public IndexModel(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public List<UserViewModel> Users { get; set; } = new();

        public class UserViewModel
        {
            public string Id { get; set; } = default!;
            public string Email { get; set; } = default!;
            public string FullName { get; set; } = default!;
            public bool IsActive { get; set; }
            public DateTime CreatedAt { get; set; }
            public string Role { get; set; } = default!;
            public bool EmailConfirmed { get; set; }
        }

        public async Task OnGetAsync()
        {
            var allUsers = await _userManager.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            Users = new List<UserViewModel>();

            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "Sin rol";

                Users.Add(new UserViewModel
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
        }
    }
}
