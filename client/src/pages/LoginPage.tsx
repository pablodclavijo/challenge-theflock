"use client";

import { useState } from "react";
import { ShoppingBag, ArrowRight, Eye, EyeOff, ShoppingCart } from "lucide-react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCart = searchParams.get("from") === "cart";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Por favor completá tu correo y contraseña.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate(fromCart ? "/" : "/dashboard", { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const serverMsg = axiosErr?.response?.data?.message;
      if (axiosErr?.response?.status === 401 || axiosErr?.response?.status === 400) {
        setError(serverMsg ?? "Correo o contraseña incorrectos.");
      } else {
        setError(serverMsg ?? "Error al iniciar sesión. Intentalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <span className="font-serif text-xl font-bold text-foreground tracking-tight">ShopNow</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {"No tienes cuenta? "}
            <Link to="/register" className="font-semibold text-foreground hover:text-accent transition-colors">
              Registrate
            </Link>
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              {fromCart ? (
                <ShoppingCart className="h-7 w-7 text-accent" />
              ) : (
                <ShoppingBag className="h-7 w-7 text-accent" />
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              {fromCart ? "Un paso más" : "Bienvenido de nuevo"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {fromCart
                ? "Inicia sesión para finalizar tu compra. Tu carrito está guardado."
                : "Ingresa a tu cuenta para continuar comprando"}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            {/* Error alert */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Correo electronico
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-card transition-all"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-card transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <span className="text-xs text-accent font-medium hover:underline cursor-pointer">
                  Olvidaste tu contrasena?
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3.5 px-4 rounded-xl transition-all text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground"></span>
                    Iniciando sesion...
                  </span>
                ) : (
                  <>
                    Iniciar Sesion
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                {"Nuevo usuario? "}
                <Link to="/register" className="font-semibold text-foreground hover:text-accent transition-colors">
                  Crear una cuenta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
