import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
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
import { Users, Trash2, Shield, Mail, Settings as SettingsIcon, Plus, User } from "lucide-react";
import { formatDate } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
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

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "user" });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/auth/register`, form);
      toast.success("Kullanıcı eklendi");
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kullanıcı eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user?.id) {
      toast.error("Kendinizi silemezsiniz");
      return;
    }
    if (!window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success("Kullanıcı silindi");
      fetchUsers();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
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
        <p className="text-muted-foreground mt-1">Hesap ve sistem ayarları</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profil</TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="users" data-testid="tab-users">Kullanıcılar</TabsTrigger>
          )}
          <TabsTrigger value="smtp" data-testid="tab-smtp">E-posta Ayarları</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Hesap bilgilerinizi görüntüleyin</CardDescription>
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
                    {user?.role === "admin" ? "Yönetici" : "Kullanıcı"}
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
                  <Input value={user?.role === "admin" ? "Yönetici" : "Kullanıcı"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Kayıt Tarihi</Label>
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
                    Kullanıcı Yönetimi
                  </CardTitle>
                  <CardDescription>Sistemdeki tüm kullanıcıları yönetin</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-user-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Kullanıcı Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
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
                        <Label>Şifre * (min. 6 karakter)</Label>
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="••••••••"
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
                            <SelectItem value="user">Kullanıcı</SelectItem>
                            <SelectItem value="admin">Yönetici</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button type="submit" disabled={saving} data-testid="submit-new-user">
                          {saving ? "Ekleniyor..." : "Kullanıcı Ekle"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz kullanıcı yok</p>
                ) : (
                  <div className="data-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ad Soyad</TableHead>
                          <TableHead>E-posta</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Kayıt Tarihi</TableHead>
                          <TableHead className="w-[80px]">İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={u.role === "admin" ? "badge-success" : ""}>
                                {u.role === "admin" ? "Yönetici" : "Kullanıcı"}
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
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                E-posta Bildirimleri (SMTP)
              </CardTitle>
              <CardDescription>
                Ödeme hatırlatıcıları için e-posta bildirim ayarları. Bu özellik yakında aktif edilecek.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Sunucu</Label>
                  <Input id="smtp_host" placeholder="smtp.gmail.com" disabled data-testid="smtp-host" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input id="smtp_port" placeholder="587" disabled data-testid="smtp-port" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">Kullanıcı Adı</Label>
                  <Input id="smtp_user" placeholder="your-email@gmail.com" disabled data-testid="smtp-user" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_pass">Şifre</Label>
                  <Input id="smtp_pass" type="password" placeholder="••••••••" disabled data-testid="smtp-pass" />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <SettingsIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">SMTP Yapılandırması</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      E-posta bildirimleri için SMTP ayarlarını yapılandırabilirsiniz. 
                      Gmail kullanıyorsanız, "Uygulama Şifresi" oluşturmanız gerekebilir.
                      Bu özellik bir sonraki güncellemede aktif edilecektir.
                    </p>
                  </div>
                </div>
              </div>

              <Button disabled data-testid="smtp-save">
                Ayarları Kaydet (Yakında)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
