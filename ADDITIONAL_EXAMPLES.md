# Ejemplo de Páginas Adicionales

## Página Simple (Sin Tabla)

Si necesitas una página sin tabla, puedes crear algo así:

### Categories/Index.cshtml.cs
```csharp
using AdminPanel.Data;
using AdminPanel.Models;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminPanel.Pages.Categories
{
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _context;

        public IndexModel(ApplicationDbContext context)
        {
            _context = context;
        }

        public List<Category> Categories { get; set; } = new();

        public async Task OnGetAsync()
        {
            Categories = await _context.Categories
                .Include(c => c.Products)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
    }
}
```

### Categories/Index.cshtml
```razor
@page
@model AdminPanel.Pages.Categories.IndexModel
@{
    ViewData["Title"] = "Categorías";
    Layout = "_AdminLayout";
}

<div class="page-header">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
            <h1>Categorías</h1>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a asp-page="/Index">Dashboard</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Categorías</li>
                </ol>
            </nav>
        </div>
        <div>
            <a asp-page="./Create" class="btn btn-primary">
                <i class="bi bi-plus-circle"></i> Nueva Categoría
            </a>
        </div>
    </div>
</div>

<div class="row g-3">
    @foreach (var category in Model.Categories)
    {
        <div class="col-sm-6 col-lg-4">
            <div class="admin-card h-100">
                <div class="admin-card-body">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div>
                            <h3 class="h5 mb-1">@category.Name</h3>
                            <p class="text-muted small mb-0">
                                <i class="bi bi-box-seam"></i> 
                                @category.Products.Count producto(s)
                            </p>
                        </div>
                        @if (!string.IsNullOrEmpty(category.ImageUrl))
                        {
                            <img src="@category.ImageUrl" 
                                 alt="@category.Name" 
                                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        }
                    </div>
                    
                    @if (!string.IsNullOrEmpty(category.Description))
                    {
                        <p class="text-muted small mb-3">
                            @(category.Description.Length > 100 
                                ? category.Description.Substring(0, 100) + "..." 
                                : category.Description)
                        </p>
                    }
                    
                    <div class="d-flex gap-2">
                        <a asp-page="./Details" asp-route-id="@category.Id" 
                           class="btn btn-sm btn-outline-primary flex-fill">
                            <i class="bi bi-eye"></i> Ver
                        </a>
                        <a asp-page="./Edit" asp-route-id="@category.Id" 
                           class="btn btn-sm btn-outline-secondary flex-fill">
                            <i class="bi bi-pencil"></i> Editar
                        </a>
                        <a asp-page="./Delete" asp-route-id="@category.Id" 
                           class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-trash"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    }
    
    @if (!Model.Categories.Any())
    {
        <div class="col-12">
            <div class="admin-card">
                <div class="admin-card-body text-center py-5">
                    <i class="bi bi-tags display-1 text-muted opacity-50"></i>
                    <h3 class="mt-3">No hay categorías</h3>
                    <p class="text-muted">Comienza creando tu primera categoría</p>
                    <a asp-page="./Create" class="btn btn-primary mt-2">
                        <i class="bi bi-plus-circle"></i> Crear Categoría
                    </a>
                </div>
            </div>
        </div>
    }
</div>
```

---

## Formulario de Creación/Edición

