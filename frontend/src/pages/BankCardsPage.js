import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Landmark, CreditCard, Plus, Pencil, Trash2, Wallet, Building2 } from "lucide-react";
import { formatCurrency, formatDate, CURRENCIES } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BankCardsPage() {
  const { companies, selectedCompany } = useCompany();
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [accountDialog, setAccountDialog] = useState(false);
  const [cardDialog, setCardDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyAccount = {
    company_id: "", bank_name: "", account_name: "", iban: "",
    currency: "TRY", balance: "", kmh_limit: "", notes: ""
  };
  const emptyCard = {
    company_id: "", bank_name: "", card_name: "", last_four: "",
    currency: "TRY", total_limit: "", available_limit: "",
    cut_off_date: "", due_date: "", notes: ""
  };

  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [cardForm, setCardForm] = useState(emptyCard);

  useEffect(() => {
    fetchAll();
  }, [selectedCompany]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const [accRes, cardRes, sumRes] = await Promise.all([
        axios.get(`${API}/bank-accounts`, { params }),
        axios.get(`${API}/credit-cards`, { params }),
        axios.get(`${API}/bank-cards/summary`, { params })
      ]);
      setAccounts(accRes.data);
      setCards(cardRes.data);
      setSummary(sumRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (id) => companies.find(c => c.id === id)?.name || "-";

  // ---- Account CRUD ----
  const openAccountDialog = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        company_id: account.company_id,
        bank_name: account.bank_name,
        account_name: account.account_name || "",
        iban: account.iban || "",
        currency: account.currency,
        balance: account.balance.toString(),
        kmh_limit: account.kmh_limit.toString(),
        notes: account.notes || ""
      });
    } else {
      setEditingAccount(null);
      setAccountForm({ ...emptyAccount, company_id: selectedCompany?.id || "" });
    }
    setAccountDialog(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.company_id || !accountForm.bank_name) {
      toast.error("Lütfen banka adı ve firma seçin");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...accountForm,
        balance: parseFloat(accountForm.balance) || 0,
        kmh_limit: parseFloat(accountForm.kmh_limit) || 0
      };
      if (editingAccount) {
        await axios.put(`${API}/bank-accounts/${editingAccount.id}`, data);
        toast.success("Hesap güncellendi");
      } else {
        await axios.post(`${API}/bank-accounts`, data);
        toast.success("Hesap eklendi");
      }
      setAccountDialog(false);
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Bu hesabı silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/bank-accounts/${id}`);
      toast.success("Hesap silindi");
      fetchAll();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  // ---- Card CRUD ----
  const openCardDialog = (card = null) => {
    if (card) {
      setEditingCard(card);
      setCardForm({
        company_id: card.company_id,
        bank_name: card.bank_name,
        card_name: card.card_name || "",
        last_four: card.last_four || "",
        currency: card.currency,
        total_limit: card.total_limit.toString(),
        available_limit: card.available_limit.toString(),
        cut_off_date: card.cut_off_date || "",
        due_date: card.due_date || "",
        notes: card.notes || ""
      });
    } else {
      setEditingCard(null);
      setCardForm({ ...emptyCard, company_id: selectedCompany?.id || "" });
    }
    setCardDialog(true);
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.company_id || !cardForm.bank_name) {
      toast.error("Lütfen banka adı ve firma seçin");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...cardForm,
        total_limit: parseFloat(cardForm.total_limit) || 0,
        available_limit: parseFloat(cardForm.available_limit) || 0
      };
      if (editingCard) {
        await axios.put(`${API}/credit-cards/${editingCard.id}`, data);
        toast.success("Kart güncellendi");
      } else {
        await axios.post(`${API}/credit-cards`, data);
        toast.success("Kart eklendi");
      }
      setCardDialog(false);
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm("Bu kartı silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`${API}/credit-cards/${id}`);
      toast.success("Kart silindi");
      fetchAll();
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
    <div className="space-y-6" data-testid="bank-cards-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banka & Kartlar</h1>
        <p className="text-muted-foreground mt-1">Banka hesapları ve kredi kartlarınızı yönetin</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card" data-testid="total-balance-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Vadesiz</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Landmark className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-500 truncate">
              {formatCurrency(summary?.total_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.account_count || 0} hesap</p>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="total-kmh-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam KMH Limiti</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wallet className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-500 truncate">
              {formatCurrency(summary?.total_kmh || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="total-card-limit-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kart Limiti</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-500 truncate">
              {formatCurrency(summary?.total_card_limit || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.card_count || 0} kart</p>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="total-available-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kullanılabilir Limit</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <CreditCard className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-500 truncate">
              {formatCurrency(summary?.total_available || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts" data-testid="tab-accounts">
            <Landmark className="w-4 h-4 mr-2" /> Banka Hesapları ({accounts.length})
          </TabsTrigger>
          <TabsTrigger value="cards" data-testid="tab-cards">
            <CreditCard className="w-4 h-4 mr-2" /> Kredi Kartları ({cards.length})
          </TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openAccountDialog()} data-testid="add-account-btn">
              <Plus className="w-4 h-4 mr-2" /> Hesap Ekle
            </Button>
          </div>

          {accounts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Landmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz banka hesabı yok</h3>
                <p className="text-muted-foreground mt-1">Banka hesaplarınızı ekleyerek bakiyenizi takip edin</p>
              </CardContent>
            </Card>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banka</TableHead>
                    <TableHead>Hesap Adı</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead className="text-right">Vadesiz Bakiye</TableHead>
                    <TableHead className="text-right">KMH Limiti</TableHead>
                    <TableHead className="w-[100px]">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc) => (
                    <TableRow key={acc.id} data-testid={`account-row-${acc.id}`}>
                      <TableCell className="font-medium">{acc.bank_name}</TableCell>
                      <TableCell>{acc.account_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Building2 className="w-3 h-3 mr-1" />{getCompanyName(acc.company_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{acc.iban || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-green-500">
                        {formatCurrency(acc.balance, acc.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-500">
                        {formatCurrency(acc.kmh_limit, acc.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openAccountDialog(acc)} data-testid={`edit-account-${acc.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAccount(acc.id)} data-testid={`delete-account-${acc.id}`}>
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

        {/* Credit Cards Tab */}
        <TabsContent value="cards" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openCardDialog()} data-testid="add-card-btn">
              <Plus className="w-4 h-4 mr-2" /> Kart Ekle
            </Button>
          </div>

          {cards.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Henüz kredi kartı yok</h3>
                <p className="text-muted-foreground mt-1">Kredi kartlarınızı ekleyerek limitinizi takip edin</p>
              </CardContent>
            </Card>
          ) : (
            <div className="data-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banka</TableHead>
                    <TableHead>Kart Adı</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Son 4</TableHead>
                    <TableHead className="text-right">Toplam Limit</TableHead>
                    <TableHead className="text-right">Kullanılabilir</TableHead>
                    <TableHead>Hesap Kesim</TableHead>
                    <TableHead>Son Ödeme</TableHead>
                    <TableHead className="w-[100px]">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((card) => {
                    const usedPercent = card.total_limit > 0
                      ? Math.round(((card.total_limit - card.available_limit) / card.total_limit) * 100)
                      : 0;
                    return (
                      <TableRow key={card.id} data-testid={`card-row-${card.id}`}>
                        <TableCell className="font-medium">{card.bank_name}</TableCell>
                        <TableCell>{card.card_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Building2 className="w-3 h-3 mr-1" />{getCompanyName(card.company_id)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">*{card.last_four || "----"}</TableCell>
                        <TableCell className="text-right font-medium text-purple-500">
                          {formatCurrency(card.total_limit, card.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <span className="font-medium text-orange-500">{formatCurrency(card.available_limit, card.currency)}</span>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${usedPercent > 80 ? "bg-red-500" : usedPercent > 50 ? "bg-orange-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(usedPercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">%{usedPercent} kullanıldı</span>
                          </div>
                        </TableCell>
                        <TableCell>{card.cut_off_date || "-"}</TableCell>
                        <TableCell>{card.due_date || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openCardDialog(card)} data-testid={`edit-card-${card.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteCard(card.id)} data-testid={`delete-card-${card.id}`}>
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
      </Tabs>

      {/* Bank Account Dialog */}
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Hesap Düzenle" : "Yeni Banka Hesabı"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Firma *</Label>
                <Select value={accountForm.company_id} onValueChange={(v) => setAccountForm({ ...accountForm, company_id: v })}>
                  <SelectTrigger data-testid="account-company"><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Banka Adı *</Label>
                <Input value={accountForm.bank_name} onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })} placeholder="Örn: Garanti BBVA" data-testid="account-bank-name" />
              </div>
              <div className="space-y-2">
                <Label>Hesap Adı</Label>
                <Input value={accountForm.account_name} onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })} placeholder="Örn: Vadesiz TL" data-testid="account-name" />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={accountForm.iban} onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })} placeholder="TR..." data-testid="account-iban" />
              </div>
              <div className="space-y-2">
                <Label>Vadesiz Bakiye</Label>
                <Input type="number" step="0.01" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })} placeholder="0.00" data-testid="account-balance" />
              </div>
              <div className="space-y-2">
                <Label>KMH Limiti</Label>
                <Input type="number" step="0.01" value={accountForm.kmh_limit} onChange={(e) => setAccountForm({ ...accountForm, kmh_limit: e.target.value })} placeholder="0.00" data-testid="account-kmh" />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={accountForm.currency} onValueChange={(v) => setAccountForm({ ...accountForm, currency: v })}>
                  <SelectTrigger data-testid="account-currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Not</Label>
                <Input value={accountForm.notes} onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })} placeholder="Opsiyonel" data-testid="account-notes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAccountDialog(false)}>İptal</Button>
              <Button type="submit" disabled={saving} data-testid="save-account-btn">
                {saving ? "Kaydediliyor..." : editingAccount ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credit Card Dialog */}
      <Dialog open={cardDialog} onOpenChange={setCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? "Kart Düzenle" : "Yeni Kredi Kartı"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCard} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Firma *</Label>
                <Select value={cardForm.company_id} onValueChange={(v) => setCardForm({ ...cardForm, company_id: v })}>
                  <SelectTrigger data-testid="card-company"><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Banka Adı *</Label>
                <Input value={cardForm.bank_name} onChange={(e) => setCardForm({ ...cardForm, bank_name: e.target.value })} placeholder="Örn: Yapı Kredi" data-testid="card-bank-name" />
              </div>
              <div className="space-y-2">
                <Label>Kart Adı</Label>
                <Input value={cardForm.card_name} onChange={(e) => setCardForm({ ...cardForm, card_name: e.target.value })} placeholder="Örn: World Kart" data-testid="card-name" />
              </div>
              <div className="space-y-2">
                <Label>Son 4 Hane</Label>
                <Input value={cardForm.last_four} onChange={(e) => setCardForm({ ...cardForm, last_four: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="1234" maxLength={4} data-testid="card-last-four" />
              </div>
              <div className="space-y-2">
                <Label>Toplam Limit</Label>
                <Input type="number" step="0.01" value={cardForm.total_limit} onChange={(e) => setCardForm({ ...cardForm, total_limit: e.target.value })} placeholder="0.00" data-testid="card-total-limit" />
              </div>
              <div className="space-y-2">
                <Label>Kullanılabilir Limit</Label>
                <Input type="number" step="0.01" value={cardForm.available_limit} onChange={(e) => setCardForm({ ...cardForm, available_limit: e.target.value })} placeholder="0.00" data-testid="card-available-limit" />
              </div>
              <div className="space-y-2">
                <Label>Hesap Kesim Tarihi</Label>
                <Input value={cardForm.cut_off_date} onChange={(e) => setCardForm({ ...cardForm, cut_off_date: e.target.value })} placeholder="Örn: Her ayın 15'i" data-testid="card-cutoff" />
              </div>
              <div className="space-y-2">
                <Label>Son Ödeme Tarihi</Label>
                <Input value={cardForm.due_date} onChange={(e) => setCardForm({ ...cardForm, due_date: e.target.value })} placeholder="Örn: Her ayın 5'i" data-testid="card-due" />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={cardForm.currency} onValueChange={(v) => setCardForm({ ...cardForm, currency: v })}>
                  <SelectTrigger data-testid="card-currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Not</Label>
                <Input value={cardForm.notes} onChange={(e) => setCardForm({ ...cardForm, notes: e.target.value })} placeholder="Opsiyonel" data-testid="card-notes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCardDialog(false)}>İptal</Button>
              <Button type="submit" disabled={saving} data-testid="save-card-btn">
                {saving ? "Kaydediliyor..." : editingCard ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
