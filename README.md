# E-Commerce Challenge - The Flock

Sistema para e-commerce con panel de administración en .NET 8, y API REST y aplicación cliente desarrollado con Node.js/Express y React.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Decisiones de Arquitectura](#decisiones-de-arquitectura)
- [Tecnologías](#tecnologías)
- [Puntos Extra Implementados](#puntos-extra-implementados)
- [Requisitos Previos](#requisitos-previos)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Usuarios de Prueba](#usuarios-de-prueba)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Nota sobre el uso de IA](#nota-sobre-el-uso-de-ia)

## 🏗️ Arquitectura

El sistema está compuesto por tres aplicaciones principales que se comunican entre sí:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                    Puerto: 5173 (desarrollo)                    │
│  - Interfaz de usuario para clientes                            │
│  - Gestión de productos, carrito y órdenes                      │
└────────────┬────────────────────────────────────────────────────┘
             │ HTTP REST API
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API REST (Node.js/Express)                 │
│                    Puerto: 3000 (por defecto)                   │
│  - Gestión de autenticación y productos                         │
│  - Procesamiento de órdenes                                     │
│  - Comunicación con RabbitMQ                                    │
└────────────┬────────────────────────────────────────────────────┘
             │ RabbitMQ Messages + PostgreSQL
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN PANEL (ASP.NET Core Razor Pages)             │
│                    Puerto: 7234 (por defecto)                   │
│  - Panel de administración para gestionar la tienda             │
│  - CRUD de productos, categorías y usuarios                     │
│  - Gestión de órdenes y reportes                                │
│  - Dashboard con métricas en tiempo real (SignalR)              │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA                              │
│  ┌──────────────────┐         ┌─────────────────────┐           │
│  │   PostgreSQL     │         │      RabbitMQ       │           │
│  │   Puerto: 5432   │         │   Puerto: 5672      │           │
│  │                  │         │   Management: 15672 │           │
│  └──────────────────┘         └─────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Comunicación

1. **Cliente → API REST**: El frontend React se comunica con la API de Node.js para operaciones CRUD y autenticación.

2. **API REST → RabbitMQ**: Cuando se crea una orden, la API publica un mensaje en RabbitMQ.

3. **RabbitMQ → Admin Panel**: El panel de administración consume los mensajes de RabbitMQ para procesar órdenes en tiempo real.

4. **Admin Panel → RabbitMQ**: El admin panel puede publicar eventos de cambio de estado de órdenes.

5. **SignalR**: Actualizaciones en tiempo real del dashboard cuando hay cambios en órdenes o inventario.

6. **PostgreSQL**: Base de datos compartida entre la API y el Admin Panel (cada uno con su propio DbContext/ORM).

## 🎯 Decisiones de Arquitectura

### 1. **RabbitMQ para Comunicación Asíncrona**

**Decisión**: Usar RabbitMQ como message broker entre la API y el Admin Panel.

**Justificación**:
- **Desacoplamiento**: Los servicios no necesitan conocerse directamente ni estar disponibles al mismo tiempo.
- **Resiliencia**: Si el Admin Panel está caído, los mensajes se encolan y se procesan cuando vuelva a estar disponible.
- **Escalabilidad**: Permite agregar múltiples consumidores para procesar mensajes en paralelo.
- **Event-driven architecture**: Facilita la implementación de patrones de eventos de dominio (OrderCreated, OrderStatusChanged, etc.).
- **Garantía de entrega**: RabbitMQ garantiza que los mensajes no se pierdan incluso si hay fallos en el sistema.

### 2. **PostgreSQL como Base de Datos Compartida**

**Decisión**: Usar PostgreSQL como motor o "dialecto" de base de datos por sobre SQLite.

**Justificación**:
- **Complejidad de datos**: Postgres cuenta con más tipos de datos out-of-the-box que SQLite permitiendo un mayor control
- **Ecosistema y herramientas**: Existe una mayor comunidad y más cantidad de herramientas para postgres en el ecosistema web comparado con SQLite


### 3. **Autenticación (Identity vs JWT)**

**Decisión**: ASP.NET Identity para el Admin Panel y JWT para la API/Frontend.

**Justificación**:
- **Practicidad**: Microsoft Identity se implemente con dos comandos y pocas líneas de código, facilitando el trabajo y permitiendo tenerlo levantado en minutos, mientras que JWT es el estándar para aplicaciones cliente/servidor


### 4. **Arquitectura en Capas en el Admin Panel**

**Decisión**: Implementar una arquitectura en capas (Presentation → Services → Data).

**Justificación**:
- **Separation of Concerns**: Cada capa tiene una responsabilidad clara.
- **Testabilidad**: La lógica de negocio en servicios es fácil de testear unitariamente.
- **Reutilización**: Los servicios pueden ser llamados desde múltiples Razor Pages.
- **Mantenibilidad**: Cambios en la lógica de negocio no afectan directamente a la presentación.

### 5. **SignalR**

**Decisión**: Implementar SignalR para comunicación en tiempo real.

**Justificación**:
- **Mejora en la UX**: permite saber tanto a usuarios como empleados cualquier cambio casi instantáneamente y sin necesidad de tenerlos pendientes a la pantalla recargando el componente, ya que éste los informa.

## 🛠️ Tecnologías

### Admin Panel (.NET)
- **ASP.NET Core 8** - Framework web
- **Razor Pages** - UI y páginas
- **Entity Framework Core** - ORM para PostgreSQL
- **ASP.NET Core Identity** - Autenticación y autorización
- **RabbitMQ Client** - Mensajería asíncrona
- **SignalR** - Comunicación en tiempo real
- **Tailwind CSS** - Estilos

### API REST (Node.js)
- **Node.js + Express** - Framework web
- **TypeScript** - Lenguaje tipado
- **Sequelize** - ORM para PostgreSQL
- **JWT** - Autenticación
- **amqplib** - Cliente RabbitMQ
- **Swagger** - Documentación de API

### Frontend (React)
- **React 19** - Biblioteca UI
- **Vite** - Build tool
- **TypeScript** - Lenguaje tipado
- **React Router** - Navegación
- **TanStack Query** - Gestión de estado del servidor
- **Axios** - Cliente HTTP
- **Radix UI** - Componentes accesibles
- **Tailwind CSS** - Estilos

## ⭐ Puntos Extra Implementados

### 1. **Light/Dark Theme** 🌓

**Implementación en el Frontend (React)**:
- Sistema completo de temas con `next-themes`
- Toggle persistente en localStorage
- Transiciones suaves entre temas
- Paleta de colores adaptada para accesibilidad en ambos modos
- Todos los componentes soportan ambos temas

**Beneficios**:
- Mejor experiencia de usuario según preferencias
- Reduce fatiga visual en ambientes con poca luz
- Mejora accesibilidad para usuarios con sensibilidad a la luz
- Aspecto moderno y profesional

### 2. **Comunicación en Tiempo Real** ⚡

**Implementación con SignalR en el Admin Panel**:
- Hub de comunicación bidireccional (`DashboardHub`)
- Actualizaciones instantáneas del dashboard cuando hay cambios
- Notificaciones automáticas de nuevas órdenes
- Sincronización de métricas en tiempo real (ingresos, productos vendidos, etc.)
- Múltiples usuarios pueden ver los mismos cambios simultáneamente

**Flujo**:
1. Se crea/actualiza una orden en la API o Admin Panel
2. RabbitMQ publica el evento
3. El consumer del Admin Panel recibe el mensaje
4. SignalR notifica a todos los clientes conectados
5. El dashboard se actualiza automáticamente sin refresh

**Beneficios**:
- Información siempre actualizada sin necesidad de refrescar
- Mejora la colaboración entre múltiples administradores
- Reduce la carga del servidor (no hay polling)
- Experiencia de usuario superior

## **Tests Unitarios Completos** 🧪

Se implementaron tests unitarios para:
- **Admin Panel**: Tests para Razor Pages y Services
- **API**: Tests para casos de uso y controladores
- **Frontend**: Tests para componentes y hooks

Cobertura de código > 80% en todos los proyectos.
Tanto el panel de Admin como el backend tienen tests End-to-end del flujo de auth

## ⚙️ Requisitos Previos

Programas requeridos para correr los proyectos:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [PostgreSQL](https://www.postgresql.org/download/) (versión 12 o superior)
- [RabbitMQ](https://www.rabbitmq.com/download.html) (versión 3.8 o superior)


```bash
# .NET 8
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update && sudo apt-get install -y dotnet-sdk-8.0

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# RabbitMQ
sudo apt-get install -y rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
```

## 🔧 Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/pablodclavijo/challenge-theflock.git
cd challenge-theflock
```

### 2. Configurar PostgreSQL

Crea la base de datos:

```bash
# Conéctate a PostgreSQL
psql -U postgres

# Dentro de psql, ejecuta:
CREATE DATABASE ecommerce;
\q
```

### 3. Configurar RabbitMQ

RabbitMQ debería estar corriendo con la configuración por defecto. Puedes verificar accediendo a:

- **Management UI**: http://localhost:15672
- **Usuario por defecto**: guest
- **Contraseña por defecto**: guest

### 4. Configurar Variables de Entorno

#### API REST (Node.js)

Crea el archivo `.env` en el directorio `api/`:

```bash
cd api
cp .env.example .env
```

Edita el archivo `api/.env` con tus credenciales:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=tu_password_postgresql

JWT_SECRET=cambia_esto_por_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173

RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

#### Frontend (React)

Crea el archivo `.env` en el directorio `client/`:

```bash
cd ../client
cp .env.example .env
```

Edita el archivo `client/.env`:

```env
ADMIN_BASE_URL="http://localhost:7234"
```

#### Admin Panel (.NET)

Edita el archivo `Admin/appsettings.json` con tus credenciales:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Password=tu_password_postgresql;Persist Security Info=True;Username=postgres;Database=ecommerce"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Port": "5672",
    "Username": "guest",
    "Password": "guest",
    "VirtualHost": "/"
  },
  "AllowedHosts": "*"
}
```

## 🚀 Ejecución

### Ejecutar Todo en Comandos Separados

Abre **4 terminales diferentes** y ejecuta lo siguiente:

#### Terminal 1 - Admin Panel (.NET)

```bash
cd Admin
dotnet restore
dotnet ef database update
dotnet run
```

El panel de administración estará disponible en: http://localhost:7234

#### Terminal 2 - API REST (Node.js)

```bash
cd api
npm install
npm build
npm start
```

La API estará disponible en: http://localhost:3000
Documentación Swagger: http://localhost:3000/api-docs

#### Terminal 3 - Frontend (React)

```bash
cd client
npm install
npm run dev
```

El frontend estará disponible en: http://localhost:5173

#### Terminal 4 - Compilar CSS del Admin Panel (Opcional)

Si necesitas hacer cambios en los estilos del Admin Panel:

```bash
cd Admin
npm install
npm run watch:css
```
## 👥 Usuarios de Prueba

El sistema viene con datos de prueba (seed data) que se crean automáticamente la primera vez que ejecutas el Admin Panel.

### Credenciales de Acceso

#### Admin Panel

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@admin.com | Admin123! |
| Vendedor | vendedor1@tienda.com | Vendedor123! |
| Vendedor | vendedor2@tienda.com | Vendedor123! |
| Vendedor | vendedor3@tienda.com | Vendedor123! |
| Comprador | comprador1@email.com | Comprador123! |
| Comprador | comprador2@email.com | Comprador123! |
| Comprador | comprador3@email.com | Comprador123! |
| Comprador | comprador4@email.com | Comprador123! |
| Comprador | comprador5@email.com | Comprador123! |

### Permisos por Rol

- **Administrador**: Acceso completo a todas las funcionalidades
- **Vendedor**: Puede gestionar productos, ver órdenes y reportes
- **Comprador**: Solo puede ver el dashboard y algunas funcionalidades limitadas

## 📁 Estructura del Proyecto

```
challenge-theflock/
├── Admin/                          # Panel de Administración (.NET 8)
│   ├── Constants/                  # Constantes (Roles, Estados)
│   ├── Controllers/                # Controladores MVC
│   ├── Data/                       # DbContext y migraciones
│   │   ├── ApplicationDbContext.cs
│   │   └── DbInitializer.cs       # Datos de prueba
│   ├── Enums/                      # Enumeraciones
│   ├── Hubs/                       # SignalR Hubs
│   ├── Models/                     # Modelos de datos
│   ├── Pages/                      # Razor Pages
│   │   ├── Account/               # Login/Logout
│   │   ├── Categories/            # CRUD Categorías
│   │   ├── Orders/                # Gestión de Órdenes
│   │   ├── Products/              # CRUD Productos
│   │   ├── Reports/               # Reportes
│   │   └── Users/                 # CRUD Usuarios
│   ├── Services/                   # Lógica de negocio
│   │   ├── Messaging/             # RabbitMQ Publishers/Consumers
│   │   ├── CategoryService.cs
│   │   ├── OrderService.cs
│   │   ├── ProductService.cs
│   │   └── ...
│   ├── Views/                      # Vistas MVC
│   ├── wwwroot/                    # Archivos estáticos
│   ├── Program.cs                  # Punto de entrada
│   ├── appsettings.json           # Configuración
│   └── AdminPanel.csproj
│
├── api/                            # API REST (Node.js/Express)
│   ├── src/
│   │   ├── application/           # Casos de uso
│   │   ├── domain/                # Modelos y lógica de dominio
│   │   ├── infrastructure/        # Implementaciones (DB, RabbitMQ)
│   │   │   ├── database/         # Sequelize modelos
│   │   │   └── messaging/        # RabbitMQ configuración
│   │   ├── interfaces/           # Controladores y rutas
│   │   └── server.ts             # Punto de entrada
│   ├── .env.example              # Plantilla de configuración
│   ├── package.json
│   └── tsconfig.json
│
├── client/                         # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── hooks/                # Custom hooks
│   │   ├── lib/                  # Utilidades
│   │   ├── pages/                # Páginas/Vistas
│   │   ├── services/             # API clients
│   │   ├── App.tsx               # Componente principal
│   │   └── main.tsx              # Punto de entrada
│   ├── .env.example              # Plantilla de configuración
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── AdminPanel.Tests/              # Tests unitarios (.NET)
│   ├── Pages/
│   └── Services/
│
└── README.md                      # Este archivo
```

## 🧪 Ejecutar Tests

### Admin Panel Tests

```bash
cd AdminPanel.Tests
dotnet test
```

### API Tests

```bash
cd api
npm test
```

### Frontend Tests

```bash
cd client
npm test
```

## 📊 Funcionalidades Principales

### Admin Panel
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión de usuarios (CRUD)
- ✅ Gestión de categorías (CRUD)
- ✅ Gestión de productos (CRUD) con imágenes
- ✅ Gestión de órdenes con cambio de estado
- ✅ Control de inventario y movimientos de stock
- ✅ Reportes y análisis
- ✅ Autenticación con ASP.NET Identity
- ✅ Autorización basada en roles
- ✅ Actualizaciones en tiempo real con SignalR

### API REST
- ✅ Autenticación JWT
- ✅ CRUD de productos
- ✅ CRUD de categorías
- ✅ Gestión de órdenes
- ✅ Integración con RabbitMQ
- ✅ Documentación Swagger
- ✅ Validación de datos

### Frontend
- ✅ Catálogo de productos con filtros
- ✅ Carrito de compras
- ✅ Proceso de checkout
- ✅ Historial de órdenes
- ✅ Autenticación de usuarios
- ✅ Diseño responsive
- ✅ UI moderna con Radix UI



## 📝 Notas Adicionales

- La primera vez que ejecutes el Admin Panel, se crearán automáticamente las tablas en PostgreSQL y se insertarán datos de prueba.
- RabbitMQ se usa para comunicación asíncrona entre la API y el Admin Panel.
- SignalR proporciona actualizaciones en tiempo real en el dashboard del Admin Panel.
- Todos los passwords de prueba siguen el formato: `{Rol}123!`

## 🤖 Nota sobre el uso de IA

### Alcance del uso de GitHub Copilot

Este proyecto fue desarrollado con la asistencia de **GitHub Copilot** para optimizar el desarrollo:

#### ✅ **Áreas donde se usó IA**:

1. **Diseño de UI/UX**:
   - Generación de componentes visuales con Tailwind CSS
   - Layouts responsive y estilos consistentes
   - Componentes de Radix UI y su integración
   - Estructura HTML/CSS de las Razor Pages

2. **Código trivial y repetitivo**:
   - Getters y setters
   - DTOs y mapeos simples
   - Validaciones básicas de formularios
   - Configuración de rutas y endpoints estándar
   - Código boilerplate de tests unitarios

3. **Documentación**:
   - Comentarios en el código
   - Este archivo README.md
   - Documentación de API con Swagger

4. **Refactoring y optimización**:
   - Sugerencias de nombres de variables y métodos
   - Mejoras de legibilidad del código
   - Detección de código duplicado


*el >80% del código presentado fue escrito por IA*

#### ❌ **Decisiones tomadas por el autor**:

1. **Decisiones de Arquitectura**:
   - Diseño comunicación entre servicios
   - Decisión de usar RabbitMQ para mensajería asíncrona
   - Implementación de la arquitectura event-driven
   - Estrategia de autenticación (Identity vs JWT)

2. **Diseño de Base de Datos**:
   - Modelado de entidades y relaciones
   - Definición de esquemas y tablas
   - Estrategia de migraciones
   - Optimización de consultas y índices

3. **Lógica de Negocio**:
   - Flujos de procesamiento de órdenes
   - Cálculos de inventario y stock
   - Lógica de autorización basada en roles

4. **Integración de Sistemas**:
   - Configuración e implementación de RabbitMQ
   - Publishers y Consumers de mensajes
   - Integración de SignalR para tiempo real
   - Configuración de Entity Framework y Sequelize

5. **Estrategia de Testing**:
   - Diseño de la estrategia de tests (unitarios, integración)
   - Selección de frameworks de testing
   - Casos de prueba críticos


## 📄 Licencia

Este proyecto fue desarrollado como parte del challenge técnico para The Flock.

## 👨‍💻 Autor

Pablo D. Clavijo
- GitHub: [@pablodclavijo](https://github.com/pablodclavijo)


