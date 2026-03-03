DESAFÍO TÉCNICO

Comercio Electrónico
Tienda Online
Desafío de Desarrollo Full-Stack

Escaparate: React · API Node.js
Panel Admin: .NET MVC · Razor Views

The Flock
Managed Software Teams

Tiempo estimado: 48–72 hs
Entrega: Repositorio GitHub

The Flock — Desafío Técnico: Comercio Electrónico

1. Descripción General
Este challenge evalúa tu capacidad para desarrollar un sistema de e-commerce completo utilizando
dos stacks tecnológicos que comparten la misma base de datos. El sistema tiene dos interfaces
diferenciadas con propósitos distintos, lo que permite evaluar tu dominio de cada stack en un
contexto realista.

Esperamos que uses herramientas de AI/agentic coding (Cursor, Claude Code, GitHub Copilot,
o similares) durante todo el desarrollo. Parte central de la evaluación es tu capacidad de dirigir
estas herramientas de manera efectiva para producir software de calidad profesional.

2. Arquitectura del Sistema
El sistema se compone de dos aplicaciones independientes que operan sobre la misma base de
datos:

Escaparate Público Base de Datos Panel Vendedor/Admin
React (SPA) .NET MVC (Razorviews)
↓ PostgreSQL / SQLite ↑
API Node.js (schema compartido) Controladores .NET MVC

2.1 Escaparate Público (React + Node.js)
SPA construida en React que consume una API REST en Node.js. Es la interfaz que usan los
compradores para navegar el catálogo, armar su carrito y realizar compras.
2.2 Panel Vendedor/Admin (.NET MVC)
Aplicación server-rendered con .NET MVC y Razor Views. Es la interfaz interna que usan los
vendedores para gestionar productos, ver pedidos y administrar la operación de la tienda.
2.3 Base de Datos Compartida
Ambas aplicaciones leen y escriben en la misma base de datos. El schema debe ser diseñado de
manera coherente para servir a ambas interfaces. Esto es intencional: queremos evaluar tu
capacidad de diseñar un modelo de datos que funcione para dos consumidores distintos.

3. Importante: Observamos el Proceso
Vamos a analizar no solo el resultado final, sino todo el proceso de desarrollo. En particular:

Página 2

The Flock — Technical Challenge: E-Commerce

• El repositorio GitHub: debe ser público (o compartido con los evaluadores). Todo el
historial de desarrollo debe estar visible.
• Los commits: no hagas squash. Queremos ver cada commit individual, su mensaje, su
tamaño y su coherencia. Los commits deben contar la historia de cómo construiste la
aplicación.
• La evolución: esperamos ver una progresión lógica, desde el scaffolding inicial hasta
features completas. No un solo commit gigante al final.
• Patrones de uso de AI: un buen uso de agentic coding se nota en la consistencia de
patterns, buena estructura desde el arranque, y velocidad de iteración.

4. Stack Tecnológico
4.1 Storefront Público
• Frontend: React (con TypeScript preferentemente)
• Backend: Node.js (Express, Fastify, o similar) en modo API REST
• Styling: Tailwind CSS, CSS Modules, o styled-components (a elección)
• Autenticación: JWT
4.2 Panel Vendedor/Admin
• Framework: .NET MVC con Razor Views (server-side rendering)
• Autenticación: ASP.NET Identity o cookie-based auth
• Styling: Bootstrap, Tailwind, o similar (a elección)
4.3 Base de Datos
• Motor: PostgreSQL (preferido) o SQLite
• ORM: Entity Framework Core para .NET; Sequelize, Prisma, o Knex para Node.js
• Migraciones: ambas apps deben poder correr migraciones sin conflicto. Recomendamos
que un solo lado “ownee” las migraciones (preferentemente .NET con EF Core) y el otro
trabaje sobre el schema existente.

5. Features: Storefront Público (React + Node.js)
5.1 Autenticación
• Registro de comprador (email + password como mínimo)
• Login / Logout con JWT
• Protección de rutas: el carrito y checkout requieren sesión válida
• Perfil básico del comprador (nombre, email, dirección de envío)
5.2 Catálogo de Productos
• Listado de productos con imagen, nombre, precio y stock disponible

