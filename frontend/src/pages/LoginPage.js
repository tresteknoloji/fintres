import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { BarChart3, Lock, Mail, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Giriş başarılı!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10"
        data-testid="login-theme-toggle"
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      <div className="w-full max-w-md animate-fadeIn relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center mb-4 shadow-elevation-lg">
            <BarChart3 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FinTres Pro</h1>
          <p className="text-sm text-muted-foreground mt-1">Çoklu Firma Finans Yönetimi</p>
        </div>

        <Card className="border-border bg-card/90 backdrop-blur-xl shadow-elevation-lg">
          <CardHeader>
            <CardTitle>Giriş Yap</CardTitle>
            <CardDescription>Hesabınıza giriş yapın</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ornek@email.com"
                    className="pl-10 h-11"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    data-testid="login-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    data-testid="login-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Tres Teknoloji A.Ş. & Netlen İnternet Hizmetleri Ltd. Şti.
        </p>
      </div>
    </div>
  );
}
