using AdminPanel.Constants;
using AdminPanel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Users
{
    [Authorize(Roles = Roles.Admin)]
    public class EditModel : PageModel
    {
        private readonly IUserService _userService;

        public EditModel(IUserService userService)
        {
            _userService = userService;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public List<SelectListItem> RolesList { get; set; } = new();

        public class InputModel
        {
            public string Id { get; set; } = default!;

            [Required(ErrorMessage = "El email es requerido")]
            [EmailAddress(ErrorMessage = "Email inválido")]
            [Display(Name = "Email")]
            public string Email { get; set; } = default!;

            [Required(ErrorMessage = "El nombre completo es requerido")]
            [Display(Name = "Nombre Completo")]
            [StringLength(100)]
            public string FullName { get; set; } = default!;

            [Display(Name = "Dirección de Envío")]
            [StringLength(500)]
            public string? ShippingAddress { get; set; }

            [Required(ErrorMessage = "Seleccione un rol")]
            [Display(Name = "Rol")]
            public string Role { get; set; } = default!;

            [Display(Name = "Cuenta Activa")]
            public bool IsActive { get; set; }

            [Display(Name = "Email Confirmado")]
            public bool EmailConfirmed { get; set; }

            [DataType(DataType.Password)]
            [Display(Name = "Nueva Contraseña (opcional)")]
            [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos {2} caracteres")]
            public string? NewPassword { get; set; }

            [DataType(DataType.Password)]
            [Display(Name = "Confirmar Nueva Contraseña")]
            [Compare("NewPassword", ErrorMessage = "Las contraseñas no coinciden")]
            public string? ConfirmPassword { get; set; }
        }

        public async Task<IActionResult> OnGetAsync(string? id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return NotFound();
            }

            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var allUsers = await _userService.GetAllUsersWithRolesAsync();
            var userDto = allUsers.FirstOrDefault(u => u.Id == id);
            var currentRole = userDto?.Role ?? Constants.Roles.Vendedor;

            Input = new InputModel
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                ShippingAddress = user.ShippingAddress,
                IsActive = user.IsActive,
                EmailConfirmed = user.EmailConfirmed,
                Role = currentRole
            };

            RolesList = new List<SelectListItem>
            {
                new SelectListItem { Value = Roles.Vendedor, Text = "Vendedor" },
                new SelectListItem { Value = Roles.Admin, Text = "Administrador" }
            };

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                RolesList = new List<SelectListItem>
                {
                    new SelectListItem { Value = Roles.Vendedor, Text = "Vendedor" },
                    new SelectListItem { Value = Roles.Admin, Text = "Administrador" }
                };
                return Page();
            }

            try
            {
                var user = await _userService.UpdateUserAsync(
                    Input.Id,
                    Input.Email,
                    Input.FullName,
                    Input.ShippingAddress,
                    Input.Role,
                    Input.IsActive,
                    Input.EmailConfirmed
                );

                if (!string.IsNullOrEmpty(Input.NewPassword))
                {
                    await _userService.UpdateUserPasswordAsync(Input.Id, Input.NewPassword);
                }

                TempData["SuccessMessage"] = $"Usuario {user.Email} actualizado exitosamente";
                return RedirectToPage("./Index");
            }
            catch (InvalidOperationException ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);

                RolesList = new List<SelectListItem>
                {
                    new SelectListItem { Value = Roles.Vendedor, Text = "Vendedor" },
                    new SelectListItem { Value = Roles.Admin, Text = "Administrador" }
                };

                return Page();
            }
        }
    }
}
