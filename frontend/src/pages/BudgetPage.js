import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
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
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Receipt,
  Home,
  CreditCard,
  Car,
  Utensils,
  Zap,
  Briefcase,
  Building
} from "lucide-react";
import { formatCurrency, CURRENCIES } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EXPENSE_CATEGORIES = [
  { value: "kira", label: "Kira", icon: Home },
  { value: "fatura", label: "Faturalar (Elektrik/Su/Doğalgaz)", icon: Zap },
  { value: "maas", label: "Maaşlar", icon: Briefcase },
  { value: "kredi", label: "Kredi Taksitleri", icon: Building },
  { value: "kredi_karti", label: "Kredi Kartı", icon: CreditCard },
  { value: "yakit", label: "Yakıt/Ulaşım", icon: Car },
  { value: "yemek", label: "Yemek/İaşe", icon: Utensils },
  { value: "sigorta", label: "Sigorta", icon: Receipt },
  { value: "vergi", label: "Vergi", icon: Receipt },
  { value: "reklam", label: "Reklam & Pazarlama", icon: Receipt },
  { value: "veri_merkezi", label: "Veri Merkezi", icon: Building },
  { value: "diger", label: "Diğer", icon: Receipt }
];

const INCOME_CATEGORIES = [
  { value: "satis", label: "Satış Geliri", icon: TrendingUp },
  { value: "hizmet", label: "Hizmet Geliri", icon: Briefcase },
  { value: "kira_geliri", label: "Kira Geliri", icon: Home },
  { value: "faiz", label: "Faiz Geliri", icon: PiggyBank },
  { value: "diger", label: "Diğer", icon: Wallet }
];

const FREQUENCIES = [
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" }
];

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

