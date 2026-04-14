import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { toast } from "sonner";
import { BarChart3, Lock, CheckCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [inviteInfo, setInviteInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Geçersiz davet bağlantısı");
      setLoading(false);
      return;
    }
    fetchInviteInfo();
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/invite-info?token=${token}`);
      setInviteInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Geçersiz veya süresi dolmuş davet bağlantısı");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/auth/set-password`, { token, password });
      setSuccess(true);
      toast.success("Şifreniz oluşturuldu!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="set-password-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <BarChart3 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FinTres Pro</h1>
        </div>

        {error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button className="mt-4" onClick={() => navigate("/login")} data-testid="go-login">
                Giriş Sayfasına Dön
              </Button>
            </CardContent>
          </Card>
        ) : success ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold">Şifreniz Oluşturuldu</h2>
              <p className="text-muted-foreground">Artık giriş yapabilirsiniz.</p>
              <Button className="w-full" onClick={() => navigate("/login")} data-testid="go-login-success">
                Giriş Yap
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Şifre Oluştur</CardTitle>
              <CardDescription>
                Merhaba <strong>{inviteInfo?.name}</strong>, hesabınız için bir şifre belirleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input value={inviteInfo?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre * (min. 6 karakter)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifrenizi girin"
                      className="pl-10"
                      data-testid="set-password-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Şifre Tekrar *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Şifrenizi tekrar girin"
                      className="pl-10"
                      data-testid="set-password-confirm"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saving} data-testid="set-password-submit">
                  {saving ? "Oluşturuluyor..." : "Şifremi Oluştur"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
