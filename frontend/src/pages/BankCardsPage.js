import { useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
import { Landmark, CreditCard, Plus, Pencil, Trash2, Wallet, Building2, Banknote, Check, Eye, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, CURRENCIES } from "../lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function UsageBar({ total, available }) {
  const used = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const color = used > 80 ? "bg-red-500" : used > 50 ? "bg-orange-500" : "bg-green-500";
  return (
    <div>
      <span className="font-medium text-orange-500">{formatCurrency(available)}</span>
      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(used, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">%{used} kullanıldı</span>
    </div>
  );
}

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{paid}/{total} taksit</span>
        <span className="font-medium">%{pct}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BankCardsPage() {
  const { companies, selectedCompany } = useCompany();
  const [accounts, setAccounts] = useState([]);
  const [kmhAccounts, setKmhAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [debtSummary, setDebtSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [accountDialog, setAccountDialog] = useState(false);
  const [kmhDialog, setKmhDialog] = useState(false);
  const [cardDialog, setCardDialog] = useState(false);
  const [loanDialog, setLoanDialog] = useState(false);
  const [loanDetailDialog, setLoanDetailDialog] = useState(false);
  const [loanDetail, setLoanDetail] = useState(null);

  const [editingAccount, setEditingAccount] = useState(null);
  const [editingKmh, setEditingKmh] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyAccount = { company_id: "", bank_name: "", account_name: "", iban: "", currency: "TRY", balance: "", notes: "" };
  const emptyKmh = { company_id: "", bank_name: "", account_name: "", currency: "TRY", total_limit: "", available_limit: "", notes: "" };
  const emptyCard = { company_id: "", bank_name: "", card_name: "", last_four: "", currency: "TRY", total_limit: "", available_limit: "", cut_off_date: "", due_date: "", notes: "" };
  const emptyLoan = { company_id: "", bank_name: "", loan_name: "", currency: "TRY", loan_amount: "", interest_rate: "", start_date: "", term_months: "", monthly_payment: "", total_repayment: "", payment_day: "1", notes: "" };

  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [kmhForm, setKmhForm] = useState(emptyKmh);
  const [cardForm, setCardForm] = useState(emptyCard);
  const [loanForm, setLoanForm] = useState(emptyLoan);

  useEffect(() => { fetchAll(); }, [selectedCompany]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = selectedCompany ? { company_id: selectedCompany.id } : {};
      const [accRes, kmhRes, cardRes, loanRes, sumRes, debtRes] = await Promise.all([
        axios.get(`${API}/bank-accounts`, { params }),
        axios.get(`${API}/kmh-accounts`, { params }),
        axios.get(`${API}/credit-cards`, { params }),
        axios.get(`${API}/loans`, { params }),
        axios.get(`${API}/bank-cards/summary`, { params }),
        axios.get(`${API}/bank-cards/debt-summary`, { params })
      ]);
      setAccounts(accRes.data);
      setKmhAccounts(kmhRes.data);
      setCards(cardRes.data);
      setLoans(loanRes.data);
      setSummary(sumRes.data);
      setDebtSummary(debtRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (id) => companies.find(c => c.id === id)?.name || "-";
  const defaultCompanyId = selectedCompany?.id || "";

  // ---- Account CRUD ----
  const openAccountDialog = (acc = null) => {
    if (acc) { setEditingAccount(acc); setAccountForm({ company_id: acc.company_id, bank_name: acc.bank_name, account_name: acc.account_name || "", iban: acc.iban || "", currency: acc.currency, balance: acc.balance.toString(), notes: acc.notes || "" }); }
    else { setEditingAccount(null); setAccountForm({ ...emptyAccount, company_id: defaultCompanyId }); }
    setAccountDialog(true);
  };
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.company_id || !accountForm.bank_name) { toast.error("Lütfen banka adı ve firma seçin"); return; }
    setSaving(true);
    try {
      const data = { ...accountForm, balance: parseFloat(accountForm.balance) || 0 };
      if (editingAccount) { await axios.put(`${API}/bank-accounts/${editingAccount.id}`, data); toast.success("Hesap güncellendi"); }
      else { await axios.post(`${API}/bank-accounts`, data); toast.success("Hesap eklendi"); }
      setAccountDialog(false); fetchAll();
    } catch (error) { toast.error("İşlem başarısız"); } finally { setSaving(false); }
  };
  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Bu hesabı silmek istediğinize emin misiniz?")) return;
    try { await axios.delete(`${API}/bank-accounts/${id}`); toast.success("Hesap silindi"); fetchAll(); } catch { toast.error("Silme başarısız"); }
  };

  // ---- KMH CRUD ----
  const openKmhDialog = (kmh = null) => {
    if (kmh) { setEditingKmh(kmh); setKmhForm({ company_id: kmh.company_id, bank_name: kmh.bank_name, account_name: kmh.account_name || "", currency: kmh.currency, total_limit: kmh.total_limit.toString(), available_limit: kmh.available_limit.toString(), notes: kmh.notes || "" }); }
    else { setEditingKmh(null); setKmhForm({ ...emptyKmh, company_id: defaultCompanyId }); }
    setKmhDialog(true);
  };
  const handleSaveKmh = async (e) => {
    e.preventDefault();
    if (!kmhForm.company_id || !kmhForm.bank_name) { toast.error("Lütfen banka adı ve firma seçin"); return; }
    setSaving(true);
    try {
      const data = { ...kmhForm, total_limit: parseFloat(kmhForm.total_limit) || 0, available_limit: parseFloat(kmhForm.available_limit) || 0 };
      if (editingKmh) { await axios.put(`${API}/kmh-accounts/${editingKmh.id}`, data); toast.success("KMH güncellendi"); }
      else { await axios.post(`${API}/kmh-accounts`, data); toast.success("KMH eklendi"); }
      setKmhDialog(false); fetchAll();
    } catch (error) { toast.error("İşlem başarısız"); } finally { setSaving(false); }
  };
  const handleDeleteKmh = async (id) => {
    if (!window.confirm("Bu KMH hesabını silmek istediğinize emin misiniz?")) return;
    try { await axios.delete(`${API}/kmh-accounts/${id}`); toast.success("KMH silindi"); fetchAll(); } catch { toast.error("Silme başarısız"); }
  };

  // ---- Card CRUD ----
  const openCardDialog = (card = null) => {
    if (card) { setEditingCard(card); setCardForm({ company_id: card.company_id, bank_name: card.bank_name, card_name: card.card_name || "", last_four: card.last_four || "", currency: card.currency, total_limit: card.total_limit.toString(), available_limit: card.available_limit.toString(), cut_off_date: card.cut_off_date || "", due_date: card.due_date || "", notes: card.notes || "" }); }
    else { setEditingCard(null); setCardForm({ ...emptyCard, company_id: defaultCompanyId }); }
    setCardDialog(true);
  };
  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.company_id || !cardForm.bank_name) { toast.error("Lütfen banka adı ve firma seçin"); return; }
    setSaving(true);
    try {
      const data = { ...cardForm, total_limit: parseFloat(cardForm.total_limit) || 0, available_limit: parseFloat(cardForm.available_limit) || 0 };
      if (editingCard) { await axios.put(`${API}/credit-cards/${editingCard.id}`, data); toast.success("Kart güncellendi"); }
      else { await axios.post(`${API}/credit-cards`, data); toast.success("Kart eklendi"); }
      setCardDialog(false); fetchAll();
    } catch (error) { toast.error("İşlem başarısız"); } finally { setSaving(false); }
  };
  const handleDeleteCard = async (id) => {
    if (!window.confirm("Bu kartı silmek istediğinize emin misiniz?")) return;
    try { await axios.delete(`${API}/credit-cards/${id}`); toast.success("Kart silindi"); fetchAll(); } catch { toast.error("Silme başarısız"); }
  };

  // ---- Loan CRUD ----
  const openLoanDialog = () => { setLoanForm({ ...emptyLoan, company_id: defaultCompanyId }); setLoanDialog(true); };
  const handleSaveLoan = async (e) => {
    e.preventDefault();
    if (!loanForm.company_id || !loanForm.bank_name || !loanForm.loan_amount || !loanForm.term_months || !loanForm.monthly_payment || !loanForm.start_date) {
      toast.error("Lütfen zorunlu alanları doldurun"); return;
    }
    setSaving(true);
    try {
      const data = {
        ...loanForm,
        loan_amount: parseFloat(loanForm.loan_amount) || 0,
        interest_rate: parseFloat(loanForm.interest_rate) || 0,
        term_months: parseInt(loanForm.term_months) || 0,
        monthly_payment: parseFloat(loanForm.monthly_payment) || 0,
        total_repayment: parseFloat(loanForm.total_repayment) || 0,
        payment_day: parseInt(loanForm.payment_day) || 1
      };
      await axios.post(`${API}/loans`, data);
      toast.success("Kredi eklendi ve ilk taksit hatırlatıcısı oluşturuldu");
      setLoanDialog(false); fetchAll();
    } catch (error) { toast.error("İşlem başarısız"); } finally { setSaving(false); }
  };
  const handleDeleteLoan = async (id) => {
    if (!window.confirm("Bu krediyi ve tüm taksitlerini silmek istediğinize emin misiniz?")) return;
    try { await axios.delete(`${API}/loans/${id}`); toast.success("Kredi silindi"); fetchAll(); } catch { toast.error("Silme başarısız"); }
  };
  const openLoanDetail = async (loan) => {
    try {
      const res = await axios.get(`${API}/loans/${loan.id}`);
      setLoanDetail(res.data);
      setLoanDetailDialog(true);
    } catch { toast.error("Kredi detayı yüklenemedi"); }
  };
  const handlePayInstallment = async (loanId) => {
    try {
      const res = await axios.put(`${API}/loans/${loanId}/pay-installment`);
      toast.success(res.data.message);
      // Detayı yenile
      const detailRes = await axios.get(`${API}/loans/${loanId}`);
      setLoanDetail(detailRes.data);
      fetchAll();
    } catch (error) { toast.error(error.response?.data?.detail || "İşlem başarısız"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6" data-testid="bank-cards-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banka & Kartlar</h1>
        <p className="text-muted-foreground mt-1">Banka hesapları, KMH, kredi kartları ve kredilerinizi yönetin</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="stat-card" data-testid="total-balance-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Vadesiz</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10"><Landmark className="w-4 h-4 text-green-500" /></div>
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-green-500 truncate">{formatCurrency(summary?.total_balance || 0)}</div><p className="text-xs text-muted-foreground mt-1">{summary?.account_count || 0} hesap</p></CardContent>
        </Card>
        <Card className="stat-card" data-testid="total-kmh-limit-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">KMH Kullanılabilir</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10"><Wallet className="w-4 h-4 text-blue-500" /></div>
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-blue-500 truncate">{formatCurrency(summary?.total_kmh_available || 0)}</div><p className="text-xs text-muted-foreground mt-1">{summary?.kmh_count || 0} KMH</p></CardContent>
        </Card>
        <Card className="stat-card" data-testid="total-card-limit-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kart Limiti</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10"><CreditCard className="w-4 h-4 text-purple-500" /></div>
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-purple-500 truncate">{formatCurrency(summary?.total_card_limit || 0)}</div><p className="text-xs text-muted-foreground mt-1">{summary?.card_count || 0} kart</p></CardContent>
        </Card>
        <Card className="stat-card" data-testid="total-card-available-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kart Kullanılabilir</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/10"><CreditCard className="w-4 h-4 text-orange-500" /></div>
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-orange-500 truncate">{formatCurrency(summary?.total_card_available || 0)}</div></CardContent>
        </Card>
        <Card className="stat-card" data-testid="total-loans-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif Krediler</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10"><Banknote className="w-4 h-4 text-red-500" /></div>
          </CardHeader>
          <CardContent><div className="text-xl sm:text-2xl font-bold text-red-500 truncate">{loans.length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts" data-testid="tab-accounts"><Landmark className="w-4 h-4 mr-2" />Hesaplar ({accounts.length})</TabsTrigger>
          <TabsTrigger value="kmh" data-testid="tab-kmh"><Wallet className="w-4 h-4 mr-2" />KMH ({kmhAccounts.length})</TabsTrigger>
          <TabsTrigger value="cards" data-testid="tab-cards"><CreditCard className="w-4 h-4 mr-2" />Kartlar ({cards.length})</TabsTrigger>
          <TabsTrigger value="loans" data-testid="tab-loans"><Banknote className="w-4 h-4 mr-2" />Krediler ({loans.length})</TabsTrigger>
          <TabsTrigger value="debt" data-testid="tab-debt"><AlertCircle className="w-4 h-4 mr-2" />Borç Özeti</TabsTrigger>
        </TabsList>

        {/* Bank Accounts */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => openAccountDialog()} data-testid="add-account-btn"><Plus className="w-4 h-4 mr-2" />Hesap Ekle</Button></div>
          {accounts.length === 0 ? (
            <Card className="text-center py-12"><CardContent><Landmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium">Henüz banka hesabı yok</h3></CardContent></Card>
          ) : (
            <div className="data-table"><Table><TableHeader><TableRow>
              <TableHead>Banka</TableHead><TableHead>Hesap Adı</TableHead><TableHead>Firma</TableHead><TableHead>IBAN</TableHead><TableHead className="text-right">Vadesiz Bakiye</TableHead><TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow></TableHeader><TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id}><TableCell className="font-medium">{acc.bank_name}</TableCell><TableCell>{acc.account_name || "-"}</TableCell><TableCell><Badge variant="outline"><Building2 className="w-3 h-3 mr-1" />{getCompanyName(acc.company_id)}</Badge></TableCell><TableCell className="text-xs font-mono">{acc.iban || "-"}</TableCell><TableCell className="text-right font-medium text-green-500">{formatCurrency(acc.balance, acc.currency)}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openAccountDialog(acc)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAccount(acc.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell></TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </TabsContent>

        {/* KMH */}
        <TabsContent value="kmh" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => openKmhDialog()} data-testid="add-kmh-btn"><Plus className="w-4 h-4 mr-2" />KMH Ekle</Button></div>
          {kmhAccounts.length === 0 ? (
            <Card className="text-center py-12"><CardContent><Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium">Henüz KMH hesabı yok</h3></CardContent></Card>
          ) : (
            <div className="data-table"><Table><TableHeader><TableRow>
              <TableHead>Banka</TableHead><TableHead>Hesap Adı</TableHead><TableHead>Firma</TableHead><TableHead className="text-right">Toplam Limit</TableHead><TableHead className="text-right">Kullanılabilir</TableHead><TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow></TableHeader><TableBody>
              {kmhAccounts.map((kmh) => (
                <TableRow key={kmh.id}><TableCell className="font-medium">{kmh.bank_name}</TableCell><TableCell>{kmh.account_name || "-"}</TableCell><TableCell><Badge variant="outline"><Building2 className="w-3 h-3 mr-1" />{getCompanyName(kmh.company_id)}</Badge></TableCell><TableCell className="text-right font-medium text-blue-500">{formatCurrency(kmh.total_limit, kmh.currency)}</TableCell><TableCell className="text-right"><UsageBar total={kmh.total_limit} available={kmh.available_limit} /></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openKmhDialog(kmh)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteKmh(kmh.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell></TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </TabsContent>

        {/* Cards */}
        <TabsContent value="cards" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => openCardDialog()} data-testid="add-card-btn"><Plus className="w-4 h-4 mr-2" />Kart Ekle</Button></div>
          {cards.length === 0 ? (
            <Card className="text-center py-12"><CardContent><CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium">Henüz kredi kartı yok</h3></CardContent></Card>
          ) : (
            <div className="data-table"><Table><TableHeader><TableRow>
              <TableHead>Banka</TableHead><TableHead>Kart Adı</TableHead><TableHead>Firma</TableHead><TableHead>Son 4</TableHead><TableHead className="text-right">Toplam Limit</TableHead><TableHead className="text-right">Kullanılabilir</TableHead><TableHead>Hesap Kesim</TableHead><TableHead>Son Ödeme</TableHead><TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow></TableHeader><TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}><TableCell className="font-medium">{card.bank_name}</TableCell><TableCell>{card.card_name || "-"}</TableCell><TableCell><Badge variant="outline"><Building2 className="w-3 h-3 mr-1" />{getCompanyName(card.company_id)}</Badge></TableCell><TableCell className="font-mono">*{card.last_four || "----"}</TableCell><TableCell className="text-right font-medium text-purple-500">{formatCurrency(card.total_limit, card.currency)}</TableCell><TableCell className="text-right"><UsageBar total={card.total_limit} available={card.available_limit} /></TableCell><TableCell>{card.cut_off_date || "-"}</TableCell><TableCell>{card.due_date || "-"}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openCardDialog(card)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteCard(card.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell></TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </TabsContent>

        {/* Loans */}
        <TabsContent value="loans" className="space-y-4">
          <div className="flex justify-end"><Button onClick={openLoanDialog} data-testid="add-loan-btn"><Plus className="w-4 h-4 mr-2" />Kredi Ekle</Button></div>
          {loans.length === 0 ? (
            <Card className="text-center py-12"><CardContent><Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium">Henüz kredi yok</h3><p className="text-muted-foreground mt-1">Kredilerinizi ekleyerek taksitlerinizi takip edin</p></CardContent></Card>
          ) : (
            <div className="data-table"><Table><TableHeader><TableRow>
              <TableHead>Banka</TableHead><TableHead>Kredi Adı</TableHead><TableHead>Firma</TableHead><TableHead className="text-right">Kredi Tutarı</TableHead><TableHead className="text-right">Aylık Taksit</TableHead><TableHead>Faiz</TableHead><TableHead>Taksit Durumu</TableHead><TableHead className="w-[120px]">İşlemler</TableHead>
            </TableRow></TableHeader><TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id} data-testid={`loan-row-${loan.id}`}>
                  <TableCell className="font-medium">{loan.bank_name}</TableCell>
                  <TableCell>{loan.loan_name || "-"}</TableCell>
                  <TableCell><Badge variant="outline"><Building2 className="w-3 h-3 mr-1" />{getCompanyName(loan.company_id)}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(loan.loan_amount, loan.currency)}</TableCell>
                  <TableCell className="text-right font-medium text-red-500">{formatCurrency(loan.monthly_payment, loan.currency)}</TableCell>
                  <TableCell>%{loan.interest_rate}</TableCell>
                  <TableCell className="min-w-[150px]"><ProgressBar paid={loan.paid_installments || 0} total={loan.term_months} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openLoanDetail(loan)} title="Detay" data-testid={`detail-loan-${loan.id}`}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteLoan(loan.id)} data-testid={`delete-loan-${loan.id}`}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </TabsContent>

        {/* Borç Özeti */}
        <TabsContent value="debt" className="space-y-6">
          {debtSummary && (
            <>
              {/* Toplam Borç Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-2 border-red-500/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Toplam Borç</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(debtSummary.total_debt)}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">KMH Borcu</CardTitle></CardHeader>
                  <CardContent><div className="text-xl font-bold text-blue-500">{formatCurrency(debtSummary.total_kmh_debt)}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Kredi Kartı Borcu</CardTitle></CardHeader>
                  <CardContent><div className="text-xl font-bold text-purple-500">{formatCurrency(debtSummary.total_card_debt)}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Kredi Borcu</CardTitle></CardHeader>
                  <CardContent><div className="text-xl font-bold text-orange-500">{formatCurrency(debtSummary.total_loan_debt)}</div></CardContent>
                </Card>
              </div>

              {/* KMH Borçları */}
              {debtSummary.kmh_debts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-500" />KMH Borçları</CardTitle></CardHeader>
                  <CardContent>
                    <Table><TableHeader><TableRow><TableHead>Banka</TableHead><TableHead>Hesap</TableHead><TableHead className="text-right">Borç</TableHead></TableRow></TableHeader>
                    <TableBody>{debtSummary.kmh_debts.map((d, i) => (
                      <TableRow key={i}><TableCell className="font-medium">{d.bank_name}</TableCell><TableCell>{d.account_name || "-"}</TableCell><TableCell className="text-right font-bold text-blue-500">{formatCurrency(d.debt, d.currency)}</TableCell></TableRow>
                    ))}</TableBody></Table>
                  </CardContent>
                </Card>
              )}

              {/* Kart Borçları */}
              {debtSummary.card_debts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4 text-purple-500" />Kredi Kartı Borçları</CardTitle></CardHeader>
                  <CardContent>
                    <Table><TableHeader><TableRow><TableHead>Banka</TableHead><TableHead>Kart</TableHead><TableHead className="text-right">Borç</TableHead></TableRow></TableHeader>
                    <TableBody>{debtSummary.card_debts.map((d, i) => (
                      <TableRow key={i}><TableCell className="font-medium">{d.bank_name}</TableCell><TableCell>{d.card_name || "-"}</TableCell><TableCell className="text-right font-bold text-purple-500">{formatCurrency(d.debt, d.currency)}</TableCell></TableRow>
                    ))}</TableBody></Table>
                  </CardContent>
                </Card>
              )}

              {/* Kredi Borçları */}
              {debtSummary.loan_debts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Banknote className="w-4 h-4 text-orange-500" />Kredi Borçları</CardTitle></CardHeader>
                  <CardContent>
                    <Table><TableHeader><TableRow><TableHead>Banka</TableHead><TableHead>Kredi</TableHead><TableHead>Kalan Taksit</TableHead><TableHead className="text-right">Aylık</TableHead><TableHead className="text-right">Toplam Borç</TableHead></TableRow></TableHeader>
                    <TableBody>{debtSummary.loan_debts.map((d, i) => (
                      <TableRow key={i}><TableCell className="font-medium">{d.bank_name}</TableCell><TableCell>{d.loan_name || "-"}</TableCell><TableCell>{d.remaining_installments} taksit</TableCell><TableCell className="text-right">{formatCurrency(d.monthly_payment, d.currency)}</TableCell><TableCell className="text-right font-bold text-orange-500">{formatCurrency(d.debt, d.currency)}</TableCell></TableRow>
                    ))}</TableBody></Table>
                  </CardContent>
                </Card>
              )}

              {debtSummary.total_debt === 0 && (
                <Card className="text-center py-12"><CardContent><Check className="w-12 h-12 mx-auto text-green-500 mb-4" /><h3 className="text-lg font-medium text-green-500">Borç yok!</h3><p className="text-muted-foreground mt-1">Tüm hesaplar temiz</p></CardContent></Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Account Dialog */}
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}><DialogContent><DialogHeader><DialogTitle>{editingAccount ? "Hesap Düzenle" : "Yeni Banka Hesabı"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSaveAccount} className="space-y-4"><div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Firma *</Label><Select value={accountForm.company_id} onValueChange={(v) => setAccountForm({ ...accountForm, company_id: v })}><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Banka Adı *</Label><Input value={accountForm.bank_name} onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })} placeholder="Örn: Garanti BBVA" /></div>
          <div className="space-y-2"><Label>Hesap Adı</Label><Input value={accountForm.account_name} onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })} placeholder="Örn: Vadesiz TL" /></div>
          <div className="space-y-2"><Label>IBAN</Label><Input value={accountForm.iban} onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })} placeholder="TR..." /></div>
          <div className="space-y-2"><Label>Vadesiz Bakiye</Label><Input type="number" step="0.01" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })} /></div>
          <div className="space-y-2"><Label>Para Birimi</Label><Select value={accountForm.currency} onValueChange={(v) => setAccountForm({ ...accountForm, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
        </div><DialogFooter><Button type="button" variant="outline" onClick={() => setAccountDialog(false)}>İptal</Button><Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : editingAccount ? "Güncelle" : "Ekle"}</Button></DialogFooter></form>
      </DialogContent></Dialog>

      {/* KMH Dialog */}
      <Dialog open={kmhDialog} onOpenChange={setKmhDialog}><DialogContent><DialogHeader><DialogTitle>{editingKmh ? "KMH Düzenle" : "Yeni KMH Hesabı"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSaveKmh} className="space-y-4"><div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Firma *</Label><Select value={kmhForm.company_id} onValueChange={(v) => setKmhForm({ ...kmhForm, company_id: v })}><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Banka Adı *</Label><Input value={kmhForm.bank_name} onChange={(e) => setKmhForm({ ...kmhForm, bank_name: e.target.value })} placeholder="Örn: İş Bankası" /></div>
          <div className="space-y-2"><Label>Hesap Adı</Label><Input value={kmhForm.account_name} onChange={(e) => setKmhForm({ ...kmhForm, account_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Para Birimi</Label><Select value={kmhForm.currency} onValueChange={(v) => setKmhForm({ ...kmhForm, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Toplam Limit</Label><Input type="number" step="0.01" value={kmhForm.total_limit} onChange={(e) => setKmhForm({ ...kmhForm, total_limit: e.target.value })} /></div>
          <div className="space-y-2"><Label>Kullanılabilir Limit</Label><Input type="number" step="0.01" value={kmhForm.available_limit} onChange={(e) => setKmhForm({ ...kmhForm, available_limit: e.target.value })} /></div>
        </div><DialogFooter><Button type="button" variant="outline" onClick={() => setKmhDialog(false)}>İptal</Button><Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : editingKmh ? "Güncelle" : "Ekle"}</Button></DialogFooter></form>
      </DialogContent></Dialog>

      {/* Card Dialog */}
      <Dialog open={cardDialog} onOpenChange={setCardDialog}><DialogContent><DialogHeader><DialogTitle>{editingCard ? "Kart Düzenle" : "Yeni Kredi Kartı"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSaveCard} className="space-y-4"><div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Firma *</Label><Select value={cardForm.company_id} onValueChange={(v) => setCardForm({ ...cardForm, company_id: v })}><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Banka Adı *</Label><Input value={cardForm.bank_name} onChange={(e) => setCardForm({ ...cardForm, bank_name: e.target.value })} placeholder="Örn: Yapı Kredi" /></div>
          <div className="space-y-2"><Label>Kart Adı</Label><Input value={cardForm.card_name} onChange={(e) => setCardForm({ ...cardForm, card_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Son 4 Hane</Label><Input value={cardForm.last_four} onChange={(e) => setCardForm({ ...cardForm, last_four: e.target.value.replace(/\D/g, "").slice(0, 4) })} maxLength={4} /></div>
          <div className="space-y-2"><Label>Toplam Limit</Label><Input type="number" step="0.01" value={cardForm.total_limit} onChange={(e) => setCardForm({ ...cardForm, total_limit: e.target.value })} /></div>
          <div className="space-y-2"><Label>Kullanılabilir Limit</Label><Input type="number" step="0.01" value={cardForm.available_limit} onChange={(e) => setCardForm({ ...cardForm, available_limit: e.target.value })} /></div>
          <div className="space-y-2"><Label>Hesap Kesim Tarihi</Label><Input value={cardForm.cut_off_date} onChange={(e) => setCardForm({ ...cardForm, cut_off_date: e.target.value })} placeholder="Örn: Her ayın 15'i" /></div>
          <div className="space-y-2"><Label>Son Ödeme Tarihi</Label><Input value={cardForm.due_date} onChange={(e) => setCardForm({ ...cardForm, due_date: e.target.value })} placeholder="Örn: Her ayın 5'i" /></div>
          <div className="space-y-2"><Label>Para Birimi</Label><Select value={cardForm.currency} onValueChange={(v) => setCardForm({ ...cardForm, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
        </div><DialogFooter><Button type="button" variant="outline" onClick={() => setCardDialog(false)}>İptal</Button><Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : editingCard ? "Güncelle" : "Ekle"}</Button></DialogFooter></form>
      </DialogContent></Dialog>

      {/* Loan Dialog */}
      <Dialog open={loanDialog} onOpenChange={setLoanDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Yeni Kredi Ekle</DialogTitle></DialogHeader>
        <form onSubmit={handleSaveLoan} className="space-y-4"><div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Firma *</Label><Select value={loanForm.company_id} onValueChange={(v) => setLoanForm({ ...loanForm, company_id: v })}><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Banka Adı *</Label><Input value={loanForm.bank_name} onChange={(e) => setLoanForm({ ...loanForm, bank_name: e.target.value })} placeholder="Örn: Ziraat Bankası" /></div>
          <div className="space-y-2"><Label>Kredi Adı</Label><Input value={loanForm.loan_name} onChange={(e) => setLoanForm({ ...loanForm, loan_name: e.target.value })} placeholder="Örn: İhtiyaç Kredisi" /></div>
          <div className="space-y-2"><Label>Para Birimi</Label><Select value={loanForm.currency} onValueChange={(v) => setLoanForm({ ...loanForm, currency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Kredi Tutarı *</Label><Input type="number" step="0.01" value={loanForm.loan_amount} onChange={(e) => setLoanForm({ ...loanForm, loan_amount: e.target.value })} placeholder="100000" /></div>
          <div className="space-y-2"><Label>Faiz Oranı (%)</Label><Input type="number" step="0.01" value={loanForm.interest_rate} onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })} placeholder="2.49" /></div>
          <div className="space-y-2"><Label>Başlangıç Tarihi *</Label><Input type="date" value={loanForm.start_date} onChange={(e) => setLoanForm({ ...loanForm, start_date: e.target.value })} /></div>
          <div className="space-y-2"><Label>Vade (Ay) *</Label><Input type="number" value={loanForm.term_months} onChange={(e) => setLoanForm({ ...loanForm, term_months: e.target.value })} placeholder="36" /></div>
          <div className="space-y-2"><Label>Aylık Taksit *</Label><Input type="number" step="0.01" value={loanForm.monthly_payment} onChange={(e) => setLoanForm({ ...loanForm, monthly_payment: e.target.value })} placeholder="3500" /></div>
          <div className="space-y-2"><Label>Toplam Geri Ödeme</Label><Input type="number" step="0.01" value={loanForm.total_repayment} onChange={(e) => setLoanForm({ ...loanForm, total_repayment: e.target.value })} placeholder="Otomatik hesaplanır" /></div>
          <div className="space-y-2"><Label>Taksit Günü *</Label><Input type="number" min="1" max="28" value={loanForm.payment_day} onChange={(e) => setLoanForm({ ...loanForm, payment_day: e.target.value })} placeholder="1" /></div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border text-xs text-muted-foreground">Kredi eklendiğinde ilk taksit için otomatik hatırlatıcı oluşturulur. Taksit ödendikçe sonraki taksit hatırlatıcısı otomatik eklenir.</div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setLoanDialog(false)}>İptal</Button><Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kredi Ekle"}</Button></DialogFooter></form>
      </DialogContent></Dialog>

      {/* Loan Detail Dialog */}
      <Dialog open={loanDetailDialog} onOpenChange={setLoanDetailDialog}><DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        {loanDetail && (<>
          <DialogHeader><DialogTitle>{loanDetail.loan.bank_name} - {loanDetail.loan.loan_name || "Kredi"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 border"><p className="text-xs text-muted-foreground">Kredi Tutarı</p><p className="font-bold">{formatCurrency(loanDetail.loan.loan_amount)}</p></div>
            <div className="bg-muted/50 rounded-lg p-3 border"><p className="text-xs text-muted-foreground">Aylık Taksit</p><p className="font-bold text-red-500">{formatCurrency(loanDetail.loan.monthly_payment)}</p></div>
            <div className="bg-muted/50 rounded-lg p-3 border"><p className="text-xs text-muted-foreground">Toplam Geri Ödeme</p><p className="font-bold">{formatCurrency(loanDetail.loan.total_repayment)}</p></div>
            <div className="bg-muted/50 rounded-lg p-3 border"><p className="text-xs text-muted-foreground">Faiz Oranı</p><p className="font-bold">%{loanDetail.loan.interest_rate}</p></div>
          </div>
          <div className="mb-4"><ProgressBar paid={loanDetail.loan.paid_installments || 0} total={loanDetail.loan.term_months} /></div>
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => handlePayInstallment(loanDetail.loan.id)} disabled={loanDetail.installments.every(i => i.is_paid)} data-testid="pay-next-installment">
              <Check className="w-4 h-4 mr-2" />Sıradaki Taksiti Öde
            </Button>
          </div>
          <div className="data-table"><Table><TableHeader><TableRow>
            <TableHead>Taksit No</TableHead><TableHead>Vade Tarihi</TableHead><TableHead className="text-right">Tutar</TableHead><TableHead>Durum</TableHead><TableHead>Ödeme Tarihi</TableHead>
          </TableRow></TableHeader><TableBody>
            {loanDetail.installments.map((inst) => (
              <TableRow key={inst.id} className={inst.is_paid ? "opacity-60" : ""}>
                <TableCell className="font-medium">{inst.installment_no}/{loanDetail.loan.term_months}</TableCell>
                <TableCell>{formatDate(inst.due_date)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(inst.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={inst.is_paid ? "badge-success" : "badge-warning"}>
                    {inst.is_paid ? "Ödendi" : "Bekliyor"}
                  </Badge>
                </TableCell>
                <TableCell>{inst.paid_date ? formatDate(inst.paid_date) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></div>
        </>)}
      </DialogContent></Dialog>
    </div>
  );
}
