import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Calculator
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";

const navigation = [
  { name: "Özet", href: "/", icon: LayoutDashboard },
  { name: "Firmalar", href: "/companies", icon: Building2 },
  { name: "Gelirler", href: "/incomes", icon: TrendingUp },
  { name: "Giderler", href: "/expenses", icon: TrendingDown },
  { name: "Personel", href: "/personnel", icon: Users },
  { name: "Hatırlatıcılar", href: "/reminders", icon: Bell },
  { name: "Nakit Akışı", href: "/budget", icon: Calculator },
  { name: "Raporlar", href: "/reports", icon: BarChart3 },
  { name: "Ayarlar", href: "/settings", icon: Settings }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { companies, selectedCompany, selectCompany } = useCompany();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card/95 backdrop-blur-xl flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">FinTrack Pro</span>
          </div>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Switcher */}
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-muted/50 border-border hover:bg-muted"
                data-testid="company-switcher"
              >
                <span className="truncate text-sm">
                  {selectedCompany?.name || "Firma Seçin"}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem
                onClick={() => selectCompany(null)}
                data-testid="company-all"
              >
                <span className="flex-1">Tüm Firmalar</span>
                {!selectedCompany && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => selectCompany(company)}
                  data-testid={`company-${company.id}`}
                >
                  <span className="flex-1 truncate">{company.name}</span>
                  {selectedCompany?.id === company.id && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "sidebar-link",
                  isActive && "active"
                )
              }
              data-testid={`nav-${item.name.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
          <button
            className="lg:hidden mr-4 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-button"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            {selectedCompany && (
              <div className="company-badge">
                <Building2 className="w-3 h-3" />
                {selectedCompany.name}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="mr-2"
            data-testid="theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
