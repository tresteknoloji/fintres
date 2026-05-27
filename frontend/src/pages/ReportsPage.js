import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector, defaultPeriodValue } from "../components/PeriodSelector";
import {
  formatCurrency,
  getMonthName,
  isWithinRange,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from "../lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PIE_COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

export default function ReportsPage() {
  const { selectedCompany } = useCompany();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(() => defaultPeriodValue("this_year"));

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const [incRes, expRes] = await Promise.all([
        axios.get(`${API}/incomes`, { params }),
        axios.get(`${API}/expenses`, { params })
      ]);
      setIncomes(incRes.data || []);
      setExpenses(expRes.data || []);
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncomes = useMemo(
    () => incomes.filter((i) => isWithinRange(i.date, period.startDate, period.endDate)),
    [incomes, period]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isWithinRange(e.date, period.startDate, period.endDate)),
    [expenses, period]
  );

  const totalIncome = useMemo(
    () => filteredIncomes.reduce((s, i) => s + (i.currency === "TRY" ? Number(i.amount) || 0 : 0), 0),
    [filteredIncomes]
  );
  const totalExpense = useMemo(
    () => filteredExpenses.reduce((s, e) => s + (e.currency === "TRY" ? Number(e.amount) || 0 : 0), 0),
    [filteredExpenses]
  );
  const netBalance = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  const monthlyChart = useMemo(() => {
    const map = {};
    filteredIncomes.forEach((i) => {
      if (i.currency !== "TRY") return;
      const m = i.date?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
      map[m].income += Number(i.amount) || 0;
    });
    filteredExpenses.forEach((e) => {
      if (e.currency !== "TRY") return;
      const m = e.date?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
      map[m].expense += Number(e.amount) || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, name: getMonthName(m.month), net: m.income - m.expense }));
  }, [filteredIncomes, filteredExpenses]);

  const cumulativeData = useMemo(() => {
    let cI = 0, cE = 0;
    return monthlyChart.map((item) => {
      cI += item.income;
      cE += item.expense;
      return { ...item, cumulativeIncome: cI, cumulativeExpense: cE, cumulativeNet: cI - cE };
    });
  }, [monthlyChart]);

  const expenseCategories = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      if (e.currency !== "TRY") return;
      const cat = e.category || "diger";
      if (!map[cat]) map[cat] = 0;
      map[cat] += Number(e.amount) || 0;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const incomeCategories = useMemo(() => {
    const map = {};
    filteredIncomes.forEach((i) => {
      if (i.currency !== "TRY") return;
      const cat = i.category || "diger";
      if (!map[cat]) map[cat] = 0;
      map[cat] += Number(i.amount) || 0;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredIncomes]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    boxShadow: "var(--shadow-lg)",
    color: "hsl(var(--popover-foreground))"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <PageHeader
        title="Raporlar"
        subtitle={`${selectedCompany ? selectedCompany.name : "Tüm Firmalar"} • Detaylı Finansal Analiz`}
        icon={BarChart3}
      />

      {/* Period Selector */}
      <div className="surface p-3 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground shrink-0 pl-1">Dönem</span>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Toplam Gelir" value={totalIncome} icon={TrendingUp} tone="success" hint="Seçili dönem (TRY)" />
        <KpiCard label="Toplam Gider" value={totalExpense} icon={TrendingDown} tone="danger" hint="Seçili dönem (TRY)" />
        <KpiCard label="Net Kar/Zarar" value={netBalance} icon={Wallet} tone={netBalance >= 0 ? "success" : "danger"} hint="Gelir − Gider" />
        <KpiCard
          label="Kar Marjı"
          value={`${profitMargin.toFixed(1)}%`}
          icon={Percent}
          tone={profitMargin >= 0 ? "success" : "danger"}
          format="raw"
          hint="Net / Gelir"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="trend" data-testid="tab-trend">Trend Analizi</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Kategori Dağılımı</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-card" data-testid="monthly-bar-chart">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Aylık Gelir / Gider Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {monthlyChart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Seçili dönemde veri yok</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                        <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), ""]} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                        <Bar dataKey="income" name="Gelir" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} maxBarSize={36} />
                        <Bar dataKey="expense" name="Gider" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card" data-testid="net-balance-chart">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Aylık Net Bakiye</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {monthlyChart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Seçili dönemde veri yok</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), ""]} />
                        <Line type="monotone" dataKey="net" name="Net Bakiye" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card className="shadow-card" data-testid="cumulative-chart">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Kümülatif Gelir / Gider Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {cumulativeData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Seçili dönemde veri yok</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="grad-income" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grad-expense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), ""]} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                      <Area type="monotone" dataKey="cumulativeIncome" name="Kümülatif Gelir" stroke="hsl(var(--success))" fill="url(#grad-income)" strokeWidth={2} />
                      <Area type="monotone" dataKey="cumulativeExpense" name="Kümülatif Gider" stroke="hsl(var(--destructive))" fill="url(#grad-expense)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card" data-testid="net-trend-chart">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Kümülatif Net Bakiye Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {cumulativeData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Seçili dönemde veri yok</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="grad-net" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(value), ""]} />
                      <Area type="monotone" dataKey="cumulativeNet" name="Kümülatif Net" stroke="hsl(var(--primary))" fill="url(#grad-net)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-card" data-testid="expense-pie-chart">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Gider Kategorileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {expenseCategories.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Seçili dönemde gider yok</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value">
                          {expenseCategories.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) => {
                            const cat = EXPENSE_CATEGORIES.find((c) => c.value === name);
                            return [formatCurrency(value), cat?.label || name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card" data-testid="category-details">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Gider Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Seçili dönemde gider yok</p>
                  ) : (
                    expenseCategories.map((cat, index) => {
                      const sum = expenseCategories.reduce((s, c) => s + c.value, 0);
                      const pct = sum > 0 ? (cat.value / sum) * 100 : 0;
                      const label = EXPENSE_CATEGORIES.find((c) => c.value === cat.name)?.label || cat.name;
                      return (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium truncate">{label}</span>
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">{pct.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 currency">{formatCurrency(cat.value)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Income categories as a smaller secondary section */}
          {incomeCategories.length > 0 && (
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Gelir Kategorileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {incomeCategories.map((cat, index) => {
                    const sum = incomeCategories.reduce((s, c) => s + c.value, 0);
                    const pct = sum > 0 ? (cat.value / sum) * 100 : 0;
                    const label = INCOME_CATEGORIES.find((c) => c.value === cat.name)?.label || cat.name;
                    return (
                      <div key={cat.name} className="surface p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{label}</p>
                            <p className="text-xs currency text-muted-foreground">{formatCurrency(cat.value)}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground shrink-0">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
