import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Users, Trash2, Shield, Mail, Settings as SettingsIcon, Plus, User, Send, CheckCircle } from "lucide-react";
import { formatDate } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  const [smtpForm, setSmtpForm] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_password: "",
    sender_name: "",
    sender_email: "",
    notify_email: "",
    is_active: true
  });

  const [smtpLoaded, setSmtpLoaded] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchSmtpSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmtpSettings = async () => {
    try {
      const response = await axios.get(`${API}/smtp`);
      if (response.data) {
        setSmtpForm({
          smtp_host: response.data.smtp_host || "",
          smtp_port: response.data.smtp_port?.toString() || "587",
          smtp_user: response.data.smtp_user || "",
          smtp_password: "",
          sender_name: response.data.sender_name || "",
          sender_email: response.data.sender_email || "",
          notify_email: response.data.notify_email || "",
          is_active: response.data.is_active ?? true
        });
        setSmtpLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching SMTP settings:", error);
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "user" });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Lutfen tum alanlari doldurun");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Sifre en az 6 karakter olmali");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/auth/register`, form);
      toast.success("Kullanici eklendi");
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kullanici eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user?.id) {
      toast.error("Kendinizi silemezsiniz");
      return;
    }
    if (!window.confirm("Bu kullaniciyi silmek istediginize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success("Kullanici silindi");
      fetchUsers();
    } catch (error) {
      toast.error("Silme islemi basarisiz");
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    if (!smtpForm.smtp_host || !smtpForm.smtp_user || !smtpForm.sender_name || !smtpForm.sender_email || !smtpForm.notify_email) {
      toast.error("Lutfen zorunlu alanlari doldurun");
      return;
    }
    if (!smtpLoaded && !smtpForm.smtp_password) {
      toast.error("Sifre giriniz");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...smtpForm,
        smtp_port: parseInt(smtpForm.smtp_port)
      };
      // Şifre boşsa ve daha önce kaydedilmişse, şifreyi göndermeden güncelle
      if (!data.smtp_password && smtpLoaded) {
        // Şifreyi yeniden girmesi gerekiyor
        toast.error("SMTP sifresini tekrar giriniz");
        setSaving(false);
        return;
      }
      await axios.post(`${API}/smtp`, data);
      toast.success("SMTP ayarlari kaydedildi");
      setSmtpLoaded(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kaydetme basarisiz");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    try {
      const response = await axios.post(`${API}/smtp/test`);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Test e-postasi gonderilemedi");
    } finally {
      setTesting(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await axios.post(`${API}/smtp/send-reminders`);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Hatirlaticilar gonderilemedi");
    } finally {
      setSendingReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Hesap ve sistem ayarlari</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profil</TabsTrigger>
          {user?.role === "admin" && (
            <>
              <TabsTrigger value="users" data-testid="tab-users">Kullanicilar</TabsTrigger>
              <TabsTrigger value="smtp" data-testid="tab-smtp">E-posta Ayarlari</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Hesap bilgilerinizi goruntuleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-1">
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role === "admin" ? "Yonetici" : "Kullanici"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <Input value={user?.name || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Input value={user?.role === "admin" ? "Yonetici" : "Kullanici"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Kayit Tarihi</Label>
                  <Input value={formatDate(user?.created_at)} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab (Admin Only) */}
        {user?.role === "admin" && (
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Kullanici Yonetimi
                  </CardTitle>
                  <CardDescription>Sistemdeki tum kullanicilari yonetin</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-user-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Kullanici Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Kullanici Ekle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ad Soyad *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ad Soyad"
                            className="pl-10"
                            data-testid="new-user-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>E-posta *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="ornek@email.com"
                            className="pl-10"
                            data-testid="new-user-email"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sifre * (min. 6 karakter)</Label>
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="********"
                          data-testid="new-user-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                          <SelectTrigger data-testid="new-user-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Kullanici</SelectItem>
                            <SelectItem value="admin">Yonetici</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Iptal</Button>
                        <Button type="submit" disabled={saving} data-testid="submit-new-user">
                          {saving ? "Ekleniyor..." : "Kullanici Ekle"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henuz kullanici yok</p>
                ) : (
                  <div className="data-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ad Soyad</TableHead>
                          <TableHead>E-posta</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Kayit Tarihi</TableHead>
                          <TableHead className="w-[80px]">Islem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={u.role === "admin" ? "badge-success" : ""}>
                                {u.role === "admin" ? "Yonetici" : "Kullanici"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(u.created_at)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === user?.id}
                                data-testid={`delete-user-${u.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* SMTP Settings Tab */}
        {user?.role === "admin" && (
          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  E-posta Bildirimleri (SMTP)
                </CardTitle>
                <CardDescription>
                  Odeme hatirlaticilari icin e-posta bildirim ayarlari
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSmtp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_host">SMTP Sunucu *</Label>
                      <Input
                        id="smtp_host"
                        value={smtpForm.smtp_host}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        data-testid="smtp-host"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">Port</Label>
                      <Input
                        id="smtp_port"
                        value={smtpForm.smtp_port}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })}
                        placeholder="587"
                        data-testid="smtp-port"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_user">SMTP Kullanici Adi *</Label>
                      <Input
                        id="smtp_user"
                        value={smtpForm.smtp_user}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })}
                        placeholder="your-email@gmail.com"
                        data-testid="smtp-user"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_pass">SMTP Sifre *</Label>
                      <Input
                        id="smtp_pass"
                        type="password"
                        value={smtpForm.smtp_password}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                        placeholder={smtpLoaded ? "********" : "Sifre giriniz"}
                        data-testid="smtp-pass"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Gonderici Bilgileri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sender_name">Gonderici Adi * (E-postalarda gorunecek)</Label>
                        <Input
                          id="sender_name"
                          value={smtpForm.sender_name}
                          onChange={(e) => setSmtpForm({ ...smtpForm, sender_name: e.target.value })}
                          placeholder="FinTres Pro"
                          data-testid="sender-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sender_email">Gonderici E-posta *</Label>
                        <Input
                          id="sender_email"
                          type="email"
                          value={smtpForm.sender_email}
                          onChange={(e) => setSmtpForm({ ...smtpForm, sender_email: e.target.value })}
                          placeholder="bildirim@sirket.com"
                          data-testid="sender-email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Bildirim Ayarlari</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="notify_email">Bildirimlerin Gidecegi E-posta *</Label>
                        <Input
                          id="notify_email"
                          type="email"
                          value={smtpForm.notify_email}
                          onChange={(e) => setSmtpForm({ ...smtpForm, notify_email: e.target.value })}
                          placeholder="admin@sirket.com"
                          data-testid="notify-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-posta Bildirimleri</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Switch
                            checked={smtpForm.is_active}
                            onCheckedChange={(v) => setSmtpForm({ ...smtpForm, is_active: v })}
                            data-testid="smtp-active"
                          />
                          <span className="text-sm text-muted-foreground">
                            {smtpForm.is_active ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <SettingsIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h4 className="font-medium">Gmail Kullaniyorsaniz</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Gmail hesabinizda 2 Adimli Dogrulama aktif olmali ve 
                          "Uygulama Sifresi" olusturmaniz gerekir. Normal sifrenizi kullanamazsiniz.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={saving} data-testid="smtp-save">
                      {saving ? "Kaydediliyor..." : "Ayarlari Kaydet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestSmtp}
                      disabled={testing || !smtpLoaded}
                      data-testid="smtp-test"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {testing ? "Gonderiliyor..." : "Test E-postasi Gonder"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendReminders}
                      disabled={sendingReminders || !smtpLoaded}
                      data-testid="send-reminders"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {sendingReminders ? "Gonderiliyor..." : "Hatirlaticilari Gonder"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
