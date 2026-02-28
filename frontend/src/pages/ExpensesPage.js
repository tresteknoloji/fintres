import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
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
import { Plus, Pencil, Trash2, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate, CURRENCIES, EXPENSE_CATEGORIES, PAYMENT_TYPES } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ExpensesPage() {
  const { companies, selectedCompany } = useCompany();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
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

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || "-";
  };

  const getCategoryLabel = (value) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === value);
    return cat?.label || value;
  };

  const getPaymentLabel = (value) => {
    const pt = PAYMENT_TYPES.find(p => p.value === value);
    return pt?.label || value;
  };

  const totalExpense = expenses.reduce((sum, e) => sum + (e.currency === "TRY" ? e.amount : 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="expenses-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giderler</h1>
          <p className="text-muted-foreground mt-1">Gider kayıtları ve takibi</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Toplam Gider (TRY)</p>
            <p className="text-xl font-bold currency text-red-500">{formatCurrency(totalExpense)}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
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
                    <SelectTrigger data-testid="expense-company-select">
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
                  <Label>Açıklama *</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Gider açıklaması"
                    data-testid="expense-description"
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
                      data-testid="expense-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger data-testid="expense-currency">
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
                    <Label>Kategori *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger data-testid="expense-category">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ödeme Şekli *</Label>
                    <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
                      <SelectTrigger data-testid="expense-payment-type">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TYPES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tarih *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    data-testid="expense-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Ek notlar (opsiyonel)"
                    data-testid="expense-notes"
                  />
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
        </div>
      </div>

      {/* Table */}
      {expenses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Henüz gider kaydı yok</h3>
            <p className="text-muted-foreground mt-1">Yeni gider ekleyerek başlayın</p>
          </CardContent>
        </Card>
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Ödeme</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>{getCompanyName(expense.company_id)}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                  <TableCell>{getPaymentLabel(expense.payment_type)}</TableCell>
                  <TableCell className="text-right font-medium currency text-red-500">
                    {formatCurrency(expense.amount, expense.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(expense)} data-testid={`edit-expense-${expense.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(expense)} data-testid={`delete-expense-${expense.id}`}>
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
