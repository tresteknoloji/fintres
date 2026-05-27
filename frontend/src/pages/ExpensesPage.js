import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingDown, Hash, Calendar } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  isWithinRange,
  CURRENCIES,
  EXPENSE_CATEGORIES,
  PAYMENT_TYPES
} from "../lib/utils";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector, defaultPeriodValue } from "../components/PeriodSelector";
import { KpiCard } from "../components/KpiCard";
import { SortableHead } from "../components/SortableHead";
import { useTableSort } from "../hooks/useTableSort";
import { EmptyState } from "../components/EmptyState";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ExpensesPage() {
  const { companies, selectedCompany } = useCompany();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState(() => defaultPeriodValue("this_month"));
  const [form, setForm] = useState({
    company_id: "",
    description: "",
    amount: "",
    currency: "TRY",
    category: "",
    payment_type: "",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchExpenses = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/expenses`, { params });
      setExpenses(response.data);
    } catch (error) {
      toast.error("Giderler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId) => companies.find((c) => c.id === companyId)?.name || "-";
  const getCategoryLabel = (value) => EXPENSE_CATEGORIES.find((c) => c.value === value)?.label || value;
  const getPaymentLabel = (value) => PAYMENT_TYPES.find((p) => p.value === value)?.label || value;

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isWithinRange(e.date, period.startDate, period.endDate)),
    [expenses, period]
  );

  const { sortedData, sort, requestSort } = useTableSort(filteredExpenses, {
    initialSort: { column: "date", direction: "desc" },
    getValue: (row, col) => {
      if (col === "company") return getCompanyName(row.company_id);
      if (col === "category") return getCategoryLabel(row.category);
      if (col === "payment_type") return getPaymentLabel(row.payment_type);
      return row[col];
    }
  });

  const totalExpense = useMemo(
    () => filteredExpenses.reduce((s, e) => s + (e.currency === "TRY" ? Number(e.amount) || 0 : 0), 0),
    [filteredExpenses]
  );
  const avgExpense = filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0;

  const resetForm = () => {
    setForm({
      company_id: selectedCompany?.id || "",
      description: "",
      amount: "",
      currency: "TRY",
      category: "",
      payment_type: "",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    });
    setEditingExpense(null);
  };

  const openEditDialog = (expense) => {
    setEditingExpense(expense);
    setForm({
      company_id: expense.company_id,
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency,
      category: expense.category,
      payment_type: expense.payment_type,
      date: expense.date.split("T")[0],
      notes: expense.notes || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.description || !form.amount || !form.category || !form.payment_type) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (editingExpense) {
        await axios.put(`${API}/expenses/${editingExpense.id}`, data);
        toast.success("Gider güncellendi");
      } else {
        await axios.post(`${API}/expenses`, data);
        toast.success("Gider eklendi");
      }
      setDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm("Bu gideri silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/expenses/${expense.id}`);
      toast.success("Gider silindi");
      fetchExpenses();
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
    <div className="space-y-6" data-testid="expenses-page">
      <PageHeader
        title="Giderler"
        subtitle="Gider kayıtları ve takibi"
        icon={TrendingDown}
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-expense-btn" onClick={() => setForm(f => ({ ...f, company_id: selectedCompany?.id || "" }))}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Gider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Gider Düzenle" : "Yeni Gider Ekle"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Firma *</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger data-testid="expense-company-select"><SelectValue placeholder="Firma seçin" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Açıklama *</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Gider açıklaması" data-testid="expense-description" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tutar *</Label>
                    <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" data-testid="expense-amount" />
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger data-testid="expense-currency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger data-testid="expense-category"><SelectValue placeholder="Seçin" /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ödeme Şekli *</Label>
                    <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
                      <SelectTrigger data-testid="expense-payment-type"><SelectValue placeholder="Seçin" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tarih *</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="expense-date" />
                </div>
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ek notlar (opsiyonel)" data-testid="expense-notes" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button type="submit" disabled={saving} data-testid="expense-submit">
                    {saving ? "Kaydediliyor..." : editingExpense ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Period Selector */}
      <div className="surface p-3 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground shrink-0 pl-1">Dönem</span>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="Toplam Gider" value={totalExpense} icon={TrendingDown} tone="danger" hint="Seçili dönem (TRY)" />
        <KpiCard label="Kayıt Sayısı" value={filteredExpenses.length} icon={Hash} tone="info" format="number" hint="Seçili dönem" />
        <KpiCard label="Ortalama Tutar" value={avgExpense} icon={Calendar} tone="warning" hint="Kayıt başına ortalama" />
      </div>

      {/* Table */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="Bu dönemde gider kaydı yok"
          description={expenses.length === 0 ? "Yeni gider ekleyerek başlayın." : "Farklı bir dönem seçebilir ya da yeni gider ekleyebilirsiniz."}
        />
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="date" sort={sort} onSort={requestSort}>Tarih</SortableHead>
                <SortableHead column="company" sort={sort} onSort={requestSort}>Firma</SortableHead>
                <SortableHead column="description" sort={sort} onSort={requestSort}>Açıklama</SortableHead>
                <SortableHead column="category" sort={sort} onSort={requestSort}>Kategori</SortableHead>
                <SortableHead column="payment_type" sort={sort} onSort={requestSort}>Ödeme</SortableHead>
                <SortableHead column="amount" sort={sort} onSort={requestSort} align="right">Tutar</SortableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((expense) => (
                <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(expense.date)}</TableCell>
                  <TableCell className="font-medium">{getCompanyName(expense.company_id)}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="badge-warning font-normal">
                      {getCategoryLabel(expense.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{getPaymentLabel(expense.payment_type)}</TableCell>
                  <TableCell className="text-right font-semibold currency text-tone-danger">
                    {formatCurrency(expense.amount, expense.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(expense)} data-testid={`edit-expense-${expense.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(expense)} data-testid={`delete-expense-${expense.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
