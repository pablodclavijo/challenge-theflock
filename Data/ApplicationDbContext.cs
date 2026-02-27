using AdminPanel.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Data;
    public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        ConfigureCategory(builder);
        ConfigureProduct(builder);
        ConfigureCartItem(builder);
        ConfigureOrder(builder);
        ConfigureOrderItem(builder);
    }

    private void ConfigureCategory(ModelBuilder builder)
    {
        builder.Entity<Category>(e =>
        {
            e.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(150);

            e.HasIndex(x => x.IsActive);
        });
    }

    private void ConfigureProduct(ModelBuilder builder)
    {
        builder.Entity<Product>(e =>
        {
            e.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            e.Property(x => x.Description)
                .IsRequired();

            e.Property(x => x.Price)
                .HasPrecision(10, 2);

            e.HasIndex(x => x.CategoryId);
            e.HasIndex(x => x.IsActive);

            e.HasOne(x => x.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private void ConfigureCartItem(ModelBuilder builder)
    {
        builder.Entity<CartItem>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.ProductId })
                .IsUnique();

            e.HasOne(x => x.User)
                .WithMany(u => u.CartItems)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Product)
                .WithMany(p => p.CartItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private void ConfigureOrder(ModelBuilder builder)
    {
        builder.Entity<Order>(e =>
        {
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.Property(x => x.Tax).HasPrecision(10, 2);
            e.Property(x => x.Total).HasPrecision(10, 2);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.Status);

            e.HasOne(x => x.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private void ConfigureOrderItem(ModelBuilder builder)
    {
        builder.Entity<OrderItem>(e =>
        {
            e.Property(x => x.UnitPriceSnapshot)
                .HasPrecision(10, 2);

            e.Property(x => x.LineTotal)
                .HasPrecision(10, 2);

            e.Property(x => x.ProductNameSnapshot)
                .IsRequired()
                .HasMaxLength(200);

            e.HasOne(x => x.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}