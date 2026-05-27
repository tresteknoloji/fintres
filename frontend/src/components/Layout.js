import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
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
  Calculator,
  Landmark
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";

const navigation = [
  { name: "Özet", href: "/", icon: LayoutDashboard, group: "main" },
  { name: "Firmalar", href: "/companies", icon: Building2, group: "main" },
  { name: "Gelirler", href: "/incomes", icon: TrendingUp, group: "finance" },
  { name: "Giderler", href: "/expenses", icon: TrendingDown, group: "finance" },
  { name: "Personel", href: "/personnel", icon: Users, group: "finance" },
  { name: "Banka & Kartlar", href: "/bank-cards", icon: Landmark, group: "finance" },
  { name: "Hatırlatıcılar", href: "/reminders", icon: Bell, group: "planning" },
  { name: "Nakit Akışı", href: "/budget", icon: Calculator, group: "planning" },
  { name: "Raporlar", href: "/reports", icon: BarChart3, group: "planning" },
  { name: "Ayarlar", href: "/settings", icon: Settings, group: "system" }
];

const groupLabels = {
  main: "Genel",
  finance: "Finans",
  planning: "Planlama",
  system: "Sistem"
};

const pageTitles = {
  "/": "Özet",
  "/companies": "Firmalar",
  "/incomes": "Gelirler",
  "/expenses": "Giderler",
  "/personnel": "Personel",
  "/bank-cards": "Banka & Kartlar",
  "/reminders": "Hatırlatıcılar",
  "/budget": "Nakit Akışı",
  "/reports": "Raporlar",
  "/settings": "Ayarlar"
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { companies, selectedCompany, selectCompany } = useCompany();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Build grouped navigation
  const groupedNav = navigation.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const currentPage = pageTitles[location.pathname] || "";

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
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-elevation-sm">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight">FinTres</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Pro</span>
            </div>
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
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Aktif Firma</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-10 bg-muted/30 border-border hover:bg-muted/60"
                data-testid="company-switcher"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">
                    {selectedCompany?.name || "Tüm Firmalar"}
                  </span>
                </span>
                <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Firma seç</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => selectCompany(null)}
                data-testid="company-all"
                className="gap-2"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">Tüm Firmalar</span>
                {!selectedCompany && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => selectCompany(company)}
                  data-testid={`company-${company.id}`}
                  className="gap-2"
                >
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{company.name}</span>
                  {selectedCompany?.id === company.id && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {Object.entries(groupedNav).map(([groupKey, items], idx) => (
            <div key={groupKey} className={cn(idx > 0 && "mt-5")}>
              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                {groupLabels[groupKey]}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/"}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn("sidebar-link", isActive && "active")
                    }
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" side="top">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                <Settings className="w-4 h-4" />
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive" data-testid="logout-button">
                <LogOut className="w-4 h-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 lg:px-8 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <button
            className="lg:hidden mr-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-button"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground hidden md:inline">FinTres Pro</span>
              <span className="text-muted-foreground/50 hidden md:inline">/</span>
              <span className="font-medium truncate">{currentPage}</span>
            </div>
            {selectedCompany && (
              <div className="company-badge hidden sm:inline-flex">
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
            className="h-9 w-9"
            data-testid="theme-toggle"
            title={theme === "dark" ? "Açık tema" : "Koyu tema"}
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </Button>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-8 max-w-[1600px] mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
