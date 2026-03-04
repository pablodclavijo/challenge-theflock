using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace AdminPanel.Services.Messaging
{
    public class RabbitMqOrderEventPublisher : IOrderEventPublisher, IDisposable
    {
        private readonly ILogger<RabbitMqOrderEventPublisher> _logger;
        private IConnection? _connection;
        private IModel? _channel;

        private const string ExchangeName = "order_events";
        private const string RoutingKey  = "order.status.changed";

        public RabbitMqOrderEventPublisher(
            IConfiguration configuration,
            ILogger<RabbitMqOrderEventPublisher> logger)
        {
            _logger = logger;
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName    = configuration["RabbitMQ:Host"]        ?? "localhost",
                    Port        = int.Parse(configuration["RabbitMQ:Port"] ?? "5672"),
                    UserName    = configuration["RabbitMQ:Username"]    ?? "guest",
                    Password    = configuration["RabbitMQ:Password"]    ?? "guest",
                    VirtualHost = configuration["RabbitMQ:VirtualHost"] ?? "/"
                };

                _connection = factory.CreateConnection("admin-panel");
                _channel    = _connection.CreateModel();
                _channel.ExchangeDeclare(ExchangeName, ExchangeType.Topic, durable: true);

                _logger.LogInformation("RabbitMQ connection established (exchange: {Exchange})", ExchangeName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not connect to RabbitMQ. Order events will not be published.");
            }
        }

        public Task PublishOrderStatusChangedAsync(OrderStatusChangedEvent @event)
        {
            if (_channel is null || _connection?.IsOpen != true)
            {
                _logger.LogWarning(
                    "RabbitMQ unavailable – skipping event for OrderId={OrderId}", @event.OrderId);
                return Task.CompletedTask;
            }

            try
            {
                var body  = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(@event));
                var props = _channel.CreateBasicProperties();
                props.ContentType  = "application/json";
                props.DeliveryMode = 2; // persistent

                _channel.BasicPublish(ExchangeName, RoutingKey, props, body);

                _logger.LogInformation(
                    "Published order.status.changed: OrderId={OrderId}, {Old}->{New}",
                    @event.OrderId, @event.OldStatus, @event.NewStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish order event for OrderId={OrderId}", @event.OrderId);
            }

            return Task.CompletedTask;
        }

        public void Dispose()
        {
            try { _channel?.Close(); }    catch { /* ignore */ }
            try { _connection?.Close(); } catch { /* ignore */ }
        }
    }
}
