using AdminPanel.Constants;
using AdminPanel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AdminPanel.Pages.Users
{
    [Authorize(Roles = Roles.Admin)]
    public class ToggleStatusModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public ToggleStatusModel(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public ApplicationUser AppUser { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync(string? id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return NotFound();
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // No permitir desactivar el propio usuario
            if (user.Id == _userManager.GetUserId(User))
            {
                TempData["ErrorMessage"] = "No puedes desactivar tu propia cuenta";
                return RedirectToPage("./Index");
            }

            user.IsActive = !user.IsActive;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                TempData["SuccessMessage"] = $"Usuario {user.Email} {(user.IsActive ? "activado" : "desactivado")} exitosamente";
            }
            else
            {
                TempData["ErrorMessage"] = "Error al actualizar el estado del usuario";
            }

            return RedirectToPage("./Index");
        }
    }
}
