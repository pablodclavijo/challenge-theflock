using AdminPanel.Constants;
using AdminPanel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Users
{
    [Authorize(Roles = Roles.Admin)]
    public class CreateModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public CreateModel(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public List<SelectListItem> RolesList { get; set; } = new();

        public class InputModel
        {
            [Required(ErrorMessage = "El email es requerido")]
            [EmailAddress(ErrorMessage = "Email inválido")]
            [Display(Name = "Email")]
            public string Email { get; set; } = default!;

            [Required(ErrorMessage = "El nombre completo es requerido")]
            [Display(Name = "Nombre Completo")]
            [StringLength(100)]
            public string FullName { get; set; } = default!;

            [Required(ErrorMessage = "La contraseña es requerida")]
            [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos {2} caracteres")]
            [DataType(DataType.Password)]
            [Display(Name = "Contraseña")]
            public string Password { get; set; } = default!;

            [Required(ErrorMessage = "Confirme la contraseña")]
            [DataType(DataType.Password)]
            [Display(Name = "Confirmar Contraseña")]
            [Compare("Password", ErrorMessage = "Las contraseñas no coinciden")]
            public string ConfirmPassword { get; set; } = default!;

            [Required(ErrorMessage = "Seleccione un rol")]
            [Display(Name = "Rol")]
            public string Role { get; set; } = default!;

            [Display(Name = "Cuenta Activa")]
            public bool IsActive { get; set; } = true;

            [Display(Name = "Email Confirmado")]
            public bool EmailConfirmed { get; set; } = true;
        }

        public void OnGet()
        {
            RolesList = new List<SelectListItem>
            {
                new SelectListItem { Value = Roles.Vendedor, Text = "Vendedor" },
                new SelectListItem { Value = Roles.Admin, Text = "Administrador" }
            };
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

            var user = new ApplicationUser
            {
                UserName = Input.Email,
                Email = Input.Email,
                FullName = Input.FullName,
                IsActive = Input.IsActive,
                EmailConfirmed = Input.EmailConfirmed,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, Input.Password);

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, Input.Role);
                
                TempData["SuccessMessage"] = $"Usuario {user.Email} creado exitosamente con rol {Input.Role}";
                return RedirectToPage("./Index");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            RolesList = new List<SelectListItem>
            {
                new SelectListItem { Value = Roles.Vendedor, Text = "Vendedor" },
                new SelectListItem { Value = Roles.Admin, Text = "Administrador" }
            };

            return Page();
        }
    }
}
