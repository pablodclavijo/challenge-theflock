using AdminPanel.Enums;

namespace AdminPanel.Models
{
    public class Order
    {
        public int Id { get; set; }

        public string UserId { get; set; } = default!;
        public ApplicationUser User { get; set; } = default!;

        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        public decimal Subtotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }

        public string ShippingAddress { get; set; } = default!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
