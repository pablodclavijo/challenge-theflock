import { Link, Outlet } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";
import { ThemeToggle } from "./ui/theme-toggle";
import { CartSheet } from "./ui/CartSheet";

export function MainLayout() {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <span className="font-serif text-xl font-bold text-foreground tracking-tight">ShopNow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/#productos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Productos
              </Link>
              <Link to="/nosotros" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Nosotros
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <CartSheet />
              {user && (
                <Link to="/dashboard">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">
                    {user?.fullName?.charAt(0) ?? "U"}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
