namespace AdminPanel.Services.Messaging
{
    public interface IOrderEventPublisher
    {
        Task PublishOrderStatusChangedAsync(OrderStatusChangedEvent @event);
    }
}
