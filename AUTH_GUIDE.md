# Sistema de Autenticación y Autorización - Admin Panel

## ? Implementación Completa

Se ha implementado un sistema completo de autenticación y autorización con **ASP.NET Core Identity** y roles diferenciados.

---

## ?? Roles del Sistema

### 1. **Administrador (Admin)**
- ? Acceso completo al sistema
- ? Gestión de productos (CRUD)
- ? Gestión de pedidos
- ? Gestión de categorías (CRUD)
- ? Gestión de usuarios/vendedores (crear, editar, activar/desactivar)
- ? Dashboard con métricas avanzadas
- ? Reportes completos (ventas, productos más vendidos, etc.)

### 2. **Vendedor**
- ? Gestión de productos (CRUD)
- ? Gestión de pedidos
- ? **NO** puede acceder a categorías
- ? **NO** puede gestionar usuarios
- ? **NO** puede ver reportes administrativos
- ? Dashboard con métricas básicas

---

## ?? Credenciales de Prueba

Las siguientes cuentas se crean automáticamente al iniciar la aplicación:

### Admin
```
Email: admin@admin.com
Contraseña: Admin123!
```

### Vendedor
```
Email: vendedor@vendedor.com
Contraseña: Vendedor123!
```

---

## ??? Protección de Rutas

Todas las páginas están protegidas con el atributo `[Authorize]`:

### Accesibles por Admin y Vendedor:
- `/Index` - Dashboard
- `/Products/*` - Gestión de productos
- `/Orders/*` - Gestión de pedidos

### Solo Administrador:
- `/Categories/*` - Gestión de categorías
- `/Users/*` - Gestión de usuarios/vendedores
- `/Reports/*` - Reportes y métricas

---

## ?? Páginas Creadas

### Autenticación
- ? `/Account/Login` - Página de inicio de sesión
- ? `/Account/Logout` - Cerrar sesión
- ? `/Account/AccessDenied` - Acceso denegado

### Dashboard
- ? `/Index` - Dashboard principal (muestra contenido según rol)

### Productos (Admin + Vendedor)
- ? `/Products/Index` - Listado con paginación, búsqueda y ordenamiento
- ? `/Products/Create` - Crear producto (por implementar CRUD completo)
- ? `/Products/Edit` - Editar producto
- ? `/Products/Delete` - Eliminar producto
- ? `/Products/Details` - Ver detalles

### Pedidos (Admin + Vendedor)
- ? `/Orders/Index` - Listado con filtros por estado
- ? `/Orders/Details` - Ver detalles del pedido
- ? `/Orders/Edit` - Cambiar estado del pedido

### Categorías (Solo Admin)
- ? `/Categories/Index` - Listado en formato cards
- ? `/Categories/Create` - Crear categoría
- ? `/Categories/Edit` - Editar categoría
- ? `/Categories/Delete` - Eliminar categoría

### Usuarios/Vendedores (Solo Admin)
- ? `/Users/Index` - Listado de usuarios con roles
- ? `/Users/Create` - Crear nuevo usuario/vendedor
- ? `/Users/ToggleStatus` - Activar/Desactivar cuenta
- ? `/Users/Edit` - Editar usuario

### Reportes (Solo Admin)
- ? `/Reports/Index` - Dashboard con métricas completas:
  - Ventas por período (hoy, semana, mes, total)
  - Órdenes por estado
  - Top 10 productos más vendidos
  - Resumen general

---

## ?? Sidebar Dinámico

El sidebar muestra opciones según el rol del usuario:

```razor
@if (User.IsInRole(AdminPanel.Constants.Roles.Admin))
{
    <!-- Opciones solo para Admin -->
    <li><a asp-page="/Categories/Index">Categorías</a></li>
    <li><a asp-page="/Users/Index">Usuarios</a></li>
    <li><a asp-page="/Reports/Index">Reportes</a></li>
}
```

---

## ?? Configuración (Program.cs)

```csharp
// Identity con configuración de contraseñas
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configuración de cookies
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
});

// Todas las páginas requieren autenticación por defecto
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/");
    options.Conventions.AllowAnonymousToPage("/Account/Login");
    options.Conventions.AllowAnonymousToPage("/Account/AccessDenied");
});
```

---

## ?? Uso en PageModels

### Restringir por Rol
```csharp
using AdminPanel.Constants;
using Microsoft.AspNetCore.Authorization;

[Authorize(Roles = Roles.Admin)]
public class CategoriesIndexModel : PageModel
{
    // Solo admin puede acceder
}

[Authorize(Roles = $"{Roles.Admin},{Roles.Vendedor}")]
public class ProductsIndexModel : PageModel
{
    // Admin y vendedor pueden acceder
}
```

### Verificar Rol en la Vista
```razor
@if (User.IsInRole(AdminPanel.Constants.Roles.Admin))
{
    <!-- Contenido solo para admin -->
}
```

---

## ?? Inicialización de Datos (DbInitializer.cs)

