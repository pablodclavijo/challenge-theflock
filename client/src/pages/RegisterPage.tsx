"use client";

import { useState } from "react";
import { ShoppingBag, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { ThemeToggle
  
 } from "@/components/ui/theme-toggle";
export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    shippingAddress: "",
  });

  const passwordChecks = [
    { label: "8+ caracteres", met: formData.password.length >= 8 },
    { label: "Mayusculas", met: /[A-Z]/.test(formData.password) },
    { label: "Numeros", met: /\d/.test(formData.password) },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setTimeout(() => setIsLoading(false), 1500);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              {"Ya tienes cuenta? "}
              <span className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">
                Inicia sesion
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-7 w-7 text-accent" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Crea tu cuenta
            </h1>
            <p className="text-muted-foreground text-sm">Unete y empieza a comprar hoy</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Nombre completo
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Juan Garcia"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full px-4 py-3.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-card transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Correo electronico
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-4 py-3.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-card transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
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
                {/* Password strength */}
                {formData.password && (
                  <div className="flex items-center gap-3 mt-3">
                    {passwordChecks.map((check) => (
                      <span
                        key={check.label}
                        className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                          check.met ? "text-accent" : "text-muted-foreground/50"
                        }`}
                      >
                        <Check className={`h-3 w-3 ${check.met ? "opacity-100" : "opacity-30"}`} />
                        {check.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Confirmar contrasena
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="w-full px-4 py-3.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-card transition-all"
                />
              </div>

              {/* Shipping */}
              <div>
                <label htmlFor="reg-address" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Direccion de envio <span className="normal-case font-normal text-muted-foreground/60">(opcional)</span>
                </label>
                <input
                  id="reg-address"
                  type="text"
                  placeholder="Calle Mayor 1, Madrid 28001"
                  value={formData.shippingAddress}
                  onChange={(e) => updateField("shippingAddress", e.target.value)}
                  className="w-full px-4 py-3.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-card transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3.5 px-4 rounded-xl transition-all text-sm mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground"></span>
                    Creando cuenta...
                  </span>
                ) : (
                  <>
                    Crear Cuenta
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-8">
              {"Al registrarte, aceptas nuestros "}
              <span className="text-foreground underline hover:text-accent transition-colors cursor-pointer">Terminos de Servicio</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