Página 3

The Flock — Technical Challenge: E-Commerce

• Paginación o infinite scroll
• Filtros por categoría y rango de precio
• Búsqueda de productos por nombre
• Vista de detalle de producto con descripción completa
5.3 Carrito de Compras
• Agregar productos al carrito con cantidad
• Modificar cantidades o eliminar items del carrito
• Persistencia del carrito (que no se pierda al navegar)
• Vista resumen con subtotal, impuestos (valor fijo %) y total
5.4 Checkout y Pedidos
• Flujo de checkout: confirmar dirección, revisar pedido, confirmar compra
• No se requiere integración real con pasarela de pagos — simular el pago con un botón que
confirma la orden
• Confirmación de pedido con número de orden
• Historial de pedidos del comprador con estado (pendiente, confirmado, enviado, entregado)
5.5 Responsive Design
• La aplicación debe ser completamente responsive y usable en mobile
• Approach mobile-first: diseño pensado primero para mobile y escalado a desktop
• Breakpoints mínimos: mobile (< 640px), tablet (640–1024px), desktop (> 1024px)

6. Features: Panel Vendedor/Admin (.NET MVC)
6.1 Autenticación y Roles
• Login / Logout para vendedores y administradores
• Dos roles diferenciados: Vendedor y Admin
• Protección de vistas y acciones por rol (un vendedor no puede acceder a funciones de
admin)
6.2 Gestión de Productos (Vendedor)
• ABM completo de productos: nombre, descripción, precio, stock, categoría, imagen (URL o
upload)
• Listado paginado con filtros por categoría y estado (activo/inactivo)
• Activar/desactivar productos (sin eliminar físicamente)
• Gestión de stock: ajustar cantidades manualmente
6.3 Gestión de Pedidos (Vendedor)
• Ver listado de pedidos paginado con filtros por estado y fecha

Página 4

The Flock — Technical Challenge: E-Commerce

• Ver detalle del pedido: productos, cantidades, datos del comprador, total
• Cambiar estado del pedido: pendiente → confirmado → enviado → entregado
• El cambio de estado debe descontar stock automáticamente al confirmar (si no se descontó
al crear la orden)
6.4 Administración (Admin)
• ABM de categorías de productos
• ABM de vendedores (crear, editar, desactivar cuentas)
• Dashboard con métricas: ventas del día/semana/mes, productos más vendidos, pedidos por
estado, ingresos totales
6.5 UI del Panel
• Layout con sidebar de navegación y área de contenido principal
• Diseño funcional: no se espera un diseño pixel-perfect, pero sí una interfaz profesional y
usable
• Tablas con paginación server-side

7. Requerimientos Técnicos
7.1 Testing
Se espera cobertura de tests razonable en ambos backends (Node.js y .NET). Esto incluye:
• Unit tests para modelos, validaciones, y lógica de negocio (ej: cálculo de totales, descuento
de stock)
• Tests de integración para endpoints críticos de la API (Node.js) y controllers (.NET)
• Al menos un test end-to-end del flujo de autenticación en cada stack
7.2 API Documentation (Node.js)
• La API REST de Node.js debe estar documentada con Swagger/OpenAPI
• Debe incluir ejemplos de request/response para cada endpoint
• La documentación debe ser accesible desde una ruta del proyecto (ej: /api-docs)
7.3 Seed Data
• El proyecto debe incluir un seed que genere datos realistas: al menos 5 compradores, 3
vendedores, 1 admin, 20+ productos en distintas categorías, y 10+ pedidos en distintos
estados
• Debe ser posible levantar ambas aplicaciones y ver contenido inmediatamente después de
correr el seed
7.4 README
El README del repositorio debe incluir:

Página 5

The Flock — Technical Challenge: E-Commerce

1. Instrucciones claras de setup para ambas aplicaciones (debe poder levantarse con mínimos
pasos)
2. Diagrama o descripción de la arquitectura y cómo se relacionan las dos apps
3. Decisiones de arquitectura: por qué elegiste determinado approach para auth, manejo de
migraciones compartidas, estructura de componentes, manejo de stock, etc.
4. Trade-offs y limitaciones conocidas
5. Qué herramientas de AI usaste y cómo las aprovechaste

