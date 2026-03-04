namespace AdminPanel.Services.Messaging
{
    public record OrderStatusChangedEvent(
        int OrderId,
        int OldStatus,
        int NewStatus,
        string ChangedBy,
        DateTime Timestamp
    );
}
