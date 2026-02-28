namespace AdminPanel.Models
{
    public class StockMovement
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; } = default!;
        
        public int PreviousStock { get; set; }
        public int NewStock { get; set; }
        public int Quantity { get; set; }
        public string MovementType { get; set; } = default!; 
        public string? Reason { get; set; }
        
        public string UserId { get; set; } = default!;
        public ApplicationUser User { get; set; } = default!;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
