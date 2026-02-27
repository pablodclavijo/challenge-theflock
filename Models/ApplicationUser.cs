using Microsoft.AspNetCore.Identity;

namespace AdminPanel.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = default!;
        public string? ShippingAddress { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    }
}
