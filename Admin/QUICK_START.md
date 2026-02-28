# Resumen de Implementación - Admin Panel UI

## ? Lo que se ha creado

### 1. **Layout Responsivo con Sidebar** (`_AdminLayout.cshtml`)
- Sidebar fijo en desktop (?768px)
- Menú flotante (drawer) en mobile con overlay
- Header móvil con toggle
- Sistema de navegación completo
- Mensajes de feedback (TempData)

### 2. **Componente de Tabla Reutilizable** (`_DataTable.cshtml`)
- Paginación server-side
- Columnas personalizables con HTML
- Scroll horizontal en mobile
- Navegación de páginas completa
- Estado vacío

### 3. **Modelo de Paginación** (`PaginatedList.cs`)
- Clase genérica para cualquier entidad
- Método async `CreateAsync`
- Propiedades: HasPreviousPage, HasNextPage, TotalPages, etc.

### 4. **Estilos CSS** (`admin-layout.css`)
- Mobile-first approach
- Variables CSS para personalización
- Cards, headers, forms
- Scrollbar personalizado
- Animaciones suaves

### 5. **JavaScript** (`admin-layout.js`)
- Toggle de sidebar
- Auto-highlight del link activo
- Auto-dismiss de alertas
- Responsive behavior

### 6. **Ejemplos Completos**
- Dashboard con estadísticas
- Página de productos con tabla paginada
- Documentación completa

---

## ?? Cómo usar en nuevas páginas

### Paso 1: Crear el PageModel

```csharp
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages.YourSection
{
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _context;

        public IndexModel(ApplicationDbContext context)
        {
            _context = context;
        }

        public PaginatedList<YourEntity> Items { get; set; } = default!;

        public async Task OnGetAsync(int? pageIndex)
        {
            IQueryable<YourEntity> query = _context.YourEntities;
            
            Items = await PaginatedList<YourEntity>.CreateAsync(
                query, pageIndex ?? 1, pageSize: 10);
        }
    }
}
```

### Paso 2: Crear la Razor Page

```razor
@page
@model YourSection.IndexModel
@{
    ViewData["Title"] = "Tu Título";
    Layout = "_AdminLayout";  // ? Importante: usar el layout de admin
}

<div class="page-header">
    <h1>Tu Título</h1>
</div>

<div class="admin-card">
    <div class="admin-card-body">
        @{
            ViewData["Columns"] = new List<(string Header, Func<dynamic, object> Cell, string CssClass)>
            {
                ("Columna 1", (dynamic item) => item.Property1, ""),
                ("Columna 2", (dynamic item) => item.Property2, "text-center"),
            };

            ViewData["BaseUrl"] = "/YourSection/Index";
            ViewData["CurrentQuery"] = new Dictionary<string, string>();
        }

        <partial name="_DataTable" model="Model.Items" />
    </div>
</div>
```

---

## ?? Personalización del Tema

Para cambiar los colores, edita las variables CSS en `admin-layout.css`:

```css
:root {
    --sidebar-bg: #212529;          /* Color del sidebar */
    --sidebar-hover: #2c3034;       /* Hover en links */
    --primary-color: #0d6efd;       /* Color principal */
    --text-light: #ffffff;          /* Texto claro */
    --text-muted: #adb5bd;          /* Texto secundario */
}
```

---

## ?? Breakpoints del Layout

- **Mobile**: < 768px (sidebar overlay)
- **Tablet**: ? 768px (sidebar fijo)
- **Desktop**: ? 1024px (más padding)

---

## ?? Agregar nuevos items al menú

Edita `_AdminLayout.cshtml`, sección `<nav class="sidebar-nav">`:

```html
<li>
    <a asp-page="/YourPage/Index" class="sidebar-link">
        <i class="bi bi-icon-name"></i>
        <span>Tu Sección</span>
    </a>
</li>
```

---

## ?? Tips y Mejores Prácticas

### 1. Mensajes de Feedback
```csharp
// En tu PageModel después de una acción
TempData["SuccessMessage"] = "Operación exitosa";
// o
TempData["ErrorMessage"] = "Error al procesar";

return RedirectToPage("./Index");
```

