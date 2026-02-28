import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
import { Plus, Pencil, Trash2, Users, Wallet } from "lucide-react";
import { formatCurrency, formatDate, CURRENCIES } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PersonnelPage() {
  const { companies, selectedCompany } = useCompany();
  const [personnel, setPersonnel] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_id: "",
    name: "",
    position: "",
    email: "",
    phone: "",
    salary: "",
    currency: "TRY",
    start_date: new Date().toISOString().split("T")[0]
  });

  const [salaryForm, setSalaryForm] = useState({
    personnel_id: "",
    company_id: "",
    amount: "",
    currency: "TRY",
    period: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  useEffect(() => {
    fetchPersonnel();
    fetchSalaries();
  }, [selectedCompany]);

  const fetchPersonnel = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/personnel`, { params });
      setPersonnel(response.data);
    } catch (error) {
      toast.error("Personel listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaries = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/salaries`, { params });
      setSalaries(response.data);
    } catch (error) {
      console.error("Error fetching salaries:", error);
    }
  };

  const resetForm = () => {
    setForm({
      company_id: selectedCompany?.id || "",
      name: "",
      position: "",
      email: "",
      phone: "",
      salary: "",
      currency: "TRY",
      start_date: new Date().toISOString().split("T")[0]
    });
    setEditingPersonnel(null);
  };

  const openEditDialog = (person) => {
    setEditingPersonnel(person);
    setForm({
      company_id: person.company_id,
      name: person.name,
      position: person.position,
      email: person.email || "",
      phone: person.phone || "",
      salary: person.salary.toString(),
      currency: person.currency,
      start_date: person.start_date.split("T")[0]
    });
    setDialogOpen(true);
  };

  const openSalaryDialog = (person) => {
    setSelectedPersonnel(person);
    setSalaryForm({
      personnel_id: person.id,
      company_id: person.company_id,
      amount: person.salary.toString(),
      currency: person.currency,
      period: new Date().toISOString().slice(0, 7),
      payment_date: new Date().toISOString().split("T")[0],
      notes: ""
    });
    setSalaryDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.name || !form.position || !form.salary) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, salary: parseFloat(form.salary) };
      if (editingPersonnel) {
        await axios.put(`${API}/personnel/${editingPersonnel.id}`, data);
        toast.success("Personel güncellendi");
      } else {
        await axios.post(`${API}/personnel`, data);
        toast.success("Personel eklendi");
      }
      setDialogOpen(false);
      resetForm();
      fetchPersonnel();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    if (!salaryForm.amount || !salaryForm.period) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/salaries`, {
        ...salaryForm,
        amount: parseFloat(salaryForm.amount)
      });
      toast.success("Maaş ödemesi kaydedildi");
      setSalaryDialogOpen(false);
      fetchSalaries();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (person) => {
    if (!window.confirm(`${person.name} personelini silmek istediğinize emin misiniz?`)) return;
    try {
      await axios.delete(`${API}/personnel/${person.id}`);
      toast.success("Personel silindi");
      fetchPersonnel();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || "-";
  };

  const totalSalary = personnel.reduce((sum, p) => sum + (p.currency === "TRY" ? p.salary : 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="personnel-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personel</h1>
          <p className="text-muted-foreground mt-1">Personel ve maaş yönetimi</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Toplam Maaş (TRY)</p>
            <p className="text-xl font-bold currency">{formatCurrency(totalSalary)}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-personnel-btn" onClick={() => setForm(f => ({ ...f, company_id: selectedCompany?.id || "" }))}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Personel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPersonnel ? "Personel Düzenle" : "Yeni Personel Ekle"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Firma *</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger data-testid="personnel-company-select">
                      <SelectValue placeholder="Firma seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ad Soyad *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ad Soyad"
                      data-testid="personnel-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pozisyon *</Label>
                    <Input
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      placeholder="Pozisyon"
                      data-testid="personnel-position"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="E-posta"
                      data-testid="personnel-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Telefon"
                      data-testid="personnel-phone"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maaş *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      placeholder="0.00"
                      data-testid="personnel-salary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger data-testid="personnel-currency">
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
                <div className="space-y-2">
                  <Label>İşe Başlama Tarihi *</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    data-testid="personnel-start-date"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button type="submit" disabled={saving} data-testid="personnel-submit">
                    {saving ? "Kaydediliyor..." : editingPersonnel ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Salary Payment Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Maaş Ödemesi - {selectedPersonnel?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalarySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tutar *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryForm.amount}
                  onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                  placeholder="0.00"
                  data-testid="salary-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={salaryForm.currency} onValueChange={(v) => setSalaryForm({ ...salaryForm, currency: v })}>
                  <SelectTrigger data-testid="salary-currency">
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
                <Label>Dönem (Ay) *</Label>
                <Input
                  type="month"
                  value={salaryForm.period}
                  onChange={(e) => setSalaryForm({ ...salaryForm, period: e.target.value })}
                  data-testid="salary-period"
                />
              </div>
              <div className="space-y-2">
                <Label>Ödeme Tarihi *</Label>
                <Input
                  type="date"
                  value={salaryForm.payment_date}
                  onChange={(e) => setSalaryForm({ ...salaryForm, payment_date: e.target.value })}
                  data-testid="salary-payment-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Input
                value={salaryForm.notes}
                onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                placeholder="Ek notlar (opsiyonel)"
                data-testid="salary-notes"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSalaryDialogOpen(false)}>İptal</Button>
              <Button type="submit" disabled={saving} data-testid="salary-submit">
                {saving ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table */}
      {personnel.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Henüz personel kaydı yok</h3>
            <p className="text-muted-foreground mt-1">Yeni personel ekleyerek başlayın</p>
          </CardContent>
        </Card>
      ) : (
        <div className="data-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Pozisyon</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead className="text-right">Maaş</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead className="w-[140px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personnel.map((person) => (
                <TableRow key={person.id} data-testid={`personnel-row-${person.id}`}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{getCompanyName(person.company_id)}</TableCell>
                  <TableCell>{person.position}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {person.email && <p>{person.email}</p>}
                      {person.phone && <p className="text-muted-foreground">{person.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium currency">
                    {formatCurrency(person.salary, person.currency)}
                  </TableCell>
                  <TableCell>{formatDate(person.start_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openSalaryDialog(person)} title="Maaş Öde" data-testid={`pay-salary-${person.id}`}>
                        <Wallet className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)} data-testid={`edit-personnel-${person.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(person)} data-testid={`delete-personnel-${person.id}`}>
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
