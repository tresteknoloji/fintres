# FinTres Pro - Kurulum Rehberi (Ubuntu 22.04)

## Gereksinimler

- Ubuntu 22.04 LTS
- Minimum 1 GB RAM, 10 GB disk
- Root veya sudo yetkisi

---

## 1. Sistem Güncellemesi

```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Node.js 20 Kurulumu

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # v20.x olmalı
```

## 3. Yarn Kurulumu

```bash
sudo npm install -g yarn
```

## 4. Python 3.10+ Kurulumu

Ubuntu 22.04'te Python 3.10 varsayılan olarak gelir.

```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version  # 3.10+ olmalı
```

## 5. MongoDB Kurulumu

```bash
# GPG key ve repo ekle
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Kur ve başlat
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Kontrol
mongosh --eval "db.runCommand({ping:1})"
```

## 6. Proje Dosyalarını Sunucuya Kopyalama

GitHub'dan klonlayın veya dosyaları SCP/SFTP ile aktarın:

```bash
cd /opt
git clone <repo-url> fintres-pro
cd fintres-pro
```

---

## 7. Backend Kurulumu

```bash
cd /opt/fintres-pro/backend

# Virtual environment oluştur
python3 -m venv venv
source venv/bin/activate

# Bağımlılıkları kur
pip install -r requirements.txt
```

### Backend .env Dosyası

```bash
nano /opt/fintres-pro/backend/.env
```

İçeriği:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=fintres_pro
JWT_SECRET=buraya-guclu-bir-anahtar-yazin-en-az-32-karakter
ADMIN_EMAIL=admin@sirketiniz.com
ADMIN_PASSWORD=GucluBirSifre123!
ADMIN_NAME=Admin
FRONTEND_URL=https://sizin-domain.com
```

> **Not:** `JWT_SECRET` en az 32 karakter olmalı. `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ilk açılışta otomatik admin hesabı oluşturur.

### Backend Test

```bash
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
# Başka terminalde:
curl http://localhost:8001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@sirketiniz.com","password":"GucluBirSifre123!"}'
# Token dönüyorsa çalışıyor. Ctrl+C ile durdurun.
```

---

## 8. Frontend Kurulumu

```bash
cd /opt/fintres-pro/frontend

# Bağımlılıkları kur
yarn install
```

### Frontend .env Dosyası

```bash
nano /opt/fintres-pro/frontend/.env
```

İçeriği:

```
REACT_APP_BACKEND_URL=https://sizin-domain.com
```

> Eğer IP ile erişecekseniz: `REACT_APP_BACKEND_URL=http://SUNUCU_IP`

### Production Build

```bash
yarn build
```

Bu komut `build/` klasörü oluşturur. Nginx bu klasörü servis edecek.

---

## 9. Nginx Kurulumu (Reverse Proxy)

```bash
sudo apt install -y nginx
```

### Nginx Yapılandırması

```bash
sudo nano /etc/nginx/sites-available/fintres-pro
```

İçeriği:

```nginx
server {
    listen 80;
    server_name sizin-domain.com;  # veya sunucu IP adresi

    # Frontend (React build)
    root /opt/fintres-pro/frontend/build;
    index index.html;

    # React Router desteği
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifleştir:

```bash
sudo ln -s /etc/nginx/sites-available/fintres-pro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 10. Backend Servis Olarak Çalıştırma (systemd)

```bash
sudo nano /etc/systemd/system/fintres-backend.service
```

İçeriği:

```ini
[Unit]
Description=FinTres Pro Backend
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/fintres-pro/backend
Environment=PATH=/opt/fintres-pro/backend/venv/bin:/usr/bin
ExecStart=/opt/fintres-pro/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Başlat:

```bash
sudo systemctl daemon-reload
sudo systemctl start fintres-backend
sudo systemctl enable fintres-backend

# Kontrol
sudo systemctl status fintres-backend
```

---

## 11. SSL Sertifikası (Opsiyonel ama Önerilir)

Domain adınız varsa Let's Encrypt ile ücretsiz SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d sizin-domain.com
```

SSL sonrası `frontend/.env` dosyasını güncellemeyi unutmayın:

```
REACT_APP_BACKEND_URL=https://sizin-domain.com
```

Ardından frontend'i tekrar build edin:

```bash
cd /opt/fintres-pro/frontend && yarn build
```

---

## 12. Güvenlik Duvarı

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## Özet - Çalışan Servisler

| Servis | Port | Açıklama |
|--------|------|----------|
| MongoDB | 27017 | Veritabanı |
| Backend (FastAPI) | 8001 | API sunucusu |
| Nginx | 80/443 | Frontend + API proxy |

---

## Yararlı Komutlar

```bash
# Backend logları
sudo journalctl -u fintres-backend -f

# Backend yeniden başlat
sudo systemctl restart fintres-backend

# Nginx yeniden başlat
sudo systemctl restart nginx

# MongoDB durumu
sudo systemctl status mongod
```

---

## İlk Giriş

Tarayıcıdan `http://SUNUCU_IP` veya `https://sizin-domain.com` adresine gidin.

- **E-posta:** .env dosyasında belirlediğiniz `ADMIN_EMAIL`
- **Şifre:** .env dosyasında belirlediğiniz `ADMIN_PASSWORD`
