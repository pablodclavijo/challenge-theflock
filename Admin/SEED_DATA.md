# Seed Data Documentation

Este documento describe los datos de prueba (seed data) generados automáticamente al iniciar la aplicación.

## Usuarios Creados

### 1 Administrador
- **Email:** admin@admin.com
- **Contraseña:** Admin123!
- **Nombre:** Administrador del Sistema
- **Rol:** Admin
- **Dirección:** Calle Principal 123, Ciudad

### 3 Vendedores
1. **Email:** vendedor1@tienda.com
   - **Contraseña:** Vendedor123!
   - **Nombre:** Carlos Martínez
   - **Rol:** Vendedor
   - **Dirección:** Av. Comercio 456, Local 5

2. **Email:** vendedor2@tienda.com
   - **Contraseña:** Vendedor123!
   - **Nombre:** Ana García
   - **Rol:** Vendedor
   - **Dirección:** Plaza Central 789, Piso 2

3. **Email:** vendedor3@tienda.com
   - **Contraseña:** Vendedor123!
   - **Nombre:** Luis Rodríguez
   - **Rol:** Vendedor
   - **Dirección:** Calle del Mercado 321, Oficina 10

### 5 Compradores
1. **Email:** comprador1@email.com
   - **Contraseña:** Comprador123!
   - **Nombre:** María López
   - **Dirección:** Residencial Los Pinos 123

2. **Email:** comprador2@email.com
   - **Contraseña:** Comprador123!
   - **Nombre:** Juan Pérez
   - **Dirección:** Urbanización El Rosal 456

3. **Email:** comprador3@email.com
   - **Contraseña:** Comprador123!
   - **Nombre:** Patricia Sánchez
   - **Dirección:** Conjunto Habitacional Vista Hermosa 789

4. **Email:** comprador4@email.com
   - **Contraseña:** Comprador123!
   - **Nombre:** Roberto González
   - **Dirección:** Barrio San José 234

5. **Email:** comprador5@email.com
   - **Contraseña:** Comprador123!
   - **Nombre:** Laura Fernández
   - **Dirección:** Colonia Primavera 567

## Categorías Creadas (7 categorías)

1. **Electrónica** - 6 productos
2. **Ropa y Moda** - 4 productos
3. **Hogar y Cocina** - 4 productos
4. **Deportes** - 3 productos
5. **Libros** - 3 productos
6. **Juguetes** - 2 productos
7. **Belleza y Salud** - 3 productos

**Total: 25 productos**

## Productos (muestra)

### Electrónica
- Laptop HP 15 - $799.99 (Stock: 15)
- Mouse Logitech MX Master 3 - $99.99 (Stock: 30)
- Teclado Mecánico Razer - $149.99 (Stock: 20)
- Monitor Samsung 27" - $249.99 (Stock: 12)
- Auriculares Sony WH-1000XM4 - $349.99 (Stock: 8)
- Webcam Logitech C920 - $79.99 (Stock: 25)

### Ropa y Moda
- Camiseta Nike Deportiva - $29.99 (Stock: 50)
- Jeans Levi's 501 - $89.99 (Stock: 35)
- Zapatillas Adidas Running - $129.99 (Stock: 28)
- Chaqueta North Face - $199.99 (Stock: 18)

### Hogar y Cocina
- Cafetera Nespresso - $149.99 (Stock: 22)
- Licuadora Oster - $79.99 (Stock: 30)
- Set de Ollas Tramontina - $199.99 (Stock: 15)
- Aspiradora Robot Roomba - $399.99 (Stock: 10)

### Deportes
- Bicicleta de Montaña - $499.99 (Stock: 8)
- Mancuernas Ajustables 20kg - $149.99 (Stock: 20)
- Colchoneta de Yoga - $39.99 (Stock: 45)

### Libros
- Clean Code - Robert Martin - $49.99 (Stock: 25)
- El Principito - $19.99 (Stock: 40)
- Cien Años de Soledad - $29.99 (Stock: 35)

### Juguetes
- LEGO Star Wars Millennium Falcon - $159.99 (Stock: 12)
- Muñeca Barbie Dreamhouse - $199.99 (Stock: 10)

### Belleza y Salud
- Perfume Chanel No. 5 - $149.99 (Stock: 18)
- Kit de Cuidado Facial Neutrogena - $59.99 (Stock: 30)
- Cepillo Eléctrico Oral-B - $89.99 (Stock: 22)

## Pedidos (12 pedidos)

Los pedidos se generan automáticamente con las siguientes características:

- **Estados variados:** Pending, Confirmed, Shipped, Delivered
- **Distribución temporal:** Pedidos de los últimos 30 días
- **Compradores:** Distribuidos entre los 5 compradores
- **Items:** De 1 a 4 productos por pedido
- **Cantidades:** De 1 a 3 unidades por producto
- **Impuestos:** 16% IVA incluido en el total

### Distribución de Estados
- **Delivered:** Pedidos de hace más de 20 días
- **Shipped:** Pedidos entre 10-20 días
- **Confirmed:** Pedidos entre 5-10 días
- **Pending:** Pedidos de menos de 5 días

## Cómo Usar los Datos de Prueba

1. **Primera ejecución:** Al iniciar la aplicación por primera vez, los datos se crearán automáticamente
2. **Re-seed:** Para regenerar los datos, elimina la base de datos y vuelve a ejecutar la aplicación
3. **Login:** Usa cualquiera de las credenciales listadas arriba según el rol que quieras probar

## Notas Importantes

- Todos los usuarios tienen `EmailConfirmed = true` para acceso inmediato
- Todos los usuarios están activos (`IsActive = true`)
- Los precios incluyen decimales realistas
- Los stocks varían para simular diferentes niveles de inventario
- Las fechas de creación están distribuidas en el tiempo para datos más realistas
- Los pedidos más antiguos tienen estado "Delivered", los más recientes "Pending"

## Base de Datos

El seed se ejecuta automáticamente en `Program.cs` mediante:

```csharp
await DbInitializer.SeedAsync(app.Services);
```

Esto asegura que:
1. Las migraciones se apliquen automáticamente
2. Los datos solo se crean si no existen
3. La aplicación esté lista para usar inmediatamente después del primer inicio