8. Features Opcionales (Bonus)
Elegí al menos una o dos de las siguientes features. Estas suman puntos y dan señal de tu
capacidad de manejar complejidad adicional con herramientas de AI:
• Notificaciones en tiempo real: cuando un pedido cambia de estado, el comprador ve la
actualización sin recargar (WebSockets / SignalR / Server-Sent Events).
• Upload de imágenes: permitir que los vendedores suban imágenes de productos (no solo
URLs).
• Sistema de reviews: los compradores pueden dejar reseñas y puntuación en productos que
compraron. Nota: este feature es intencionalmente ambiguo — las decisiones de diseño son
parte de la evaluación.
• Cupones de descuento: crear y aplicar códigos de descuento en el checkout (porcentaje o
monto fijo, con fecha de vencimiento).
• Dark mode: toggle dark/light en el storefront con persistencia de preferencia.
• CI/CD: configurar GitHub Actions con lint, tests, y build automáticos para ambos stacks.
• Docker: docker-compose que levante todo el sistema (ambas apps + base de datos) con un
solo comando.

9. Entrega
9.1 Estructura del Repositorio
Recomendamos un monorepo con la siguiente estructura (adaptable según tu criterio):
/storefront — React app (tienda pública)
/api — Node.js API
/admin — .NET MVC app (panel vendedor/admin)
/docs — documentación adicional (diagramas, etc.)
9.2 Formato de Entrega
• Repositorio GitHub: crear un repositorio (público o con acceso para los evaluadores) y
compartir el link.
• Commits sin squash: todo el historial debe estar visible. No se acepta un solo commit con
todo el código.

Página 6

The Flock — Technical Challenge: E-Commerce

• Branch principal: el código entregado debe estar en main o master.
9.3 Plazo
El plazo de entrega es de 72 horas calendario desde que recibís este documento. Si necesitás una
extensión, comunicálo con anticipación.
9.4 Qué esperamos ver en el repo
1. Primeros commits: scaffolding de los tres proyectos (React, Node.js, .NET).
2. Commits progresivos: features implementadas una a una, con mensajes descriptivos.
3. Commits de testing: tests agregados junto con las features, no todos al final.
4. Últimos commits: polish, documentación, y cleanup.

10. Rúbrica de Evaluación

Criterio Peso Qué evaluamos
Funcionalidad 25% Todas las features obligatorias funcionan en ambas apps. El
sistema es usable de punta a punta: un comprador puede
comprar y un vendedor puede gestionar.

Calidad de código 20% Código limpio y consistente en ambos stacks. Buenos patterns

de Node.js, React, y .NET MVC. Naming claro.

Testing 15% Cobertura razonable en ambos backends. Tests que validen

lógica real, no tests vacíos.

Proceso de desarrollo 15% Historial de commits coherente. Progresión lógica. Evidencia de

buen uso de herramientas de AI.

Arquitectura 10% Diseño de DB compartida coherente. Manejo de migraciones.
Separación de concerns entre apps. Lógica de stock
consistente.

Documentación 10% README completo, API docs, decisiones de arquitectura

explicadas, diagrama de sistema.

Bonus features 5% Features opcionales implementadas correctamente. Puntos

extra por complejidad y calidad.

11. Nota Final
Este challenge está diseñado para ser completado con asistencia de herramientas de agentic
coding. El scope es intencionalmente amplio — dos aplicaciones sobre una base de datos
compartida — para evaluar tu capacidad de dirigir estas herramientas de manera efectiva, tomar
decisiones técnicas de arquitectura, y entregar software de calidad profesional en un tiempo
acotado.

Página 7

The Flock — Technical Challenge: E-Commerce

No buscamos perfección, buscamos pragmatismo inteligente: saber qué delegar a la AI, qué revisar
a mano, y cómo iterar rápido sin sacrificar calidad. La complejidad adicional de manejar dos stacks
distintos es deliberada: refleja la realidad de nuestros proyectos.
¡Buena suerte!

Página 8