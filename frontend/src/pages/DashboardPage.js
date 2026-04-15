import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { formatCurrency, getMonthName, EXPENSE_CATEGORIES } from "../lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
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

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4"];

export default function DashboardPage() {
  const { selectedCompany } = useCompany();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedCompany]);

  const fetchStats = async () => {
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const response = await axios.get(`${API}/dashboard/stats`, { params });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = stats?.monthly_chart?.map(item => ({
    ...item,
    name: getMonthName(item.month)
  })) || [];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finansal Özet</h1>
        <p className="text-muted-foreground mt-1">
          {selectedCompany ? selectedCompany.name : "Tüm Firmalar"} - Genel Bakış
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card" data-testid="stat-income">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gelir</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency text-green-500">
              {formatCurrency(stats?.total_income || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              Bu dönem toplam
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-expense">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gider</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency text-red-500">
              {formatCurrency(stats?.total_expense || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-red-500" />
              Bu dönem toplam
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-balance">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Bakiye</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold currency ${(stats?.net_balance || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(stats?.net_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gelir - Gider
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-reminders">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen Ödemeler</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Bell className="w-4 h-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pending_reminders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ödeme hatırlatıcısı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <Card className="lg:col-span-2" data-testid="monthly-chart">
          <CardHeader>
            <CardTitle>Aylık Gelir/Gider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 19%, 20%)" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(215, 20%, 65%)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(215, 20%, 65%)"
                    fontSize={12}
                    tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230, 25%, 10%)",
                      borderColor: "hsl(217, 19%, 20%)",
                      borderRadius: "8px"
                    }}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  <Bar dataKey="income" name="Gelir" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card data-testid="expense-categories-chart">
          <CardHeader>
            <CardTitle>Gider Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.expense_categories || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.expense_categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230, 25%, 10%)",
                      borderColor: "hsl(217, 19%, 20%)",
                      borderRadius: "8px"
                    }}
                    formatter={(value, name) => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.value === name);
                      return [formatCurrency(value), cat?.label || name];
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.value === value);
                      return <span className="text-sm text-muted-foreground">{cat?.label || value}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personnel & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="personnel-stat">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Personel</CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.total_personnel || 0}</div>
            <p className="text-muted-foreground">Aktif personel sayısı</p>
          </CardContent>
        </Card>

        <Card data-testid="summary-stat">
          <CardHeader>
            <CardTitle>Özet Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Toplam Gelir</span>
              <span className="font-medium currency text-green-500">{formatCurrency(stats?.total_income || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Toplam Gider</span>
              <span className="font-medium currency text-red-500">{formatCurrency(stats?.total_expense || 0)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="font-medium">Net Bakiye</span>
              <span className={`font-bold currency ${(stats?.net_balance || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(stats?.net_balance || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
