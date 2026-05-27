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
import { PageHeader } from "../components/PageHeader";
import { KpiCard } from "../components/KpiCard";
import { SortableHead } from "../components/SortableHead";
import { useTableSort } from "../hooks/useTableSort";
import { EmptyState } from "../components/EmptyState";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RemindersPage() {
  const { companies, selectedCompany } = useCompany();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [payDialog, setPayDialog] = useState(false);
  const [payingReminder, setPayingReminder] = useState(null);
  const [payForm, setPayForm] = useState({
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "banka_transferi"
  });
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

  const openPayDialog = (reminder) => {
    setPayingReminder(reminder);
    setPayForm({
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "banka_transferi"
    });
    setPayDialog(true);
  };

  const handleMarkPaid = async () => {
    if (!payingReminder) return;
    try {
      const response = await axios.put(`${API}/reminders/${payingReminder.id}/pay`, payForm);
      toast.success(response.data.message);
      setPayDialog(false);
      setPayingReminder(null);
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
    .filter(r => categoryFilter === "all" ? true : r.category === categoryFilter);

  const remindersSort = useTableSort(filteredReminders, {
    initialSort: { column: "due_date", direction: "asc" },
    getValue: (row, col) => {
      if (col === "company") return getCompanyName(row.company_id);
      if (col === "category") return getCategoryLabel(row.category);
      if (col === "status") return row.is_paid ? 2 : (new Date(row.due_date) < new Date() ? 0 : 1);
      return row[col];
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reminders-page">
      <PageHeader
        title="Ödeme Hatırlatıcıları"
        subtitle="Yaklaşan ödemeler ve takibi"
        icon={Bell}
        actions={
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
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Bekleyen Toplam" value={pendingTotal} icon={Clock} tone="warning" hint={`${pendingCount} hatırlatıcı (TRY)`} />
        <KpiCard label="Gecikmiş" value={overdueCount} icon={AlertCircle} tone="danger" format="number" hint="Vadesi geçen" />
        <KpiCard label="Ödendi" value={paidCount} icon={Check} tone="success" format="number" hint={`Toplam ${reminders.length} kayıt`} />
      </div>

      {/* Filters */}
      <div className="surface p-3 flex flex-wrap items-center gap-2">
        <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")} data-testid="filter-pending">Bekleyenler ({pendingCount})</Button>
        <Button variant={filter === "overdue" ? "default" : "outline"} size="sm" onClick={() => setFilter("overdue")} className={filter === "overdue" ? "" : "text-red-500 border-red-500/50"} data-testid="filter-overdue">Gecikmiş ({overdueCount})</Button>
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")} data-testid="filter-all">Tümü ({reminders.length})</Button>
        <div className="ml-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-8 text-sm" data-testid="filter-category">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {REMINDER_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredReminders.length === 0 ? (
        <EmptyState icon={Bell} title="Hatırlatıcı yok" description="Yeni hatırlatıcı ekleyerek başlayın." />
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="status" sort={remindersSort.sort} onSort={remindersSort.requestSort}>Durum</SortableHead>
                <SortableHead column="due_date" sort={remindersSort.sort} onSort={remindersSort.requestSort}>Vade Tarihi</SortableHead>
                <SortableHead column="company" sort={remindersSort.sort} onSort={remindersSort.requestSort}>Firma</SortableHead>
                <SortableHead column="title" sort={remindersSort.sort} onSort={remindersSort.requestSort}>Başlık</SortableHead>
                <SortableHead column="category" sort={remindersSort.sort} onSort={remindersSort.requestSort}>Kategori</SortableHead>
                <SortableHead column="amount" sort={remindersSort.sort} onSort={remindersSort.requestSort} align="right">Tutar</SortableHead>
                <TableHead className="w-[140px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remindersSort.sortedData.map((reminder) => {
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
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(reminder.due_date)}</TableCell>
                    <TableCell className="font-medium">{getCompanyName(reminder.company_id)}</TableCell>
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
                    <TableCell className="text-right font-semibold currency">
                      {formatCurrency(reminder.amount, reminder.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!reminder.is_paid && (
                          <Button variant="ghost" size="sm" onClick={() => openPayDialog(reminder)} title="Ödendi İşaretle" data-testid={`pay-reminder-${reminder.id}`}>
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

      {/* Ödeme Modalı */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Kaydı</DialogTitle>
          </DialogHeader>
          {payingReminder && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{payingReminder.title}</p>
                    <p className="text-sm text-muted-foreground">Vade: {formatDate(payingReminder.due_date)}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">{formatCurrency(payingReminder.amount, payingReminder.currency)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ödeme Tarihi *</Label>
                  <Input
                    type="date"
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                    data-testid="pay-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ödeme Türü *</Label>
                  <Select value={payForm.payment_method} onValueChange={(v) => setPayForm({ ...payForm, payment_method: v })}>
                    <SelectTrigger data-testid="pay-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nakit">Nakit</SelectItem>
                      <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                      <SelectItem value="banka_transferi">Banka Transferi</SelectItem>
                      <SelectItem value="havale">Havale/EFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Ödeme onaylandığında otomatik olarak gider kaydı oluşturulacaktır.
              </p>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPayDialog(false)}>İptal</Button>
                <Button onClick={handleMarkPaid} data-testid="confirm-pay">
                  <Check className="w-4 h-4 mr-2" />Ödendi Onayla
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