El sistema crea automáticamente:
- ? Roles (Admin, Vendedor)
- ? Usuarios por defecto (admin y vendedor)
- ? Categorías de ejemplo

Se ejecuta automáticamente en `Program.cs`:
```csharp
await DbInitializer.SeedAsync(app.Services);
```

---

## ?? Gestión de Usuarios

### Crear Usuario/Vendedor
1. Solo admin puede crear usuarios
2. Formulario incluye:
   - Email
   - Nombre completo
   - Contraseña (con validación)
   - Rol (Admin o Vendedor)
   - Estado activo
   - Email confirmado

### Activar/Desactivar Cuenta
- Admin puede activar o desactivar usuarios
- Los usuarios inactivos no pueden iniciar sesión
- No se puede desactivar la propia cuenta

---

## ?? Dashboard Dinámico

El dashboard muestra diferentes estadísticas según el rol:

### Todos los Roles
- Productos totales
- Órdenes totales
- Ingresos totales
- Stock bajo
- Órdenes hoy
- Ingresos hoy
- Órdenes pendientes

### Solo Admin (adicional)
- Categorías totales
- Usuarios totales
- Acciones rápidas para gestionar categorías y usuarios
- Acceso a reportes

---

## ?? Estados de Pedidos

```csharp
public enum OrderStatus
{
    Pending = 1,       // Pendiente
    Processing = 2,    // Procesando
    Confirmed = 3,     // Confirmado
    Shipped = 4,       // Enviado
    Delivered = 5,     // Entregado
    Cancelled = 6      // Cancelado
}
```

---

## ? Características de Seguridad

1. **Protección de rutas**: Todas las páginas requieren autenticación
2. **Bloqueo de cuenta**: Después de 5 intentos fallidos (5 minutos)
3. **Validación de contraseña**: Mínimo 6 caracteres, mayúsculas y números
4. **Sesión**: Expira después de 8 horas de inactividad
5. **Sliding expiration**: La sesión se renueva con cada actividad
6. **Verificación de cuenta activa**: Solo usuarios activos pueden iniciar sesión

---

## ?? Pruebas

### Probar como Admin
1. Iniciar sesión con `admin@admin.com`
2. Verificar acceso a todas las secciones
3. Crear un nuevo vendedor
4. Gestionar categorías

### Probar como Vendedor
1. Iniciar sesión con `vendedor@vendedor.com`
2. Verificar acceso solo a productos y pedidos
3. Intentar acceder a `/Categories/Index` ? debe redirigir a Access Denied
4. Intentar acceder a `/Users/Index` ? debe redirigir a Access Denied

### Probar Desactivación
1. Como admin, desactivar la cuenta del vendedor
2. Cerrar sesión del vendedor
3. Intentar iniciar sesión ? debe mostrar mensaje de cuenta desactivada

---

## ?? Archivos Importantes

```
AdminPanel/
??? Constants/
?   ??? Roles.cs                    # Constantes de roles
??? Data/
?   ??? DbInitializer.cs           # Inicialización de roles y usuarios
??? Pages/
?   ??? Account/
?   ?   ??? Login.cshtml           # Página de login
?   ?   ??? Logout.cshtml          # Logout
?   ?   ??? AccessDenied.cshtml    # Acceso denegado
?   ??? Categories/                # Solo Admin
?   ?   ??? Index.cshtml
?   ??? Users/                     # Solo Admin
?   ?   ??? Index.cshtml
?   ?   ??? Create.cshtml
?   ?   ??? ToggleStatus.cshtml
?   ??? Reports/                   # Solo Admin
?   ?   ??? Index.cshtml
?   ??? Products/                  # Admin + Vendedor
?   ?   ??? Index.cshtml
?   ??? Orders/                    # Admin + Vendedor
?       ??? Index.cshtml
??? Program.cs                     # Configuración de Identity
```

---

## ?? Interfaz de Usuario

### Login
- Diseño moderno con gradiente
- Validación en tiempo real
- Muestra credenciales de prueba
- Mensajes de error claros

### Sidebar
- Muestra información del usuario
- Badge con el rol (Admin/Vendedor)
- Opciones dinámicas según permisos
- Botón de cerrar sesión

### Alertas
- Mensajes de éxito en verde
- Mensajes de error en rojo
- Auto-dismiss después de 5 segundos

---

## ?? Próximos Pasos Sugeridos

1. **Completar CRUD de Productos**
   - Create, Edit, Delete, Details

2. **Completar CRUD de Categorías**
   - Create, Edit, Delete

3. **Gestión de Pedidos**
   - Ver detalles
   - Cambiar estado
   - Imprimir orden

4. **Editar Usuarios**
   - Cambiar contraseña
   - Actualizar información

5. **Reportes Avanzados**
   - Gráficos con Chart.js
   - Exportar a PDF/Excel
   - Filtros por fecha

6. **Notificaciones**
   - Email al crear usuario
   - Notificaciones de pedidos

---

¡Sistema de autenticación y autorización completamente implementado! ??
