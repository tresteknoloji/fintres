import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector, defaultPeriodValue } from "../components/PeriodSelector";
import {
  formatCurrency,
  getMonthName,
  isWithinRange,
  EXPENSE_CATEGORIES
} from "../lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Bell,
  Wallet,
  Activity
} from "lucide-react";
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

const PIE_COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

export default function DashboardPage() {
  const { selectedCompany } = useCompany();
  const [stats, setStats] = useState(null);
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
      const [statsRes, incRes, expRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { params }),
        axios.get(`${API}/incomes`, { params }),
        axios.get(`${API}/expenses`, { params })
      ]);
      setStats(statsRes.data);
      setIncomes(incRes.data || []);
      setExpenses(expRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  /* --- Client-side filtered aggregates --- */
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

  /* Monthly chart from filtered data */
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
      .map((m) => ({ ...m, name: getMonthName(m.month) }));
  }, [filteredIncomes, filteredExpenses]);

  /* Expense categories pie */
  const expenseCategories = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      if (e.currency !== "TRY") return;
      const cat = e.category || "diger";
      if (!map[cat]) map[cat] = 0;
      map[cat] += Number(e.amount) || 0;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

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
    <div className="space-y-6" data-testid="dashboard-page">
      <PageHeader
        title="Finansal Özet"
        subtitle={`${selectedCompany ? selectedCompany.name : "Tüm Firmalar"} • Genel Bakış`}
        icon={Activity}
      />

      {/* Period Selector */}
      <div className="surface p-3 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground shrink-0 pl-1">Dönem</span>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Toplam Gelir"
          value={totalIncome}
          icon={TrendingUp}
          tone="success"
          hint="Seçili dönem (TRY)"
          testId="stat-income"
        />
        <KpiCard
          label="Toplam Gider"
          value={totalExpense}
          icon={TrendingDown}
          tone="danger"
          hint="Seçili dönem (TRY)"
          testId="stat-expense"
        />
        <KpiCard
          label="Net Bakiye"
          value={netBalance}
          icon={Wallet}
          tone={netBalance >= 0 ? "success" : "danger"}
          hint="Gelir − Gider"
          testId="stat-balance"
        />
        <KpiCard
          label="Bekleyen Ödemeler"
          value={stats?.pending_reminders || 0}
          icon={Bell}
          tone="warning"
          format="number"
          hint="Aktif hatırlatıcı"
          testId="stat-reminders"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Chart */}
        <Card className="lg:col-span-2 shadow-card" data-testid="monthly-chart">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Aylık Gelir / Gider</CardTitle>
              <span className="text-xs text-muted-foreground">{monthlyChart.length} ay</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {monthlyChart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Seçili dönemde veri yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--chart-axis))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="hsl(var(--chart-axis))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [formatCurrency(value), name]}
                    />
                    <Bar dataKey="income" name="Gelir" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="expense" name="Gider" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card className="shadow-card" data-testid="expense-categories-chart">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Gider Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {expenseCategories.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Seçili dönemde gider yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
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
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => {
                        const cat = EXPENSE_CATEGORIES.find((c) => c.value === value);
                        return <span className="text-xs text-muted-foreground">{cat?.label || value}</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card" data-testid="personnel-stat">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Personel</CardTitle>
            <div className="kpi-icon kpi-icon-info">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular">{stats?.total_personnel || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Aktif personel sayısı (genel)</p>
          </CardContent>
        </Card>

        <Card className="shadow-card" data-testid="summary-stat">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Seçili Dönem Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Toplam Gelir</span>
              <span className="font-semibold currency text-tone-success">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Toplam Gider</span>
              <span className="font-semibold currency text-tone-danger">{formatCurrency(totalExpense)}</span>
            </div>
            <div className="subtle-divider" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Net Bakiye</span>
              <span className={`font-bold currency ${netBalance >= 0 ? "text-tone-success" : "text-tone-danger"}`}>
                {formatCurrency(netBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
              <span>{filteredIncomes.length} gelir kaydı</span>
              <span>{filteredExpenses.length} gider kaydı</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
