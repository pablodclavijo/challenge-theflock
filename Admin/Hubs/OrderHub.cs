using Microsoft.AspNetCore.SignalR;

namespace AdminPanel.Hubs
{
    // No [Authorize] here — ASP.NET Core Identity's cookie auth redirects
    // unauthenticated SignalR negotiate requests to the login page (HTML),
    // which breaks the JSON handshake. The Admin app is already protected
    // at the Razor Pages layer; the hub only receives server-pushed events.
    public class OrderHub : Hub
    {
        // Clients connect to this hub from the Orders page.
        // The server pushes events; clients don't send messages here.
    }
}
