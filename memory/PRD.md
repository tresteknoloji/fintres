# FinTrack Pro - PRD (Product Requirements Document)

## Proje Özeti
**Proje Adı:** FinTrack Pro - Çoklu Firma Finans Yönetimi  
**Oluşturma Tarihi:** 28 Şubat 2026  
**Durum:** MVP Tamamlandı

## Orijinal Problem Statement
Muhasebe/ön muhasebe yazılımı. Gelirler, Giderler, personeller, Maaşlar, Banka kart kredi kira vs. ödeme hatırlatmaları. 2 Firma var (Tres Teknoloji A.Ş., Netlen İnternet Hizmetleri Ltd. Şti.) ortak panelden takip edilecek ve sonradan firma eklenebilecek.

## Kullanıcı Tercihleri
- Çoklu kullanıcı yönetimi (admin/user rolleri)
- Çoklu para birimi desteği (TRY, USD, EUR)
- Detaylı raporlama (grafikler, aylık/yıllık karşılaştırma)
- Ödeme hatırlatıcıları (sistemde görünsün, SMTP altyapısı hazır)
- Fatura/belge yükleme şimdilik yok

## Kullanıcı Personaları
1. **İşletme Sahibi:** Birden fazla firmanın finansal durumunu takip eden
2. **Muhasebeci:** Gelir/gider kayıtlarını giren ve raporlayan
3. **Yönetici:** Kullanıcıları ve firmaları yöneten

## Mimari
- **Frontend:** React 19 + Shadcn UI + TailwindCSS + Recharts
- **Backend:** FastAPI + MongoDB
- **Authentication:** JWT tabanlı kimlik doğrulama

## Tamamlanan Özellikler

### ✅ MVP (28 Şubat 2026)
1. **Kimlik Doğrulama**
   - Kullanıcı kaydı ve girişi
   - JWT tabanlı oturum yönetimi
   - Rol bazlı erişim (admin/user)

2. **Firma Yönetimi**
   - Firma ekleme/düzenleme/silme
   - Firma değiştirici (sidebar'da)
   - Tüm firmalar görünümü

3. **Gelir Yönetimi**
   - Gelir kayıtları CRUD
   - Kategoriler (Satış, Hizmet, Faiz vb.)
   - Çoklu para birimi desteği

4. **Gider Yönetimi**
   - Gider kayıtları CRUD
   - Kategoriler (Kira, Elektrik, Maaş vb.)
   - Ödeme türleri (Nakit, Banka, Kredi Kartı vb.)

5. **Personel Yönetimi**
   - Personel kayıtları CRUD
   - Maaş bilgileri
   - Maaş ödemesi kaydı

6. **Ödeme Hatırlatıcıları**
   - Hatırlatıcı ekleme/düzenleme/silme
   - Vade tarihi takibi
   - Ödendi işaretleme
   - Tekrarlayan ödemeler

7. **Dashboard**
   - Toplam gelir/gider/net bakiye
   - Aylık gelir/gider grafiği (Bar Chart)
   - Gider dağılımı (Pie Chart)

8. **Raporlar**
   - Genel bakış grafikleri
   - Trend analizi (kümülatif)
   - Kategori dağılımı detayları

9. **Ayarlar**
   - Profil bilgileri görüntüleme
   - Kullanıcı yönetimi (admin)
   - SMTP ayarları altyapısı (hazır, devre dışı)

## Öncelikli Backlog

### P0 (Kritik) - Yok
Tüm temel özellikler tamamlandı.

### P1 (Yüksek Öncelik)
- [ ] SMTP entegrasyonu ile e-posta bildirimleri
- [ ] Veri dışa aktarma (Excel/PDF)
- [ ] Gelişmiş filtreleme ve arama

### P2 (Orta Öncelik)
- [ ] Fatura/belge yükleme
- [ ] Banka hesapları modülü
- [ ] Kredi takibi modülü
- [ ] Kullanıcı profil düzenleme

### P3 (Düşük Öncelik)
- [ ] Dark/Light tema geçişi
- [ ] Mobil uygulama
- [ ] API entegrasyonları (banka)

## Sonraki Adımlar
1. E-posta bildirimleri için SMTP yapılandırması
2. Veri dışa aktarma özelliği (Excel raporları)
3. Gelişmiş arama ve filtreleme

## Teknik Notlar
- Backend API prefix: `/api`
- MongoDB koleksiyonları: users, companies, incomes, expenses, personnel, salaries, reminders
- JWT token süresi: 24 saat
