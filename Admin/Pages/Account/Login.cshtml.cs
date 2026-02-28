using AdminPanel.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace AdminPanel.Pages.Account
{
    public class LoginModel : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public LoginModel(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public string? ReturnUrl { get; set; }

        public class InputModel
        {
            [Required(ErrorMessage = "El email es requerido")]
            [EmailAddress(ErrorMessage = "Email inválido")]
            public string Email { get; set; } = default!;

            [Required(ErrorMessage = "La contraseña es requerida")]
            [DataType(DataType.Password)]
            public string Password { get; set; } = default!;

            [Display(Name = "Recordarme")]
            public bool RememberMe { get; set; }
        }

        public async Task OnGetAsync(string? returnUrl = null)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                Response.Redirect("/");
                return;
            }

            ReturnUrl = returnUrl ?? Url.Content("~/");

            // Clear the existing external cookie
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        }

        public async Task<IActionResult> OnPostAsync(string? returnUrl = null)
        {
            returnUrl ??= Url.Content("~/");

            if (!ModelState.IsValid)
            {
                return Page();
            }

            var user = await _userManager.FindByEmailAsync(Input.Email);
            if (user == null)
            {
                ModelState.AddModelError(string.Empty, "Email o contraseña incorrectos.");
                return Page();
            }

            if (!user.IsActive)
            {
                ModelState.AddModelError(string.Empty, "Su cuenta ha sido desactivada. Contacte al administrador.");
                return Page();
            }

            var result = await _signInManager.PasswordSignInAsync(
                Input.Email, 
                Input.Password, 
                Input.RememberMe, 
                lockoutOnFailure: true);

            if (result.Succeeded)
            {
                return LocalRedirect(returnUrl);
            }

            if (result.IsLockedOut)
            {
                ModelState.AddModelError(string.Empty, "Cuenta bloqueada temporalmente por múltiples intentos fallidos.");
                return Page();
            }

            ModelState.AddModelError(string.Empty, "Email o contraseña incorrectos.");
            return Page();
        }
    }
}
