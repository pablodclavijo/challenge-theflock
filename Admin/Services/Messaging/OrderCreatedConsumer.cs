using System.Text;
using System.Text.Json;
using AdminPanel.Hubs;
using Microsoft.AspNetCore.SignalR;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace AdminPanel.Services.Messaging
{
    public record OrderCreatedEvent(
        int    OrderId,
        string UserId,
        decimal Total,
        int    ItemCount,
        string CreatedAt,
        string ShippingAddress
    );

    public class OrderCreatedConsumer : BackgroundService
    {
        private readonly IConfiguration                 _configuration;
        private readonly IHubContext<OrderHub>          _hub;
        private readonly ILogger<OrderCreatedConsumer>  _logger;

        private IConnection? _connection;
        private IModel?      _channel;

        private const string ExchangeName = "order_events";
        private const string QueueName    = "admin.order.created";
        private const string RoutingKey   = "order.created";

        public OrderCreatedConsumer(
            IConfiguration           configuration,
            IHubContext<OrderHub>     hub,
            ILogger<OrderCreatedConsumer> logger)
        {
            _configuration = configuration;
            _hub           = hub;
            _logger        = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName    = _configuration["RabbitMQ:Host"]        ?? "localhost",
                    Port        = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
                    UserName    = _configuration["RabbitMQ:Username"]    ?? "guest",
                    Password    = _configuration["RabbitMQ:Password"]    ?? "guest",
                    VirtualHost = _configuration["RabbitMQ:VirtualHost"] ?? "/",
                    DispatchConsumersAsync = true
                };

                _connection = factory.CreateConnection("admin-order-consumer");
                _channel    = _connection.CreateModel();

                _channel.ExchangeDeclare(ExchangeName, ExchangeType.Topic, durable: true);
                _channel.QueueDeclare(QueueName, durable: true, exclusive: false, autoDelete: false);
                _channel.QueueBind(QueueName, ExchangeName, RoutingKey);
                _channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.Received += OnMessageReceivedAsync;
                _channel.BasicConsume(QueueName, autoAck: false, consumer: consumer);

                _logger.LogInformation("OrderCreatedConsumer started, listening on queue: {Queue}", QueueName);

                // Keep alive until cancellation is requested
                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Normal shutdown
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OrderCreatedConsumer could not start. New-order live updates will be disabled.");
            }
        }

        private async Task OnMessageReceivedAsync(object sender, BasicDeliverEventArgs ea)
        {
            try
            {
                var body    = Encoding.UTF8.GetString(ea.Body.Span);
                var payload = JsonSerializer.Deserialize<OrderCreatedEvent>(body,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (payload is null)
                {
                    _channel?.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                    return;
                }

                _logger.LogInformation(
                    "New order received via RabbitMQ: OrderId={OrderId}, Total={Total}",
                    payload.OrderId, payload.Total);

                // Broadcast to all connected Admin browser tabs
                await _hub.Clients.All.SendAsync("NewOrderReceived", new
                {
                    orderId         = payload.OrderId,
                    total           = payload.Total,
                    itemCount       = payload.ItemCount,
                    shippingAddress = payload.ShippingAddress,
                    createdAt       = payload.CreatedAt
                });

                _channel?.BasicAck(ea.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing order.created message");
                _channel?.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
            }
        }

        public override void Dispose()
        {
            try { _channel?.Close(); }    catch { /* ignore */ }
            try { _connection?.Close(); } catch { /* ignore */ }
            base.Dispose();
        }
    }
}