### 2. Confirmación antes de eliminar
```javascript
// Ya incluido en el ejemplo de Products/Index.cshtml
document.querySelectorAll('a[href*="/Delete"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
        if (!confirm('¿Está seguro?')) {
            e.preventDefault();
        }
    });
});
```

### 3. Búsqueda y Filtros
```csharp
// En el PageModel
public string CurrentFilter { get; set; } = string.Empty;

public async Task OnGetAsync(string? searchString, int? pageIndex)
{
    CurrentFilter = searchString ?? string.Empty;

    IQueryable<Product> query = _context.Products;

    if (!string.IsNullOrEmpty(searchString))
    {
        query = query.Where(p => p.Name.Contains(searchString));
    }

    Products = await PaginatedList<Product>.CreateAsync(
        query, pageIndex ?? 1, 10);
}
```

```html
<!-- En la página -->
<form method="get" class="mb-4">
    <div class="input-group">
        <input type="text" name="searchString" value="@Model.CurrentFilter" 
               class="form-control" placeholder="Buscar...">
        <button type="submit" class="btn btn-primary">
            <i class="bi bi-search"></i>
        </button>
    </div>
</form>
```

### 4. Ordenamiento
```csharp
// En el PageModel
public string CurrentSort { get; set; } = string.Empty;

productsQuery = sortOrder switch
{
    "name_desc" => productsQuery.OrderByDescending(p => p.Name),
    "price" => productsQuery.OrderBy(p => p.Price),
    "price_desc" => productsQuery.OrderByDescending(p => p.Price),
    _ => productsQuery.OrderBy(p => p.Name)
};
```

---

## ?? Estructura de Archivos Creada

```
AdminPanel/
??? Models/
?   ??? PaginatedList.cs
??? Pages/
?   ??? Shared/
?   ?   ??? _AdminLayout.cshtml
?   ?   ??? _DataTable.cshtml
?   ??? Products/
?   ?   ??? Index.cshtml
?   ?   ??? Index.cshtml.cs
?   ??? Index.cshtml (actualizado con dashboard)
??? wwwroot/
    ??? css/
    ?   ??? admin-layout.css
    ??? js/
        ??? admin-layout.js
```

---

## ?? Próximos Pasos Sugeridos

1. **Crear páginas CRUD completas** para:
   - Categories (Create, Edit, Delete, Details)
   - Products (Create, Edit, Delete, Details)
   - Orders (Index, Details)
   - Users (Index, Details)

2. **Agregar autenticación/autorización**:
   ```csharp
   [Authorize(Roles = "Admin")]
   public class YourPageModel : PageModel
   ```

3. **Implementar búsqueda avanzada** con múltiples filtros

4. **Agregar gráficos** en el dashboard (Chart.js, ApexCharts)

5. **Implementar exportación** (PDF, Excel)

6. **Agregar upload de imágenes** para productos

---

## ?? Troubleshooting

### El sidebar no se abre en mobile
- Verifica que `admin-layout.js` esté cargado
- Comprueba la consola del navegador por errores
- Asegúrate de que Bootstrap está cargado

### La tabla no se renderiza
- Verifica que `ViewData["Columns"]` esté definido
- Comprueba que el modelo sea `PaginatedList<T>`
- Revisa que las propiedades del modelo coincidan

### Los estilos no se aplican
- Limpia caché del navegador (Ctrl+F5)
- Verifica que `admin-layout.css` esté en wwwroot/css
- Comprueba que el link en `_AdminLayout.cshtml` sea correcto

---

## ?? Referencia Rápida de Iconos Bootstrap

```
bi-speedometer2      Dashboard
bi-box-seam          Productos
bi-tags              Categorías
bi-cart              Órdenes/Carrito
bi-people            Usuarios
bi-gear              Configuración
bi-eye               Ver
bi-pencil            Editar
bi-trash             Eliminar
bi-plus-circle       Agregar
bi-search            Buscar
bi-filter            Filtrar
bi-download          Descargar
bi-upload            Subir
bi-check-circle      Success
bi-x-circle          Error
bi-exclamation-triangle  Warning
bi-info-circle       Info
```

Ver todos los iconos en: https://icons.getbootstrap.com/

---

¡Tu Admin Panel está listo para usar! ??
