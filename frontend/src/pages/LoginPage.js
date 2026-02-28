import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { BarChart3, Lock, Mail, User, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success("Giriş başarılı!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    setLoading(true);
    try {
      await register(registerForm.email, registerForm.password, registerForm.name);
      toast.success("Kayıt başarılı!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4"
        data-testid="login-theme-toggle"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>

      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg animate-pulse-glow">
            <BarChart3 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FinTrack Pro</h1>
          <p className="text-muted-foreground mt-2">Çoklu Firma Finans Yönetimi</p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-xl">
          <Tabs defaultValue="login">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab">Giriş Yap</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Kayıt Ol</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Form */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
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
                        className="pl-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        data-testid="login-password"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                    data-testid="login-submit"
                  >
                    {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Ad Soyad</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Ad Soyad"
                        className="pl-10"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        data-testid="register-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-10"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        data-testid="register-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        data-testid="register-password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Şifre Tekrar</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        data-testid="register-confirm"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                    data-testid="register-submit"
                  >
                    {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Tres Teknoloji A.Ş. & Netlen İnternet Hizmetleri Ltd. Şti.
        </p>
      </div>
    </div>
  );
}
