import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";
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
import { Users, Trash2, Shield, Mail, Settings as SettingsIcon, Plus, User, Send, CheckCircle, Clock, Bell, Calendar, Phone, Building2 } from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
import { formatDate } from "../lib/utils";
import { PageHeader } from "../components/PageHeader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const { user } = useAuth();
  const { companies } = useCompany();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    company_ids: []
  });

  const [smtpForm, setSmtpForm] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_password: "",
    smtp_security: "starttls",
    sender_name: "",
    sender_email: "",
    notify_email: "",
    is_active: true
  });

  const [smtpLoaded, setSmtpLoaded] = useState(false);

  const [reminderForm, setReminderForm] = useState({
    days_before: 7,
    send_on_due_date: true,
    is_scheduler_active: true
  });
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchSmtpSettings();
      fetchReminderSettings();
      fetchSchedulerStatus();
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
          smtp_security: response.data.smtp_security || "starttls",
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

  const fetchReminderSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/reminders`);
      if (response.data) {
        setReminderForm({
          days_before: response.data.days_before ?? 7,
          send_on_due_date: response.data.send_on_due_date ?? true,
          is_scheduler_active: response.data.is_scheduler_active ?? true
        });
      }
    } catch (error) {
      console.error("Error fetching reminder settings:", error);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const response = await axios.get(`${API}/settings/scheduler-status`);
      setSchedulerStatus(response.data);
    } catch (error) {
      console.error("Error fetching scheduler status:", error);
    }
  };

  const handleSaveReminderSettings = async (e) => {
    e.preventDefault();
    setSavingReminder(true);
    try {
      await axios.post(`${API}/settings/reminders`, reminderForm);
      toast.success("Hatırlatma ayarları kaydedildi");
      fetchSchedulerStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kaydetme başarısız");
    } finally {
      setSavingReminder(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", role: "user", company_ids: [] });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Lütfen Ad Soyad ve E-posta alanlarını doldurun");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/auth/invite`, form);
      toast.success("Davet gönderildi! Kullanıcıya e-posta ile bilgilendirilecek.");
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Davet gönderilemedi");
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

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    if (!smtpForm.smtp_host || !smtpForm.smtp_user || !smtpForm.sender_name || !smtpForm.sender_email || !smtpForm.notify_email) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    if (!smtpLoaded && !smtpForm.smtp_password) {
      toast.error("Şifre giriniz");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...smtpForm,
        smtp_port: parseInt(smtpForm.smtp_port)
      };
      if (!data.smtp_password && smtpLoaded) {
        toast.error("SMTP şifresini tekrar giriniz");
        setSaving(false);
        return;
      }
      await axios.post(`${API}/smtp`, data);
      toast.success("SMTP ayarları kaydedildi");
      setSmtpLoaded(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kaydetme başarısız");
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
      toast.error(error.response?.data?.detail || "Test e-postası gönderilemedi");
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
      toast.error(error.response?.data?.detail || "Hatırlatıcılar gönderilemedi");
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
      <PageHeader
        title="Ayarlar"
        subtitle="Hesap ve sistem ayarları"
        icon={SettingsIcon}
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profil</TabsTrigger>
          {user?.role === "admin" && (
            <>
              <TabsTrigger value="users" data-testid="tab-users">Kullanıcılar</TabsTrigger>
              <TabsTrigger value="smtp" data-testid="tab-smtp">E-posta Ayarları</TabsTrigger>
              <TabsTrigger value="reminders" data-testid="tab-reminders">Hatırlatma Ayarları</TabsTrigger>
            </>
          )}
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
                      Kullanıcı Davet Et
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Kullanıcı Davet Et</DialogTitle>
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
                        <Label>Telefon</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="05XX XXX XX XX"
                            className="pl-10"
                            data-testid="new-user-phone"
                          />
                        </div>
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
                      {companies.length > 0 && (
                        <div className="space-y-2">
                          <Label>Erişebileceği Şirketler</Label>
                          <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                            {companies.map((c) => (
                              <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={form.company_ids.includes(c.id)}
                                  onCheckedChange={(checked) => {
                                    setForm(prev => ({
                                      ...prev,
                                      company_ids: checked
                                        ? [...prev.company_ids, c.id]
                                        : prev.company_ids.filter(id => id !== c.id)
                                    }));
                                  }}
                                  data-testid={`company-check-${c.id}`}
                                />
                                <span className="text-sm flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-muted-foreground" />
                                  {c.name}
                                </span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Boş bırakılırsa tüm şirketleri görebilir</p>
                        </div>
                      )}
                      <div className="bg-muted/50 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground">
                          Kullanıcıya davet e-postası gönderilecek. E-postadaki bağlantıya tıklayarak kendi şifresini oluşturacak.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button type="submit" disabled={saving} data-testid="submit-new-user">
                          <Mail className="w-4 h-4 mr-2" />
                          {saving ? "Gönderiliyor..." : "Davet Gönder"}
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
                          <TableHead>Telefon</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="w-[80px]">İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.phone || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={u.role === "admin" ? "badge-success" : ""}>
                                {u.role === "admin" ? "Yönetici" : "Kullanıcı"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.status === "pending" ? "secondary" : "outline"}>
                                {u.status === "pending" ? "Davet Bekliyor" : "Aktif"}
                              </Badge>
                            </TableCell>
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
                  Ödeme hatırlatıcıları için e-posta bildirim ayarları
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
                      <Label htmlFor="smtp_security">Güvenlik</Label>
                      <Select
                        value={smtpForm.smtp_security}
                        onValueChange={(v) => {
                          const port = v === "ssl" ? "465" : v === "starttls" ? "587" : "25";
                          setSmtpForm({ ...smtpForm, smtp_security: v, smtp_port: port });
                        }}
                      >
                        <SelectTrigger data-testid="smtp-security">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                          <SelectItem value="starttls">STARTTLS (Port 587)</SelectItem>
                          <SelectItem value="none">Yok (Port 25)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_user">SMTP Kullanıcı Adı *</Label>
                      <Input
                        id="smtp_user"
                        value={smtpForm.smtp_user}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })}
                        placeholder="your-email@gmail.com"
                        data-testid="smtp-user"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_pass">SMTP Şifre *</Label>
                      <Input
                        id="smtp_pass"
                        type="password"
                        value={smtpForm.smtp_password}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                        placeholder={smtpLoaded ? "********" : "Şifre giriniz"}
                        data-testid="smtp-pass"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Gönderici Bilgileri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sender_name">Gönderici Adı * (E-postalarda görünecek)</Label>
                        <Input
                          id="sender_name"
                          value={smtpForm.sender_name}
                          onChange={(e) => setSmtpForm({ ...smtpForm, sender_name: e.target.value })}
                          placeholder="FinTres Pro"
                          data-testid="sender-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sender_email">Gönderici E-posta *</Label>
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
                    <h4 className="font-medium mb-4">Bildirim Ayarları</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="notify_email">Bildirimlerin Gideceği E-posta *</Label>
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
                        <h4 className="font-medium">Gmail Kullanıyorsanız</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Gmail hesabınızda 2 Adımlı Doğrulama aktif olmalı ve 
                          &quot;Uygulama Şifresi&quot; oluşturmanız gerekir. Normal şifrenizi kullanamazsınız.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={saving} data-testid="smtp-save">
                      {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestSmtp}
                      disabled={testing || !smtpLoaded}
                      data-testid="smtp-test"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {testing ? "Gönderiliyor..." : "Test E-postası Gönder"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Reminder Settings Tab */}
        {user?.role === "admin" && (
          <TabsContent value="reminders">
            <div className="space-y-6">
              {/* Scheduler Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Zamanlayıcı Durumu
                  </CardTitle>
                  <CardDescription>
                    Otomatik hatırlatma e-postaları her gün saat 08:00'da (UTC+3 Türkiye) gönderilir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-muted-foreground">Durum</p>
                      <p className="text-lg font-semibold mt-1">
                        {schedulerStatus?.has_job ? (
                          <span className="text-green-500">Aktif</span>
                        ) : (
                          <span className="text-muted-foreground">Pasif</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-muted-foreground">Gönderim Saati</p>
                      <p className="text-lg font-semibold mt-1">08:00 (TR)</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-muted-foreground">Sonraki Çalışma</p>
                      <p className="text-lg font-semibold mt-1">
                        {schedulerStatus?.next_run || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reminder Config Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Hatırlatma Kuralları
                  </CardTitle>
                  <CardDescription>
                    Ödeme hatırlatıcılarının ne zaman gönderileceğini yapılandırın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveReminderSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="days_before">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Kaç gün önce hatırlatsın?
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="days_before"
                            type="number"
                            min={1}
                            max={30}
                            value={reminderForm.days_before}
                            onChange={(e) => setReminderForm({ ...reminderForm, days_before: parseInt(e.target.value) || 7 })}
                            className="w-24"
                            data-testid="days-before"
                          />
                          <span className="text-sm text-muted-foreground">gün önce</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ödeme vadesinden belirtilen gün sayısı kadar önce hatırlatma e-postası gönderilir
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Vade gününde hatırlatma</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Switch
                            checked={reminderForm.send_on_due_date}
                            onCheckedChange={(v) => setReminderForm({ ...reminderForm, send_on_due_date: v })}
                            data-testid="send-on-due-date"
                          />
                          <span className="text-sm text-muted-foreground">
                            {reminderForm.send_on_due_date ? "Aktif - Vade gününde de e-posta gönderilir" : "Pasif"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Label>Otomatik Zamanlayıcı</Label>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={reminderForm.is_scheduler_active}
                              onCheckedChange={(v) => setReminderForm({ ...reminderForm, is_scheduler_active: v })}
                              data-testid="scheduler-active"
                            />
                            <span className="text-sm text-muted-foreground">
                              {reminderForm.is_scheduler_active ? "Aktif - Her gün 08:00'da (Türkiye) otomatik kontrol" : "Pasif - Manuel gönderim"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-start gap-3">
                        <SettingsIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h4 className="font-medium">Nasıl Çalışır?</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Sistem her gün sabah 08:00'da (UTC+3) otomatik olarak ödeme hatırlatıcılarınızı kontrol eder.
                            Vadesi {reminderForm.days_before} gün içinde olan, bugün vadesi dolan ve vadesi geçmiş ödemeler
                            için e-posta bildirimi gönderir.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" disabled={savingReminder} data-testid="save-reminder-settings">
                        {savingReminder ? "Kaydediliyor..." : "Ayarları Kaydet"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendReminders}
                        disabled={sendingReminders || !smtpLoaded}
                        data-testid="send-reminders-manual"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendingReminders ? "Gönderiliyor..." : "Şimdi Manuel Gönder"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
