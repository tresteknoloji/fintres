import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import { Plus, Pencil, Trash2, Users, Wallet, UserX, Banknote, Check, Filter, Eye } from "lucide-react";
import { formatCurrency, formatDate, CURRENCIES } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PERSONNEL_STATUS = [
  { value: "active", label: "Aktif", className: "badge-success" },
  { value: "inactive", label: "Pasif", className: "badge-warning" },
  { value: "terminated", label: "İşten Ayrıldı", className: "badge-danger" }
];

export default function PersonnelPage() {
  const { companies, selectedCompany } = useCompany();
  const [personnel, setPersonnel] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    company_id: "",
    name: "",
    position: "",
    email: "",
    phone: "",
    salary: "",
    currency: "TRY",
    start_date: new Date().toISOString().split("T")[0],
    status: "active"
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

  const [advanceForm, setAdvanceForm] = useState({
    personnel_id: "",
    company_id: "",
    amount: "",
    currency: "TRY",
    date: new Date().toISOString().split("T")[0],
    reason: ""
  });

  const [terminateForm, setTerminateForm] = useState({
    end_date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    fetchPersonnel();
    fetchAdvances();
    fetchSalaries();
  }, [selectedCompany, statusFilter]);

  const fetchPersonnel = async () => {
    try {
      const params = {};
      if (selectedCompany) params.company_id = selectedCompany.id;
      if (statusFilter !== "all") params.status = statusFilter;
      const response = await axios.get(`${API}/personnel`, { params });
      setPersonnel(response.data);
    } catch (error) {
      toast.error("Personel listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvances = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/advances`, { params });
      setAdvances(response.data);
    } catch (error) {
      console.error("Error fetching advances:", error);
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
      start_date: new Date().toISOString().split("T")[0],
      status: "active"
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
      start_date: person.start_date.split("T")[0],
      status: person.status || "active"
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

  const openAdvanceDialog = (person) => {
    setSelectedPersonnel(person);
    setAdvanceForm({
      personnel_id: person.id,
      company_id: person.company_id,
      amount: "",
      currency: person.currency,
      date: new Date().toISOString().split("T")[0],
      reason: ""
    });
    setAdvanceDialogOpen(true);
  };

  const openTerminateDialog = (person) => {
    setSelectedPersonnel(person);
    setTerminateForm({ end_date: new Date().toISOString().split("T")[0] });
    setTerminateDialogOpen(true);
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

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!advanceForm.amount) {
      toast.error("Lütfen tutar girin");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/advances`, {
        ...advanceForm,
        amount: parseFloat(advanceForm.amount),
        is_paid_back: false
      });
      toast.success("Avans kaydedildi");
      setAdvanceDialogOpen(false);
      fetchAdvances();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/personnel/${selectedPersonnel.id}/terminate?end_date=${terminateForm.end_date}`);
      toast.success("Personel işten ayrıldı olarak işaretlendi");
      setTerminateDialogOpen(false);
      fetchPersonnel();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleAdvancePayback = async (advance) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await axios.put(`${API}/advances/${advance.id}/payback?paid_back_date=${today}`);
      toast.success("Avans geri ödendi olarak işaretlendi");
      fetchAdvances();
    } catch (error) {
      toast.error("İşlem başarısız");
    }
  };

  const handleDeleteAdvance = async (advance) => {
    if (!window.confirm("Bu avans kaydını silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/advances/${advance.id}`);
      toast.success("Avans silindi");
      fetchAdvances();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
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

  const getPersonnelName = (personnelId) => {
    const person = personnel.find(p => p.id === personnelId);
    return person?.name || "-";
  };

  const getStatusInfo = (status) => {
    return PERSONNEL_STATUS.find(s => s.value === status) || PERSONNEL_STATUS[0];
  };

  const totalSalary = personnel
    .filter(p => (p.status || "active") === "active")
    .reduce((sum, p) => sum + (p.currency === "TRY" ? p.salary : 0), 0);

  const totalPendingAdvances = advances
    .filter(a => !a.is_paid_back)
    .reduce((sum, a) => sum + (a.currency === "TRY" ? a.amount : 0), 0);

  const filteredPersonnel = statusFilter === "all" 
    ? personnel 
    : personnel.filter(p => (p.status || "active") === statusFilter);

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
          <p className="text-muted-foreground mt-1">Personel, maaş ve avans yönetimi</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Aktif Maaş Toplamı</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İşe Başlama Tarihi *</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      data-testid="personnel-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger data-testid="personnel-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSONNEL_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

      {/* Tabs */}
      <Tabs defaultValue="personnel" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personnel" data-testid="tab-personnel">Personel Listesi</TabsTrigger>
          <TabsTrigger value="advances" data-testid="tab-advances">Avanslar</TabsTrigger>
          <TabsTrigger value="salaries" data-testid="tab-salaries">Maaş Ödemeleri</TabsTrigger>
        </TabsList>

        {/* Personnel Tab */}
        <TabsContent value="personnel" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="status-filter">
                  <SelectValue placeholder="Durum Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {PERSONNEL_STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredPersonnel.length} personel gösteriliyor
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

          {/* Advance Dialog */}
          <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Avans Ver - {selectedPersonnel?.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdvanceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tutar *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={advanceForm.amount}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="advance-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={advanceForm.currency} onValueChange={(v) => setAdvanceForm({ ...advanceForm, currency: v })}>
                      <SelectTrigger data-testid="advance-currency">
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
                  <Label>Tarih *</Label>
                  <Input
                    type="date"
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    data-testid="advance-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    value={advanceForm.reason}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                    placeholder="Avans nedeni (opsiyonel)"
                    data-testid="advance-reason"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAdvanceDialogOpen(false)}>İptal</Button>
                  <Button type="submit" disabled={saving} data-testid="advance-submit">
                    {saving ? "Kaydediliyor..." : "Avans Ver"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Terminate Dialog */}
          <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>İşten Çıkar - {selectedPersonnel?.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTerminate} className="space-y-4">
                <div className="space-y-2">
                  <Label>İşten Ayrılma Tarihi *</Label>
                  <Input
                    type="date"
                    value={terminateForm.end_date}
                    onChange={(e) => setTerminateForm({ end_date: e.target.value })}
                    data-testid="terminate-date"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setTerminateDialogOpen(false)}>İptal</Button>
                  <Button type="submit" variant="destructive" disabled={saving} data-testid="terminate-submit">
                    {saving ? "İşleniyor..." : "İşten Çıkar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Table */}
          {filteredPersonnel.length === 0 ? (
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
                    <TableHead>Durum</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Pozisyon</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead className="text-right">Maaş</TableHead>
                    <TableHead>Başlangıç</TableHead>
                    <TableHead className="w-[180px]">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.map((person) => {
                    const statusInfo = getStatusInfo(person.status || "active");
                    const personAdvances = advances.filter(a => a.personnel_id === person.id && !a.is_paid_back);
                    const totalAdvance = personAdvances.reduce((sum, a) => sum + a.amount, 0);
                    
                    return (
                      <TableRow key={person.id} data-testid={`personnel-row-${person.id}`}>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {person.name}
                          {totalAdvance > 0 && (
                            <Badge variant="outline" className="ml-2 badge-warning text-xs">
                              Avans: {formatCurrency(totalAdvance, person.currency)}
                            </Badge>
                          )}
                        </TableCell>
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
                        <TableCell>
                          {formatDate(person.start_date)}
                          {person.end_date && (
                            <p className="text-xs text-muted-foreground">
                              Ayrılış: {formatDate(person.end_date)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(person.status || "active") === "active" && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => openSalaryDialog(person)} title="Maaş Öde" data-testid={`pay-salary-${person.id}`}>
                                  <Wallet className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openAdvanceDialog(person)} title="Avans Ver" data-testid={`give-advance-${person.id}`}>
                                  <Banknote className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openTerminateDialog(person)} title="İşten Çıkar" data-testid={`terminate-${person.id}`}>
                                  <UserX className="w-4 h-4 text-orange-500" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(person)} data-testid={`edit-personnel-${person.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(person)} data-testid={`delete-personnel-${person.id}`}>
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
        </TabsContent>

        {/* Advances Tab */}
        <TabsContent value="advances" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Bekleyen Avans Toplamı</p>
              <p className="text-xl font-bold currency text-orange-500">{formatCurrency(totalPendingAdvances)}</p>
            </div>
          </div>

          {advances.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz avans kaydı yok</h3>
                <p className="text-muted-foreground mt-1">Personel listesinden avans verebilirsiniz</p>
              </CardContent>
            </Card>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Personel</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="w-[100px]">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((advance) => (
                    <TableRow key={advance.id} data-testid={`advance-row-${advance.id}`}>
                      <TableCell>
                        <Badge variant="outline" className={advance.is_paid_back ? "badge-success" : "badge-warning"}>
                          {advance.is_paid_back ? "Geri Ödendi" : "Bekliyor"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(advance.date)}</TableCell>
                      <TableCell className="font-medium">{getPersonnelName(advance.personnel_id)}</TableCell>
                      <TableCell>{getCompanyName(advance.company_id)}</TableCell>
                      <TableCell>{advance.reason || "-"}</TableCell>
                      <TableCell className="text-right font-medium currency">
                        {formatCurrency(advance.amount, advance.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!advance.is_paid_back && (
                            <Button variant="ghost" size="sm" onClick={() => handleAdvancePayback(advance)} title="Geri Ödendi" data-testid={`payback-advance-${advance.id}`}>
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAdvance(advance)} data-testid={`delete-advance-${advance.id}`}>
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
        </TabsContent>

        {/* Salaries Tab */}
        <TabsContent value="salaries" className="space-y-4">
          {salaries.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz maaş ödemesi yok</h3>
                <p className="text-muted-foreground mt-1">Personel listesinden maaş ödemesi yapabilirsiniz</p>
              </CardContent>
            </Card>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Ödeme Tarihi</TableHead>
                    <TableHead>Personel</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Notlar</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary) => (
                    <TableRow key={salary.id} data-testid={`salary-row-${salary.id}`}>
                      <TableCell className="font-medium">{salary.period}</TableCell>
                      <TableCell>{formatDate(salary.payment_date)}</TableCell>
                      <TableCell>{getPersonnelName(salary.personnel_id)}</TableCell>
                      <TableCell>{getCompanyName(salary.company_id)}</TableCell>
                      <TableCell>{salary.notes || "-"}</TableCell>
                      <TableCell className="text-right font-medium currency">
                        {formatCurrency(salary.amount, salary.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
