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
import { Plus, Pencil, Trash2, TrendingUp, Hash, Calendar } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  isWithinRange,
  CURRENCIES,
  INCOME_CATEGORIES
} from "../lib/utils";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector, defaultPeriodValue } from "../components/PeriodSelector";
import { KpiCard } from "../components/KpiCard";
import { SortableHead } from "../components/SortableHead";
import { useTableSort } from "../hooks/useTableSort";
import { EmptyState } from "../components/EmptyState";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function IncomesPage() {
  const { companies, selectedCompany } = useCompany();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState(() => defaultPeriodValue("this_month"));
  const [form, setForm] = useState({
    company_id: "",
    description: "",
    amount: "",
    currency: "TRY",
    category: "",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  useEffect(() => {
    fetchIncomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchIncomes = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/incomes`, { params });
      setIncomes(response.data);
    } catch (error) {
      toast.error("Gelirler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || "-";
  };

  const getCategoryLabel = (value) => {
    return INCOME_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  /* Filter by period */
  const filteredIncomes = useMemo(
    () => incomes.filter((i) => isWithinRange(i.date, period.startDate, period.endDate)),
    [incomes, period]
  );

  /* Sort */
  const { sortedData, sort, requestSort } = useTableSort(filteredIncomes, {
    initialSort: { column: "date", direction: "desc" },
    getValue: (row, col) => {
      if (col === "company") return getCompanyName(row.company_id);
      if (col === "category") return getCategoryLabel(row.category);
      return row[col];
    }
  });

  /* KPIs from filtered data */
  const totalIncome = useMemo(
    () => filteredIncomes.reduce((s, i) => s + (i.currency === "TRY" ? Number(i.amount) || 0 : 0), 0),
    [filteredIncomes]
  );
  const avgIncome = filteredIncomes.length > 0 ? totalIncome / filteredIncomes.length : 0;

  const resetForm = () => {
    setForm({
      company_id: selectedCompany?.id || "",
      description: "",
      amount: "",
      currency: "TRY",
      category: "",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    });
    setEditingIncome(null);
  };

  const openEditDialog = (income) => {
    setEditingIncome(income);
    setForm({
      company_id: income.company_id,
      description: income.description,
      amount: income.amount.toString(),
      currency: income.currency,
      category: income.category,
      date: income.date.split("T")[0],
      notes: income.notes || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.description || !form.amount || !form.category) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (editingIncome) {
        await axios.put(`${API}/incomes/${editingIncome.id}`, data);
        toast.success("Gelir güncellendi");
      } else {
        await axios.post(`${API}/incomes`, data);
        toast.success("Gelir eklendi");
      }
      setDialogOpen(false);
      resetForm();
      fetchIncomes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (income) => {
    if (!window.confirm("Bu geliri silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/incomes/${income.id}`);
      toast.success("Gelir silindi");
      fetchIncomes();
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
    <div className="space-y-6" data-testid="incomes-page">
      <PageHeader
        title="Gelirler"
        subtitle="Gelir kayıtları ve takibi"
        icon={TrendingUp}
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-income-btn" onClick={() => setForm(f => ({ ...f, company_id: selectedCompany?.id || "" }))}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Gelir
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingIncome ? "Gelir Düzenle" : "Yeni Gelir Ekle"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Firma *</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger data-testid="income-company-select"><SelectValue placeholder="Firma seçin" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Açıklama *</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Gelir açıklaması" data-testid="income-description" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tutar *</Label>
                    <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" data-testid="income-amount" />
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger data-testid="income-currency"><SelectValue /></SelectTrigger>
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
                      <SelectTrigger data-testid="income-category"><SelectValue placeholder="Seçin" /></SelectTrigger>
                      <SelectContent>
                        {INCOME_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tarih *</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="income-date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ek notlar (opsiyonel)" data-testid="income-notes" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button type="submit" disabled={saving} data-testid="income-submit">
                    {saving ? "Kaydediliyor..." : editingIncome ? "Güncelle" : "Ekle"}
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
        <KpiCard label="Toplam Gelir" value={totalIncome} icon={TrendingUp} tone="success" hint="Seçili dönem (TRY)" />
        <KpiCard label="Kayıt Sayısı" value={filteredIncomes.length} icon={Hash} tone="info" format="number" hint="Seçili dönem" />
        <KpiCard label="Ortalama Tutar" value={avgIncome} icon={Calendar} tone="primary" hint="Kayıt başına ortalama" />
      </div>

      {/* Table */}
      {filteredIncomes.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Bu dönemde gelir kaydı yok"
          description={incomes.length === 0 ? "Yeni gelir ekleyerek başlayın." : "Farklı bir dönem seçebilir ya da yeni gelir ekleyebilirsiniz."}
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
                <SortableHead column="amount" sort={sort} onSort={requestSort} align="right">Tutar</SortableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((income) => (
                <TableRow key={income.id} data-testid={`income-row-${income.id}`}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(income.date)}</TableCell>
                  <TableCell className="font-medium">{getCompanyName(income.company_id)}</TableCell>
                  <TableCell>{income.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="badge-info font-normal">
                      {getCategoryLabel(income.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold currency text-tone-success">
                    {formatCurrency(income.amount, income.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(income)} data-testid={`edit-income-${income.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(income)} data-testid={`delete-income-${income.id}`}>
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
