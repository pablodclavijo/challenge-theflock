# Authentication & Server Integration Architecture

## Overview

This document describes the authentication system and API integration for the AdminPanel client. The system is built with TypeScript, React, and Axios, implementing JWT-based authentication against a Node.js API.

## Architecture

### Components

#### 1. **ApiClient** (`src/services/api.ts`)
A centralized HTTP client class that manages all API interactions.

**Features:**
- Singleton instance for consistent API calls
- Automatic JWT token injection in request headers
- Response interceptor for handling 401 (Unauthorized) errors
- Typed methods for all API endpoints
- Error handling with user-friendly messages

**Key Methods:**
```typescript
// Authentication
apiClient.login(loginData)
apiClient.register(registerData)

// Profile
apiClient.getUserProfile()
apiClient.updateUserProfile(profileData)

// Products
apiClient.getProducts(params)
apiClient.getProductById(id)

// Cart
apiClient.getCart()
apiClient.addToCart(productId, quantity)
apiClient.updateCartItem(productId, quantity)
apiClient.removeFromCart(productId)

// Orders
apiClient.createOrder(shippingAddress)
apiClient.getOrders(params)
apiClient.getOrderById(id)
apiClient.processPayment(orderId)
```

#### 2. **Token Management** (`src/utils/auth.ts`)
Utilities for JWT token persistence and validation.

**Features:**
- Store/retrieve tokens from localStorage
- Token expiration checking
- Token decoding (for inspection only)
- Clear all auth data on logout

**Key Functions:**
```typescript
tokenUtils.setToken(token)        // Store JWT
tokenUtils.getToken()              // Retrieve JWT
tokenUtils.hasToken()              // Check if token exists
tokenUtils.removeToken()           // Clear token
tokenUtils.isTokenExpired(token)   // Validate expiration
tokenUtils.clearAuth()             // Clear all auth data
```

#### 3. **useAuth Hook** (`src/hooks/useAuth.ts`)
React hook for managing authentication state and operations.

**Features:**
- Manages user state and loading state
- Handles login/register/logout flows
- Profile update functionality
- Token validation on mount
- Persistent state via localStorage

**Usage:**
```typescript
const { user, isAuthenticated, isLoading, login, register, logout, updateProfile } = useAuth();

// Login
await login(email, password);

// Register
await register({ email, password, fullName, shippingAddress });

// Logout
logout();

// Update profile
await updateProfile({ fullName, shippingAddress });
```

#### 4. **AuthContext** (`src/contexts/AuthContext.tsx`)
React Context for providing auth state to all components.

**Features:**
- Wraps the entire app with authentication state
- Prevents prop drilling
- Provides useAuthContext hook for accessing auth state

**Usage:**
```typescript
<AuthProvider>
  <App />
</AuthProvider>

// Inside any component:
const { user, isAuthenticated, login } = useAuthContext();
```

#### 5. **useProtectedRoute Hook** (`src/hooks/useProtectedRoute.ts`)
Hook for protecting routes from unauthorized access.

**Features:**
- Automatic redirection for unauthenticated users
- Configurable redirect destination
- Callbacks for handling unauthorized access

**Usage:**
```typescript
const ProtectedComponent = () => {
  const { isAuthenticated, isLoading } = useProtectedRoute({
    redirectTo: '/login'
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>Protected content</div>;
};
```

## Authentication Flow

### 1. Registration
```
User enters email, password, name, shipping address
       ↓
useAuth.register() → ApiClient.register()
       ↓
API returns { accessToken, user }
       ↓
tokenUtils stores token and user in localStorage
       ↓
Auth state updated, user redirected to dashboard
```

### 2. Login
```
User enters email, password
       ↓
useAuth.login() → ApiClient.login()
       ↓
API returns { accessToken, user }
       ↓
tokenUtils stores token and user in localStorage
       ↓
Auth state updated, user redirected to dashboard
```

### 3. Protected Requests
```
Component calls apiClient method
       ↓
Request interceptor adds bearer token from localStorage
       ↓
API validates token
       ↓
If valid: returns data
If invalid (401): response interceptor clears auth and redirects to login
```

### 4. Logout
```
User clicks logout
       ↓
useAuth.logout()
       ↓
tokenUtils.clearAuth() removes token and user from localStorage
       ↓
Auth state cleared, user redirected to login
```

## Type Definitions

All TypeScript types are in `src/types/auth.ts`:

```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  shippingAddress: string | null;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  shippingAddress?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}
```

## Integration with App

### 1. Wrap App with AuthProvider
```typescript
// main.tsx
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### 2. Use in Components
```typescript
import { useAuthContext } from '@/hooks';

function MyComponent() {
  const { user, isAuthenticated, login } = useAuthContext();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.fullName}</div>;
}
```

### 3. Protect Routes
```typescript
function CartPage() {
  const { isAuthenticated } = useProtectedRoute();

  if (!isAuthenticated) {
    return null; // Redirected by hook
  }

  return <div>Your Cart</div>;
}
```

## Error Handling

### API Errors
All ApiClient methods throw errors with descriptive messages. Handle them in components:

```typescript
try {
  await login(email, password);
} catch (error) {
  console.error('Login failed:', error);
  setErrorMessage(error as string);
}
```

### Token Expiration
The response interceptor automatically:
- Detects 401 responses
- Clears authentication
- Redirects to login page

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage. Consider using httpOnly cookies for production.
2. **Token Validation**: Token expiration is checked client-side, but the server should also validate.
3. **CORS**: Ensure the API server allows requests from this domain.
4. **HTTPS**: Use HTTPS in production to prevent token interception.

## Examples

### Login Flow
```typescript
const LoginPage = () => {
  const { login, isLoading } = useAuthContext();
  const [error, setError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Navigation handled by app routing
    } catch (err) {
      setError(err as string);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      );
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

### Using Auth State
```typescript
const Header = () => {
  const { user, isAuthenticated, logout } = useAuthContext();

  return (
    <header>
      {isAuthenticated && user ? (
        <>
          <span>Welcome, {user.fullName}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  );
};
```

### Fetching Data with Auth
```typescript
const ProductList = () => {
  const { isAuthenticated } = useAuthContext();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.getProducts({ limit: 20 })
        .then(setProducts)
        .catch(error => console.error('Failed to fetch:', error));
    }
  }, [isAuthenticated]);

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
};
```

## Next Steps

1. Set up routing (e.g., with React Router)
2. Create login and register pages
3. Create protected page layouts
4. Integrate cart management using the API
5. Implement order checkout flow
