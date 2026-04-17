import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Bell, Check, AlertCircle, Clock } from "lucide-react";
import { formatCurrency, formatDate, CURRENCIES, REMINDER_CATEGORIES } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RemindersPage() {
  const { companies, selectedCompany } = useCompany();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("pending"); // "pending", "overdue", "all"
  const [form, setForm] = useState({
    company_id: "",
    title: "",
    description: "",
    amount: "",
    currency: "TRY",
    due_date: "",
    category: "",
    is_recurring: false,
    recurring_period: ""
  });

  useEffect(() => {
    fetchReminders();
  }, [selectedCompany]);

  const fetchReminders = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/reminders`, { params });
      setReminders(response.data);
    } catch (error) {
      toast.error("Hatırlatıcılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      company_id: selectedCompany?.id || "",
      title: "",
      description: "",
      amount: "",
      currency: "TRY",
      due_date: "",
      category: "",
      is_recurring: false,
      recurring_period: ""
    });
    setEditingReminder(null);
  };

  const openEditDialog = (reminder) => {
    setEditingReminder(reminder);
    setForm({
      company_id: reminder.company_id,
      title: reminder.title,
      description: reminder.description || "",
      amount: reminder.amount.toString(),
      currency: reminder.currency,
      due_date: reminder.due_date.split("T")[0],
      category: reminder.category,
      is_recurring: reminder.is_recurring,
      recurring_period: reminder.recurring_period || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.title || !form.amount || !form.due_date || !form.category) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (editingReminder) {
        await axios.put(`${API}/reminders/${editingReminder.id}`, data);
        toast.success("Hatırlatıcı güncellendi");
      } else {
        await axios.post(`${API}/reminders`, data);
        toast.success("Hatırlatıcı eklendi");
      }
      setDialogOpen(false);
      resetForm();
      fetchReminders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (reminder) => {
    try {
      const response = await axios.put(`${API}/reminders/${reminder.id}/pay`);
      toast.success(response.data.message);
      fetchReminders();
    } catch (error) {
      toast.error("İşlem başarısız");
    }
  };

  const handleDelete = async (reminder) => {
    if (!window.confirm("Bu hatırlatıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/reminders/${reminder.id}`);
      toast.success("Hatırlatıcı silindi");
      fetchReminders();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || "-";
  };

  const getCategoryLabel = (value) => {
    const cat = REMINDER_CATEGORIES.find(c => c.value === value);
    return cat?.label || value;
  };

  const getDueDateStatus = (dueDate, isPaid) => {
    if (isPaid) return { status: "paid", label: "Ödendi", className: "badge-success" };
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: "overdue", label: "Gecikmiş", className: "badge-danger" };
    if (diffDays <= 7) return { status: "soon", label: `${diffDays} gün`, className: "badge-warning" };
    return { status: "upcoming", label: `${diffDays} gün`, className: "bg-muted text-muted-foreground" };
  };

  const pendingTotal = reminders
    .filter(r => !r.is_paid)
    .reduce((sum, r) => sum + (r.currency === "TRY" ? r.amount : 0), 0);

  const overdueCount = reminders.filter(r => {
    if (r.is_paid) return false;
    return new Date(r.due_date) < new Date();
  }).length;
  const pendingCount = reminders.filter(r => !r.is_paid).length;
  const paidCount = reminders.filter(r => r.is_paid).length;

  const filteredReminders = reminders
    .filter(r => {
      if (filter === "pending") return !r.is_paid;
      if (filter === "overdue") return !r.is_paid && new Date(r.due_date) < new Date();
      return true;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reminders-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ödeme Hatırlatıcıları</h1>
          <p className="text-muted-foreground mt-1">Yaklaşan ödemeler ve takibi</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Bekleyen Toplam (TRY)</p>
            <p className="text-xl font-bold currency text-yellow-500">{formatCurrency(pendingTotal)}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-reminder-btn" onClick={() => setForm(f => ({ ...f, company_id: selectedCompany?.id || "" }))}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Hatırlatıcı
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingReminder ? "Hatırlatıcı Düzenle" : "Yeni Hatırlatıcı Ekle"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Firma *</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger data-testid="reminder-company-select">
                      <SelectValue placeholder="Firma seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Başlık *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ödeme başlığı"
                    data-testid="reminder-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Ödeme detayları (opsiyonel)"
                    data-testid="reminder-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tutar *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="reminder-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger data-testid="reminder-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vade Tarihi *</Label>
                    <Input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                      data-testid="reminder-due-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger data-testid="reminder-category">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="recurring">Tekrarlayan Ödeme</Label>
                  <Switch
                    id="recurring"
                    checked={form.is_recurring}
                    onCheckedChange={(v) => setForm({ ...form, is_recurring: v })}
                    data-testid="reminder-recurring"
                  />
                </div>
                {form.is_recurring && (
                  <div className="space-y-2">
                    <Label>Tekrar Periyodu</Label>
                    <Select value={form.recurring_period} onValueChange={(v) => setForm({ ...form, recurring_period: v })}>
                      <SelectTrigger data-testid="reminder-recurring-period">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Haftalık</SelectItem>
                        <SelectItem value="monthly">Aylık</SelectItem>
                        <SelectItem value="quarterly">3 Aylık</SelectItem>
                        <SelectItem value="yearly">Yıllık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button type="submit" disabled={saving} data-testid="reminder-submit">
                    {saving ? "Kaydediliyor..." : editingReminder ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
          data-testid="filter-pending"
        >
          Bekleyenler ({pendingCount})
        </Button>
        <Button
          variant={filter === "overdue" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("overdue")}
          className={filter === "overdue" ? "" : "text-red-500 border-red-500/50"}
          data-testid="filter-overdue"
        >
          Gecikmiş ({overdueCount})
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          data-testid="filter-all"
        >
          Tümü ({reminders.length})
        </Button>
      </div>

      {filteredReminders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Henüz hatırlatıcı yok</h3>
            <p className="text-muted-foreground mt-1">Yeni hatırlatıcı ekleyerek başlayın</p>
          </CardContent>
        </Card>
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Durum</TableHead>
                <TableHead>Vade Tarihi</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-[140px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReminders.map((reminder) => {
                const dueDateStatus = getDueDateStatus(reminder.due_date, reminder.is_paid);
                return (
                  <TableRow key={reminder.id} data-testid={`reminder-row-${reminder.id}`}>
                    <TableCell>
                      <Badge variant="outline" className={dueDateStatus.className}>
                        {dueDateStatus.status === "paid" && <Check className="w-3 h-3 mr-1" />}
                        {dueDateStatus.status === "overdue" && <AlertCircle className="w-3 h-3 mr-1" />}
                        {dueDateStatus.status === "soon" && <Clock className="w-3 h-3 mr-1" />}
                        {dueDateStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(reminder.due_date)}</TableCell>
                    <TableCell>{getCompanyName(reminder.company_id)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        {reminder.description && <p className="text-sm text-muted-foreground">{reminder.description}</p>}
                        {reminder.is_recurring && (
                          <Badge variant="outline" className="mt-1 text-xs">Tekrarlayan</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryLabel(reminder.category)}</TableCell>
                    <TableCell className="text-right font-medium currency">
                      {formatCurrency(reminder.amount, reminder.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!reminder.is_paid && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(reminder)} title="Ödendi İşaretle" data-testid={`pay-reminder-${reminder.id}`}>
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(reminder)} data-testid={`edit-reminder-${reminder.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(reminder)} data-testid={`delete-reminder-${reminder.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
