namespace AdminPanel.Models
{
    public class OrderItem
    {
        public int Id { get; set; }

        public int OrderId { get; set; }
        public Order Order { get; set; } = default!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = default!;

        public string ProductNameSnapshot { get; set; } = default!;
        public decimal UnitPriceSnapshot { get; set; }

        public int Quantity { get; set; }
        public decimal LineTotal { get; set; }
    }
}
