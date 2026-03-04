import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './contexts/AuthContext';
import { LoginPage, RegisterPage, DashboardPage, ProductListPage, ProductDetailPage, CheckoutPage, OrdersPage, OrderDetailPage, NosotrosPage } from './pages';
import { MainLayout } from './components';

function App() {
  const { isAuthenticated } = useAuthContext();

  return (
    <Routes>
      {/* Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/orders" element={isAuthenticated ? <OrdersPage /> : <Navigate to="/login" replace />} />
        <Route path="/orders/:id" element={isAuthenticated ? <OrderDetailPage /> : <Navigate to="/login" replace />} />
        <Route path="/nosotros" element={<NosotrosPage />} />
      </Route>

      {/* Routes without layout */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/checkout" element={isAuthenticated ? <CheckoutPage /> : <Navigate to="/login?from=checkout" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
