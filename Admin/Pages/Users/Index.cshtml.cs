using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Users
{
    [Authorize(Roles = Roles.Admin)]
    public class IndexModel : PageModel
    {
        private readonly IUserService _userService;

        public IndexModel(IUserService userService)
        {
            _userService = userService;
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
            var userDtos = await _userService.GetAllUsersWithRolesAsync();

            Users = userDtos.Select(u => new UserViewModel
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                Role = u.Role,
                EmailConfirmed = u.EmailConfirmed
            }).ToList();
        }
    }
}