### Products/Create.cshtml
```razor
@page
@model AdminPanel.Pages.Products.CreateModel
@{
    ViewData["Title"] = "Nuevo Producto";
    Layout = "_AdminLayout";
}

<div class="page-header">
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a asp-page="/Index">Dashboard</a></li>
            <li class="breadcrumb-item"><a asp-page="./Index">Productos</a></li>
            <li class="breadcrumb-item active" aria-current="page">Nuevo</li>
        </ol>
    </nav>
    <h1>Nuevo Producto</h1>
</div>

<div class="row">
    <div class="col-lg-8">
        <div class="admin-card">
            <div class="admin-card-header">
                <h2>Información del Producto</h2>
            </div>
            <div class="admin-card-body">
                <form method="post" enctype="multipart/form-data">
                    <div asp-validation-summary="ModelOnly" class="alert alert-danger" role="alert"></div>
                    
                    <div class="mb-3">
                        <label asp-for="Product.Name" class="form-label"></label>
                        <input asp-for="Product.Name" class="form-control" />
                        <span asp-validation-for="Product.Name" class="text-danger"></span>
                    </div>

                    <div class="mb-3">
                        <label asp-for="Product.Description" class="form-label"></label>
                        <textarea asp-for="Product.Description" class="form-control" rows="4"></textarea>
                        <span asp-validation-for="Product.Description" class="text-danger"></span>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label asp-for="Product.Price" class="form-label"></label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input asp-for="Product.Price" class="form-control" type="number" step="0.01" />
                            </div>
                            <span asp-validation-for="Product.Price" class="text-danger"></span>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label asp-for="Product.Stock" class="form-label"></label>
                            <input asp-for="Product.Stock" class="form-control" type="number" />
                            <span asp-validation-for="Product.Stock" class="text-danger"></span>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label asp-for="Product.CategoryId" class="form-label"></label>
                        <select asp-for="Product.CategoryId" 
                                asp-items="Model.CategorySelectList" 
                                class="form-select">
                            <option value="">-- Seleccione una categoría --</option>
                        </select>
                        <span asp-validation-for="Product.CategoryId" class="text-danger"></span>
                    </div>

                    <div class="mb-3">
                        <label asp-for="Product.ImageUrl" class="form-label"></label>
                        <input asp-for="Product.ImageUrl" class="form-control" />
                        <span asp-validation-for="Product.ImageUrl" class="text-danger"></span>
                        <div class="form-text">URL de la imagen del producto</div>
                    </div>

                    <div class="form-check mb-3">
                        <input asp-for="Product.IsActive" class="form-check-input" type="checkbox" />
                        <label asp-for="Product.IsActive" class="form-check-label"></label>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-check-circle"></i> Guardar
                        </button>
                        <a asp-page="./Index" class="btn btn-outline-secondary">
                            <i class="bi bi-x-circle"></i> Cancelar
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        <div class="admin-card">
            <div class="admin-card-header">
                <h2>Ayuda</h2>
            </div>
            <div class="admin-card-body">
                <p class="small text-muted mb-2">
                    <i class="bi bi-info-circle"></i> 
                    <strong>Nombre:</strong> Nombre descriptivo del producto
                </p>
                <p class="small text-muted mb-2">
                    <i class="bi bi-info-circle"></i> 
                    <strong>Precio:</strong> Precio en USD
                </p>
                <p class="small text-muted mb-2">
                    <i class="bi bi-info-circle"></i> 
                    <strong>Stock:</strong> Cantidad disponible
                </p>
                <p class="small text-muted mb-0">
                    <i class="bi bi-info-circle"></i> 
                    <strong>Activo:</strong> Si el producto está visible en la tienda
                </p>
            </div>
        </div>
    </div>
</div>

@section Scripts {
    <partial name="_ValidationScriptsPartial" />
}
```

---

## Tips de Diseño Mobile-First

### 1. Grid Responsivo
```html
<!-- En mobile: 1 columna, en tablet: 2, en desktop: 4 -->
<div class="row g-3">
    <div class="col-12 col-sm-6 col-lg-3">...</div>
    <div class="col-12 col-sm-6 col-lg-3">...</div>
    <div class="col-12 col-sm-6 col-lg-3">...</div>
    <div class="col-12 col-sm-6 col-lg-3">...</div>
</div>
```

### 2. Botones Stack en Mobile
```html
<div class="d-flex flex-column flex-sm-row gap-2">
    <button class="btn btn-primary">Acción 1</button>
    <button class="btn btn-secondary">Acción 2</button>
</div>
```

### 3. Ocultar/Mostrar según Tamaño
```html
<!-- Visible solo en mobile -->
<div class="d-block d-md-none">Contenido móvil</div>

<!-- Oculto en mobile -->
<div class="d-none d-md-block">Contenido desktop</div>
```

### 4. Texto Responsivo
```html
<h1 class="fs-5 fs-md-3 fs-lg-1">Título Responsivo</h1>
```

---

## Componentes Útiles Adicionales

### Loading Spinner
```html
<div class="spinner-overlay" id="loadingSpinner" style="display: none;">
    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">Cargando...</span>
    </div>
</div>
```

### Confirmación Modal
```html
<div class="modal fade" id="confirmModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirmar acción</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                ¿Está seguro de que desea continuar?
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="confirmButton">Confirmar</button>
            </div>
        </div>
    </div>
</div>
```