export default function BudgetPage() {
  const { companies, selectedCompany } = useCompany();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [form, setForm] = useState({
    company_id: "",
    name: "",
    amount: "",
    currency: "TRY",
    category: "",
    item_type: "expense",
    frequency: "monthly",
    is_active: true,
    notes: ""
  });

  useEffect(() => {
    fetchSummary();
  }, [selectedCompany]);

  const fetchSummary = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/budget/summary`, { params });
      setSummary(response.data);
    } catch (error) {
      toast.error("Bütçe verileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      company_id: selectedCompany?.id || "",
      name: "",
      amount: "",
      currency: "TRY",
      category: "",
      item_type: "expense",
      frequency: "monthly",
      is_active: true,
      notes: ""
    });
    setEditingItem(null);
  };

  const openAddDialog = (type) => {
    resetForm();
    setForm(f => ({ ...f, company_id: selectedCompany?.id || "", item_type: type }));
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setForm({
      company_id: item.company_id,
      name: item.name,
      amount: item.amount.toString(),
      currency: item.currency,
      category: item.category,
      item_type: item.item_type,
      frequency: item.frequency,
      is_active: item.is_active,
      notes: item.notes || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.name || !form.amount || !form.category) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (editingItem) {
        await axios.put(`${API}/recurring/${editingItem.id}`, data);
        toast.success("Kayıt güncellendi");
      } else {
        await axios.post(`${API}/recurring`, data);
        toast.success("Kayıt eklendi");
      }
      setDialogOpen(false);
      resetForm();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.name}" kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      await axios.delete(`${API}/recurring/${item.id}`);
      toast.success("Kayıt silindi");
      fetchSummary();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const toggleActive = async (item) => {
    try {
      await axios.put(`${API}/recurring/${item.id}`, {
        ...item,
        is_active: !item.is_active
      });
      fetchSummary();
    } catch (error) {
      toast.error("Güncelleme başarısız");
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || "-";
  };

  const getCategoryLabel = (category, type) => {
    const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const cat = cats.find(c => c.value === category);
    return cat?.label || category;
  };

  const getCategoryIcon = (category, type) => {
    const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const cat = cats.find(c => c.value === category);
    return cat?.icon || Receipt;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const incomeItems = summary?.items?.filter(i => i.item_type === "income") || [];
  const expenseItems = summary?.items?.filter(i => i.item_type === "expense") || [];
  const isProfit = (summary?.monthly_net || 0) >= 0;

  // Prepare chart data
  const comparisonData = [
    { name: "Aylık", gelir: summary?.monthly_income || 0, gider: summary?.monthly_expense || 0 },
    { name: "Yıllık", gelir: summary?.yearly_income || 0, gider: summary?.yearly_expense || 0 }
  ];

  return (
    <div className="space-y-6" data-testid="budget-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nakit Akışı / Bütçe</h1>
          <p className="text-muted-foreground mt-1">Düzenli gelir ve giderlerinizi planlayın</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card" data-testid="monthly-income-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Gelir</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency text-green-500">
              {formatCurrency(summary?.monthly_income || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Yıllık: {formatCurrency(summary?.yearly_income || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="monthly-expense-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Gider</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency text-red-500">
              {formatCurrency(summary?.monthly_expense || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Yıllık: {formatCurrency(summary?.yearly_expense || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className={`stat-card border-2 ${isProfit ? "border-green-500/50" : "border-red-500/50"}`} data-testid="monthly-net-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Net</CardTitle>
            <div className={`p-2 rounded-lg ${isProfit ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {isProfit ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold currency ${isProfit ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(summary?.monthly_net || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isProfit ? "Kar" : "Zarar"} - Yıllık: {formatCurrency(summary?.yearly_net || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="profit-margin-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kar Marjı</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <PiggyBank className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? "text-green-500" : "text-red-500"}`}>
              {summary?.monthly_income > 0 
                ? `${((summary.monthly_net / summary.monthly_income) * 100).toFixed(1)}%`
                : "0%"
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gelire oranla
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Giderler ({expenseItems.length})</TabsTrigger>
          <TabsTrigger value="incomes" data-testid="tab-incomes">Gelirler ({incomeItems.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparison Chart */}
            <Card data-testid="comparison-chart">
              <CardHeader>
                <CardTitle>Gelir / Gider Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(value) => [formatCurrency(value), ""]}
                      />
                      <Legend />
                      <Bar dataKey="gelir" name="Gelir" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Distribution */}
            <Card data-testid="expense-distribution">
              <CardHeader>
                <CardTitle>Gider Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {summary?.expense_by_category?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.expense_by_category}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {summary.expense_by_category.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value, name) => [formatCurrency(value), getCategoryLabel(name, "expense")]}
                        />
                        <Legend formatter={(value) => getCategoryLabel(value, "expense")} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Henüz gider kaydı yok
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Summary Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Expenses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">En Yüksek Giderler</CardTitle>
                <Button size="sm" onClick={() => openAddDialog("expense")} data-testid="add-expense-quick">
                  <Plus className="w-4 h-4 mr-1" /> Gider Ekle
                </Button>
              </CardHeader>
              <CardContent>
                {expenseItems.filter(i => i.is_active).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Henüz gider kaydı yok</p>
                ) : (
                  <div className="space-y-3">
                    {expenseItems
                      .filter(i => i.is_active)
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 5)
                      .map((item) => {
                        const Icon = getCategoryIcon(item.category, "expense");
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-red-500/10">
                                <Icon className="w-4 h-4 text-red-500" />
                              </div>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{getCategoryLabel(item.category, "expense")}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold currency text-red-500">{formatCurrency(item.amount, item.currency)}</p>
                              <p className="text-xs text-muted-foreground">{item.frequency === "monthly" ? "/ay" : "/yıl"}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income Sources */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Gelir Kaynakları</CardTitle>
                <Button size="sm" onClick={() => openAddDialog("income")} data-testid="add-income-quick">
                  <Plus className="w-4 h-4 mr-1" /> Gelir Ekle
                </Button>
              </CardHeader>
              <CardContent>
                {incomeItems.filter(i => i.is_active).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Henüz gelir kaydı yok</p>
                ) : (
                  <div className="space-y-3">
                    {incomeItems
                      .filter(i => i.is_active)
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 5)
                      .map((item) => {
                        const Icon = getCategoryIcon(item.category, "income");
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <Icon className="w-4 h-4 text-green-500" />
                              </div>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{getCategoryLabel(item.category, "income")}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold currency text-green-500">{formatCurrency(item.amount, item.currency)}</p>
                              <p className="text-xs text-muted-foreground">{item.frequency === "monthly" ? "/ay" : "/yıl"}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {expenseItems.filter(i => !i.is_active).length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {expenseItems.filter(i => !i.is_active).length} pasif kalem tabloda soluk görünür, switch ile tekrar aktif edebilirsiniz
                </p>
              )}
            </div>
            <Button onClick={() => openAddDialog("expense")} data-testid="add-expense-btn">
              <Plus className="w-4 h-4 mr-2" />
              Düzenli Gider Ekle
            </Button>
          </div>

          {expenseItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz düzenli gider yok</h3>
                <p className="text-muted-foreground mt-1">Kira, fatura, maaş gibi düzenli giderlerinizi ekleyin</p>
              </CardContent>
            </Card>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Durum</TableHead>
                    <TableHead>Gider Adı</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Periyot</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Aylık Karşılık</TableHead>
                    <TableHead className="w-[100px]">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseItems.map((item) => (
                    <TableRow key={item.id} className={!item.is_active ? "opacity-50" : ""} data-testid={`expense-row-${item.id}`}>
                      <TableCell>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => toggleActive(item)}
                          data-testid={`toggle-expense-${item.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getCompanyName(item.company_id)}</TableCell>
                      <TableCell>{getCategoryLabel(item.category, "expense")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.frequency === "monthly" ? "Aylık" : "Yıllık"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium currency text-red-500">
                        {formatCurrency(item.amount, item.currency)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground currency">
                        {formatCurrency(item.frequency === "monthly" ? item.amount : item.amount / 12, item.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} data-testid={`edit-expense-${item.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item)} data-testid={`delete-expense-${item.id}`}>
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

        {/* Incomes Tab */}
        <TabsContent value="incomes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {incomeItems.filter(i => !i.is_active).length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {incomeItems.filter(i => !i.is_active).length} pasif kalem tabloda soluk görünür, switch ile tekrar aktif edebilirsiniz
                </p>
              )}
            </div>
            <Button onClick={() => openAddDialog("income")} data-testid="add-income-btn">
              <Plus className="w-4 h-4 mr-2" />
              Düzenli Gelir Ekle
            </Button>
          </div>

          {incomeItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz düzenli gelir yok</h3>
                <p className="text-muted-foreground mt-1">Satış, hizmet, kira geliri gibi düzenli gelirlerinizi ekleyin</p>
              </CardContent>
            </Card>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Durum</TableHead>
                    <TableHead>Gelir Adı</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Periyot</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Aylık Karşılık</TableHead>
                    <TableHead className="w-[100px]">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeItems.map((item) => (
                    <TableRow key={item.id} className={!item.is_active ? "opacity-50" : ""} data-testid={`income-row-${item.id}`}>
                      <TableCell>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => toggleActive(item)}
                          data-testid={`toggle-income-${item.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getCompanyName(item.company_id)}</TableCell>
                      <TableCell>{getCategoryLabel(item.category, "income")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.frequency === "monthly" ? "Aylık" : "Yıllık"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium currency text-green-500">
                        {formatCurrency(item.amount, item.currency)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground currency">
                        {formatCurrency(item.frequency === "monthly" ? item.amount : item.amount / 12, item.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} data-testid={`edit-income-${item.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item)} data-testid={`delete-income-${item.id}`}>
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
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? `${form.item_type === "income" ? "Gelir" : "Gider"} Düzenle` 
                : `Düzenli ${form.item_type === "income" ? "Gelir" : "Gider"} Ekle`
              }
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Firma *</Label>
              <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                <SelectTrigger data-testid="budget-company-select">
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
              <Label>{form.item_type === "income" ? "Gelir" : "Gider"} Adı *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={form.item_type === "income" ? "Örn: Aylık Satış" : "Örn: Ofis Kirası"}
                data-testid="budget-name"
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
                  data-testid="budget-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger data-testid="budget-currency">
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
                  <SelectTrigger data-testid="budget-category">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(form.item_type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Periyot *</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger data-testid="budget-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ek notlar (opsiyonel)"
                data-testid="budget-notes"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Aktif</Label>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                data-testid="budget-active"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" disabled={saving} data-testid="budget-submit">
                {saving ? "Kaydediliyor..." : editingItem ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
