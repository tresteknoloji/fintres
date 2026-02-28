import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatCurrency, getMonthName, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/utils";
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

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

export default function ReportsPage() {
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
    name: getMonthName(item.month),
    net: item.income - item.expense
  })) || [];

  const expenseCategories = stats?.expense_categories || [];

  // Calculate cumulative data for area chart
  let cumulativeIncome = 0;
  let cumulativeExpense = 0;
  const cumulativeData = chartData.map(item => {
    cumulativeIncome += item.income;
    cumulativeExpense += item.expense;
    return {
      ...item,
      cumulativeIncome,
      cumulativeExpense,
      cumulativeNet: cumulativeIncome - cumulativeExpense
    };
  });

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
        <p className="text-muted-foreground mt-1">
          {selectedCompany ? selectedCompany.name : "Tüm Firmalar"} - Detaylı Finansal Analiz
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency text-green-500">
              {formatCurrency(stats?.total_income || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency text-red-500">
              {formatCurrency(stats?.total_expense || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold currency ${(stats?.net_balance || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(stats?.net_balance || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kar Marjı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.net_balance || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stats?.total_income > 0 
                ? `${((stats.net_balance / stats.total_income) * 100).toFixed(1)}%`
                : "0%"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="trend" data-testid="tab-trend">Trend Analizi</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Kategori Dağılımı</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Bar Chart */}
            <Card data-testid="monthly-bar-chart">
              <CardHeader>
                <CardTitle>Aylık Gelir/Gider Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 19%, 20%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(230, 25%, 10%)", borderColor: "hsl(217, 19%, 20%)", borderRadius: "8px" }}
                        formatter={(value) => [formatCurrency(value), ""]}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Gelir" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Net Balance Line Chart */}
            <Card data-testid="net-balance-chart">
              <CardHeader>
                <CardTitle>Aylık Net Bakiye</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 19%, 20%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(230, 25%, 10%)", borderColor: "hsl(217, 19%, 20%)", borderRadius: "8px" }}
                        formatter={(value) => [formatCurrency(value), ""]}
                      />
                      <Line type="monotone" dataKey="net" name="Net Bakiye" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="space-y-6">
          {/* Cumulative Area Chart */}
          <Card data-testid="cumulative-chart">
            <CardHeader>
              <CardTitle>Kümülatif Gelir/Gider Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 19%, 20%)" />
                    <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(230, 25%, 10%)", borderColor: "hsl(217, 19%, 20%)", borderRadius: "8px" }}
                      formatter={(value) => [formatCurrency(value), ""]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="cumulativeIncome" name="Kümülatif Gelir" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="cumulativeExpense" name="Kümülatif Gider" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Net Balance Trend */}
          <Card data-testid="net-trend-chart">
            <CardHeader>
              <CardTitle>Kümülatif Net Bakiye Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 19%, 20%)" />
                    <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(230, 25%, 10%)", borderColor: "hsl(217, 19%, 20%)", borderRadius: "8px" }}
                      formatter={(value) => [formatCurrency(value), ""]}
                    />
                    <Area type="monotone" dataKey="cumulativeNet" name="Kümülatif Net" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories Pie Chart */}
            <Card data-testid="expense-pie-chart">
              <CardHeader>
                <CardTitle>Gider Kategorileri Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(230, 25%, 10%)", borderColor: "hsl(217, 19%, 20%)", borderRadius: "8px" }}
                        formatter={(value) => [formatCurrency(value), ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Details */}
            <Card data-testid="category-details">
              <CardHeader>
                <CardTitle>Kategori Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategories.map((cat, index) => {
                    const totalExpense = expenseCategories.reduce((sum, c) => sum + c.value, 0);
                    const percentage = totalExpense > 0 ? (cat.value / totalExpense * 100).toFixed(1) : 0;
                    return (
                      <div key={cat.name} className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium capitalize">{cat.name}</span>
                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 currency">{formatCurrency(cat.value)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {expenseCategories.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Henüz gider verisi yok</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
