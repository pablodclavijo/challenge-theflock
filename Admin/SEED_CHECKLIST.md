# Seed Data Implementation Checklist

## ? Requerimiento 7.3 - Seed Data

### Usuarios
- [x] 1 Administrador creado
  - Email: admin@admin.com
  - Password: Admin123!
  - Rol: Admin
  
- [x] 3 Vendedores creados
  - vendedor1@tienda.com - Carlos Martínez
  - vendedor2@tienda.com - Ana García  
  - vendedor3@tienda.com - Luis Rodríguez
  - Password: Vendedor123!
  - Rol: Vendedor
  
- [x] 5 Compradores creados
  - comprador1@email.com - María López
  - comprador2@email.com - Juan Pérez
  - comprador3@email.com - Patricia Sánchez
  - comprador4@email.com - Roberto González
  - comprador5@email.com - Laura Fernández
  - Password: Comprador123!
  - Rol: Comprador

### Roles
- [x] Rol "Admin" creado
- [x] Rol "Vendedor" creado
- [x] Rol "Comprador" creado

### Categorías
- [x] Al menos 3 categorías distintas creadas (7 en total)
  - Electrónica
  - Ropa y Moda
  - Hogar y Cocina
  - Deportes
  - Libros
  - Juguetes
  - Belleza y Salud

### Productos
- [x] Al menos 20 productos creados (25 en total)
- [x] Productos distribuidos en distintas categorías
- [x] Productos con precios realistas
- [x] Productos con stock variado
- [x] Productos con descripciones detalladas

### Pedidos
- [x] Al menos 10 pedidos creados (12 en total)
- [x] Pedidos en distintos estados
  - Pending (pendientes)
  - Confirmed (confirmados)
  - Shipped (enviados)
  - Delivered (entregados)
- [x] Pedidos distribuidos entre los compradores
- [x] Pedidos con múltiples items (1-4 productos por pedido)
- [x] Pedidos con cálculos correctos (subtotal, tax, total)

### Automatización
- [x] Seed se ejecuta automáticamente al iniciar la aplicación
- [x] Seed verifica existencia antes de crear datos
- [x] Migraciones se aplican automáticamente
- [x] No requiere comandos manuales adicionales

### Funcionalidad
- [x] Es posible levantar la aplicación y ver contenido inmediatamente
- [x] Login funciona con las credenciales de prueba
- [x] Admin puede ver todos los datos
- [x] Vendedores pueden ver productos y pedidos
- [x] Compradores pueden hacer login

### Documentación
- [x] SEED_DATA.md con detalles de todos los datos
- [x] SEED_IMPLEMENTATION.md con resumen de implementación
- [x] QUICK_START.md actualizado con instrucciones
- [x] Login.cshtml actualizado con credenciales de prueba

### Testing
- [x] Compilación exitosa
- [x] No hay errores de TypeScript
- [x] Seed no genera excepciones
- [x] Datos se crean correctamente

---

## ?? Verificación Manual

### Paso 1: Primera Ejecución
```bash
dotnet run
```
**Resultado esperado:** La aplicación inicia sin errores y aplica migraciones

### Paso 2: Login como Admin
1. Navegar a https://localhost:7000
2. Login con: admin@admin.com / Admin123!
3. **Resultado esperado:** Acceso al dashboard con estadísticas

### Paso 3: Verificar Productos
1. Ir a "Productos" en el menú
2. **Resultado esperado:** Lista de 25 productos visibles

### Paso 4: Verificar Pedidos
1. Ir a "Pedidos" en el menú
2. **Resultado esperado:** Lista de 12 pedidos visibles
3. Filtrar por estado
4. **Resultado esperado:** Pedidos filtrados correctamente

### Paso 5: Verificar Usuarios (solo Admin)
1. Ir a "Usuarios" en el menú
2. **Resultado esperado:** Lista de 9 usuarios (1 admin, 3 vendedores, 5 compradores)

### Paso 6: Login como Vendedor
1. Logout
2. Login con: vendedor1@tienda.com / Vendedor123!
3. **Resultado esperado:** Acceso limitado (sin acceso a Usuarios)

### Paso 7: Login como Comprador
1. Logout
2. Login con: comprador1@email.com / Comprador123!
3. **Resultado esperado:** Acceso básico

---

## ?? Estadísticas de Datos

- **Total Usuarios:** 9 (1 admin + 3 vendedores + 5 compradores)
- **Total Categorías:** 7
- **Total Productos:** 25
- **Total Pedidos:** 12
- **Total Order Items:** ~24-36 (promedio 2-3 por pedido)

---

## ? VERIFICACIÓN COMPLETADA

Fecha: _______________
Por: _________________

- [ ] Todos los datos se crearon correctamente
- [ ] Login funciona para los 3 roles
- [ ] Dashboard muestra información
- [ ] Productos visibles en el listado
- [ ] Pedidos visibles con diferentes estados
- [ ] Usuarios visibles (como admin)
- [ ] No hay errores en consola
- [ ] Aplicación lista para demostración

---

## ?? Troubleshooting

### Problema: Los datos no se crean
**Solución:**
```bash
# Eliminar base de datos
dotnet ef database drop -f
# Volver a ejecutar
dotnet run
```

### Problema: Error de conexión a la base de datos
**Solución:** Verificar connection string en appsettings.json

### Problema: Los pedidos no aparecen
**Solución:** Verificar que el rol "Comprador" existe y los compradores están creados

### Problema: No puedo hacer login
**Solución:** Verificar que EmailConfirmed=true para todos los usuarios de prueba

---

## ?? Notas de Implementación

- El seed está implementado en `Data/DbInitializer.cs`
- Se ejecuta automáticamente en `Program.cs` mediante `await DbInitializer.SeedAsync(app.Services)`
- Los datos solo se crean si no existen (verifica con `AnyAsync()`)
- Todas las contraseñas siguen el patrón: `[Rol]123!`
- Los timestamps están distribuidos en los últimos 30-90 días para mayor realismo
