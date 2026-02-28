import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { formatDate } from "../lib/utils";

export default function CompaniesPage() {
  const { companies, addCompany, updateCompany, deleteCompany, selectCompany } = useCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tax_number: "",
    address: "",
    phone: "",
    email: ""
  });

  const resetForm = () => {
    setForm({ name: "", tax_number: "", address: "", phone: "", email: "" });
    setEditingCompany(null);
  };

  const openEditDialog = (company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      tax_number: company.tax_number || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Firma adı zorunludur");
      return;
    }
    setLoading(true);
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, form);
        toast.success("Firma güncellendi");
      } else {
        await addCompany(form);
        toast.success("Firma eklendi");
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`${company.name} firmasını silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await deleteCompany(company.id);
      toast.success("Firma silindi");
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  return (
    <div className="space-y-6" data-testid="companies-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Firmalar</h1>
          <p className="text-muted-foreground mt-1">Firma yönetimi ve bilgileri</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-company-btn">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Firma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Firma Düzenle" : "Yeni Firma Ekle"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Firma Adı *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Firma adını girin"
                  data-testid="company-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_number">Vergi Numarası</Label>
                <Input
                  id="tax_number"
                  value={form.tax_number}
                  onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                  placeholder="Vergi numarası"
                  data-testid="company-tax-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Firma adresi"
                  data-testid="company-address-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Telefon"
                    data-testid="company-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="E-posta"
                    data-testid="company-email-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={loading} data-testid="company-submit-btn">
                  {loading ? "Kaydediliyor..." : editingCompany ? "Güncelle" : "Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Henüz firma eklenmemiş</h3>
            <p className="text-muted-foreground mt-1">Başlamak için yeni bir firma ekleyin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="stat-card" data-testid={`company-card-${company.id}`}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    {company.tax_number && (
                      <p className="text-xs text-muted-foreground">VN: {company.tax_number}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.address && (
                  <p className="text-sm text-muted-foreground">{company.address}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {company.phone && <span>{company.phone}</span>}
                  {company.email && <span>{company.email}</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Oluşturulma: {formatDate(company.created_at)}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => selectCompany(company)}
                    data-testid={`select-company-${company.id}`}
                  >
                    Seç
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(company)}
                    data-testid={`edit-company-${company.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(company)}
                    data-testid={`delete-company-${company.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
