from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'fintres-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="FinTres Pro API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"

class UserInvite(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "user"
    company_ids: List[str] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SetPasswordRequest(BaseModel):
    token: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    company_ids: Optional[List[str]] = None
    status: Optional[str] = None
    created_at: str

class CompanyCreate(BaseModel):
    name: str
    tax_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CompanyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    tax_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: str
    created_by: str

class IncomeCreate(BaseModel):
    company_id: str
    description: str
    amount: float
    currency: str = "TRY"
    category: str
    date: str
    notes: Optional[str] = None

class IncomeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_id: str
    description: str
    amount: float
    currency: str
    category: str
    date: str
    notes: Optional[str] = None
    created_at: str

class ExpenseCreate(BaseModel):
    company_id: str
    description: str
    amount: float
    currency: str = "TRY"
    category: str
    payment_type: str
    date: str
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_id: str
    description: str
    amount: float
    currency: str
    category: str
    payment_type: str
    date: str
    notes: Optional[str] = None
    created_at: str

class PersonnelCreate(BaseModel):
    company_id: str
    name: str
    position: str
    email: Optional[str] = None
    phone: Optional[str] = None
    salary: float
    currency: str = "TRY"
    start_date: str
    end_date: Optional[str] = None
    status: str = "active"  # active, inactive, terminated

class PersonnelResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_id: str
    name: str
    position: str
    email: Optional[str] = None
    phone: Optional[str] = None
    salary: float
    currency: str
    start_date: str
    end_date: Optional[str] = None
    status: str = "active"
    created_at: str

class AdvanceCreate(BaseModel):
    personnel_id: str
    company_id: str
    amount: float
    currency: str = "TRY"
    date: str
    reason: Optional[str] = None
    is_paid_back: bool = False
    paid_back_date: Optional[str] = None

class AdvanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    personnel_id: str
    company_id: str
    amount: float
    currency: str
    date: str
    reason: Optional[str] = None
    is_paid_back: bool
    paid_back_date: Optional[str] = None
    created_at: str

class SalaryPaymentCreate(BaseModel):
    personnel_id: str
    company_id: str
    amount: float
    currency: str = "TRY"
    period: str
    payment_date: str
    notes: Optional[str] = None

class SalaryPaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    personnel_id: str
    company_id: str
    amount: float
    currency: str
    period: str
    payment_date: str
    notes: Optional[str] = None
    created_at: str

# ============ RECURRING (BUDGET) MODELS ============

class RecurringItemCreate(BaseModel):
    company_id: str
    name: str
    amount: float
    currency: str = "TRY"
    category: str
    item_type: str  # "income" or "expense"
    frequency: str = "monthly"  # monthly, yearly
    is_active: bool = True
    notes: Optional[str] = None

class RecurringItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_id: str
    name: str
    amount: float
    currency: str
    category: str
    item_type: str
    frequency: str
    is_active: bool
    notes: Optional[str] = None
    created_at: str

class ReminderCreate(BaseModel):
    company_id: str
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "TRY"
    due_date: str
    category: str
    is_recurring: bool = False
    recurring_period: Optional[str] = None

class ReminderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_id: str
    title: str
    description: Optional[str] = None
    amount: float
    currency: str
    due_date: str
    category: str
    is_recurring: bool
    recurring_period: Optional[str] = None
    is_paid: bool
    created_at: str

# ============ SMTP SETTINGS MODEL ============

# ============ BANK ACCOUNT & CREDIT CARD MODELS ============

class BankAccountCreate(BaseModel):
    company_id: str
    bank_name: str
    account_name: Optional[str] = None
    iban: Optional[str] = None
    currency: str = "TRY"
    balance: float = 0
    kmh_limit: float = 0
    notes: Optional[str] = None

class BankAccountResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_id: str
    bank_name: str
    account_name: Optional[str] = None
    iban: Optional[str] = None
    currency: str
    balance: float
    kmh_limit: float
    notes: Optional[str] = None
    created_at: str

class CreditCardCreate(BaseModel):
    company_id: str
    bank_name: str
    card_name: Optional[str] = None
    last_four: Optional[str] = None
    currency: str = "TRY"
    total_limit: float = 0
    available_limit: float = 0
    cut_off_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class CreditCardResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_id: str
    bank_name: str
    card_name: Optional[str] = None
    last_four: Optional[str] = None
    currency: str
    total_limit: float
    available_limit: float
    cut_off_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

class SMTPSettingsCreate(BaseModel):
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    smtp_security: str = "starttls"  # "ssl", "starttls", "none"
    sender_name: str
    sender_email: str
    notify_email: str
    is_active: bool = True

class SMTPSettingsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_security: Optional[str] = "starttls"
    sender_name: str
    sender_email: str
    notify_email: str
    is_active: bool
    updated_at: str

# ============ REMINDER SETTINGS MODEL ============

class ReminderSettingsCreate(BaseModel):
    days_before: int = 7
    send_on_due_date: bool = True
    is_scheduler_active: bool = True

class ReminderSettingsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    days_before: int
    send_on_due_date: bool
    is_scheduler_active: bool
    updated_at: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

# ============ EMAIL FUNCTIONS ============

def format_currency(amount, currency="TRY"):
    symbols = {"TRY": "₺", "USD": "$", "EUR": "€"}
    symbol = symbols.get(currency, currency)
    formatted = f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{symbol} {formatted}"

def get_email_template(title: str, content: str, footer_text: str = ""):
    default_footer = "Bu e-posta FinTres Pro tarafından otomatik olarak gönderilmiştir."
    footer = footer_text if footer_text else default_footer
    return f'''<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="padding: 32px 40px; background-color: #1e293b; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">FinTres Pro</h1>
                            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Finans Y&#246;netim Sistemi</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 24px 0; color: #1e293b; font-size: 20px; font-weight: 600;">{title}</h2>
                            {content}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                                {footer}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'''

def get_reminder_email_content(reminders: list, companies: dict):
    rows = ""
    for r in reminders:
        company_name = companies.get(r["company_id"], "Bilinmeyen Firma")
        due_date = r["due_date"][:10] if r.get("due_date") else "-"
        amount = format_currency(r["amount"], r.get("currency", "TRY"))
        
        rows += f'''
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px;">{r["title"]}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">{company_name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px;">{due_date}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">{amount}</td>
        </tr>'''
    
    content = f'''
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        A&#351;a&#287;&#305;da yakla&#351;makta olan veya vadesi ge&#231;mi&#351; &#246;deme hat&#305;rlat&#305;c&#305;lar&#305;n&#305;z listelenmistir.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
            <tr style="background-color: #f8fafc;">
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">&#214;deme</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Firma</th>
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Vade Tarihi</th>
                <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Tutar</th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
    </table>
    <p style="margin: 0; color: #64748b; font-size: 13px;">
        L&#252;tfen &#246;demelerin zaman&#305;nda yap&#305;ld&#305;&#287;&#305;ndan emin olun.
    </p>'''
    
    return content

def _build_reminder_table(reminders: list, companies: dict, header_color: str, header_bg: str):
    if not reminders:
        return ""
    rows = ""
    for r in reminders:
        company_name = companies.get(r["company_id"], "Bilinmeyen Firma")
        due_date = r["due_date"][:10] if r.get("due_date") else "-"
        amount = format_currency(r["amount"], r.get("currency", "TRY"))
        rows += f'''
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px;">{r["title"]}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">{company_name}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px;">{due_date}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: {header_color}; font-size: 14px; font-weight: 600; text-align: right;">{amount}</td>
        </tr>'''
    return f'''
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
            <tr style="background-color: {header_bg};">
                <th style="padding: 10px 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">&#214;deme</th>
                <th style="padding: 10px 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Firma</th>
                <th style="padding: 10px 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Vade Tarihi</th>
                <th style="padding: 10px 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Tutar</th>
            </tr>
        </thead>
        <tbody>{rows}</tbody>
    </table>'''

def get_reminder_email_content_grouped(today: list, overdue: list, upcoming: list, companies: dict):
    content = '''<p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        A&#351;a&#287;&#305;da &#246;deme hat&#305;rlat&#305;c&#305;lar&#305;n&#305;z listelenmistir.
    </p>'''
    
    if overdue:
        content += f'''<h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 16px; font-weight: 600; border-left: 4px solid #dc2626; padding-left: 12px;">
            Vadesi Ge&#231;mi&#351; ({len(overdue)} &#246;deme)
        </h3>'''
        content += _build_reminder_table(overdue, companies, "#dc2626", "#fef2f2")
    
    if today:
        content += f'''<h3 style="margin: 0 0 12px 0; color: #ea580c; font-size: 16px; font-weight: 600; border-left: 4px solid #ea580c; padding-left: 12px;">
            Bug&#252;n Vadesi Dolan ({len(today)} &#246;deme)
        </h3>'''
        content += _build_reminder_table(today, companies, "#ea580c", "#fff7ed")
    
    if upcoming:
        content += f'''<h3 style="margin: 0 0 12px 0; color: #2563eb; font-size: 16px; font-weight: 600; border-left: 4px solid #2563eb; padding-left: 12px;">
            Yakla&#351;an &#214;demeler ({len(upcoming)} &#246;deme)
        </h3>'''
        content += _build_reminder_table(upcoming, companies, "#2563eb", "#eff6ff")
    
    content += '''<p style="margin: 16px 0 0 0; color: #64748b; font-size: 13px;">
        L&#252;tfen &#246;demelerin zaman&#305;nda yap&#305;ld&#305;&#287;&#305;ndan emin olun.
    </p>'''
    
    return content

async def send_email(to_email: str, subject: str, html_content: str):
    """SMTP ayarlarını kullanarak e-posta gönder (background-safe)"""
    settings = await db.smtp_settings.find_one({"is_active": True}, {"_id": 0})
    if not settings:
        logger.warning("SMTP ayarları bulunamadı veya aktif değil")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{settings['sender_name']} <{settings['sender_email']}>"
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Senkron SMTP işlemini thread pool'da çalıştır (ana event loop'u bloklamaz)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send_smtp, settings, to_email, msg)
        
        logger.info(f"E-posta gönderildi: {to_email}")
        return True
    except Exception as e:
        logger.error(f"E-posta gönderme hatası: {str(e)}")
        return False

def _send_smtp(settings: dict, to_email: str, msg):
    """Senkron SMTP gönderimi (thread pool içinde çalışır)"""
    security = settings.get('smtp_security', 'starttls')
    host = settings['smtp_host']
    port = settings['smtp_port']
    
    if security == 'ssl':
        with smtplib.SMTP_SSL(host, port, timeout=15) as server:
            server.login(settings['smtp_user'], settings['smtp_password'])
            server.sendmail(settings['sender_email'], to_email, msg.as_string())
    elif security == 'starttls':
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            server.login(settings['smtp_user'], settings['smtp_password'])
            server.sendmail(settings['sender_email'], to_email, msg.as_string())
    else:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.login(settings['smtp_user'], settings['smtp_password'])
            server.sendmail(settings['sender_email'], to_email, msg.as_string())

async def send_reminder_notifications():
    """Yaklaşan ödemeleri e-posta ile bildir"""
    settings = await db.smtp_settings.find_one({"is_active": True}, {"_id": 0})
    if not settings:
        return
    
    # Hatırlatma ayarlarını al
    reminder_config = await db.reminder_settings.find_one({}, {"_id": 0})
    days_before = reminder_config.get("days_before", 7) if reminder_config else 7
    send_on_due_date = reminder_config.get("send_on_due_date", True) if reminder_config else True
    
    # UTC+3 (Turkiye saati) ile bugunu hesapla
    tr_now = datetime.now(timezone.utc) + timedelta(hours=3)
    today = tr_now.strftime("%Y-%m-%d")
    future_date = (tr_now + timedelta(days=days_before)).strftime("%Y-%m-%d")
    
    # Yaklaşan ödemeleri al (days_before gün içindeki + gecikmiş)
    reminders = await db.reminders.find({
        "is_paid": False,
        "due_date": {"$lte": future_date}
    }, {"_id": 0}).to_list(100)
    
    if not reminders:
        return
    
    # Bugünkü ve yaklaşan olarak grupla
    today_reminders = [r for r in reminders if r.get("due_date", "")[:10] == today]
    overdue_reminders = [r for r in reminders if r.get("due_date", "")[:10] < today]
    upcoming_reminders = [r for r in reminders if r.get("due_date", "")[:10] > today]
    
    # Firma isimlerini al
    company_ids = list(set(r["company_id"] for r in reminders))
    companies_list = await db.companies.find({"id": {"$in": company_ids}}, {"_id": 0}).to_list(100)
    companies = {c["id"]: c["name"] for c in companies_list}
    
    # E-posta içeriği oluştur
    content = get_reminder_email_content_grouped(today_reminders, overdue_reminders, upcoming_reminders, companies)
    html = get_email_template("Ödeme Hatırlatıcısı", content)
    
    subject_parts = []
    if overdue_reminders:
        subject_parts.append(f"{len(overdue_reminders)} Gecikmiş")
    if today_reminders:
        subject_parts.append(f"{len(today_reminders)} Bugünkü")
    if upcoming_reminders:
        subject_parts.append(f"{len(upcoming_reminders)} Yaklaşan")
    
    subject = f"FinTres Pro - {', '.join(subject_parts)} Ödeme"
    
    await send_email(settings['notify_email'], subject, html)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate, current_user: dict = Depends(get_current_user)):
    """Sadece admin yeni kullanıcı ekleyebilir"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin kullanıcı ekleyebilir")
    
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "role": user.role,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    return {
        "message": "Kullanıcı oluşturuldu",
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"]
        }
    }

@api_router.post("/auth/invite", response_model=dict)
async def invite_user(invite: UserInvite, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Admin kullanıcı davet eder, davet e-postası gönderilir"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin kullanıcı davet edebilir")
    
    existing = await db.users.find_one({"email": invite.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    
    invite_token = str(uuid.uuid4())
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": invite.email,
        "password": "",
        "name": invite.name,
        "phone": invite.phone or "",
        "role": invite.role,
        "company_ids": invite.company_ids,
        "status": "pending",
        "invite_token": invite_token,
        "invite_expires": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Davet e-postası gönder
    background_tasks.add_task(send_invite_email, invite.email, invite.name, invite_token)
    
    return {
        "message": "Davet gönderildi",
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"],
            "status": "pending"
        }
    }

@api_router.get("/auth/invite-info")
async def get_invite_info(token: str):
    """Token ile davet bilgilerini getir (public endpoint)"""
    user = await db.users.find_one({"invite_token": token}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Geçersiz davet bağlantısı")
    
    if user.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Bu davet zaten kullanılmış")
    
    expires = user.get("invite_expires", "")
    if expires and datetime.fromisoformat(expires) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Davet süresi dolmuş")
    
    return {
        "name": user["name"],
        "email": user["email"]
    }

@api_router.post("/auth/set-password")
async def set_password(req: SetPasswordRequest):
    """Davet edilen kullanıcı şifresini oluşturur (public endpoint)"""
    user = await db.users.find_one({"invite_token": req.token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Geçersiz davet bağlantısı")
    
    if user.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Bu davet zaten kullanılmış")
    
    expires = user.get("invite_expires", "")
    if expires and datetime.fromisoformat(expires) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Davet süresi dolmuş")
    
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")
    
    await db.users.update_one(
        {"invite_token": req.token},
        {"$set": {
            "password": hash_password(req.password),
            "status": "active",
            "invite_token": None,
            "invite_expires": None
        }}
    )
    
    return {"message": "Şifreniz oluşturuldu. Artık giriş yapabilirsiniz."}

async def send_invite_email(email: str, name: str, token: str):
    """Davet e-postası gönder"""
    frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', ''))
    invite_link = f"{frontend_url}/set-password?token={token}"
    
    content = f'''
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Merhaba <strong>{name}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        FinTres Pro sistemine davet edildiniz. Hesab&#305;n&#305;z&#305; aktifle&#351;tirmek i&#231;in a&#351;a&#287;&#305;daki butona t&#305;klayarak &#351;ifrenizi olu&#351;turun.
    </p>
    <table role="presentation" style="margin: 0 auto 24px auto;">
        <tr>
            <td style="background-color: #6366f1; border-radius: 8px;">
                <a href="{invite_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;">
                    &#350;ifremi Olu&#351;tur
                </a>
            </td>
        </tr>
    </table>
    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
        Veya bu ba&#287;lant&#305;y&#305; taray&#305;c&#305;n&#305;za yap&#305;&#351;t&#305;r&#305;n:
    </p>
    <p style="margin: 0 0 24px 0; color: #6366f1; font-size: 13px; word-break: break-all;">
        {invite_link}
    </p>
    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        Bu ba&#287;lant&#305; 7 g&#252;n ge&#231;erlidir.
    </p>
    '''
    html = get_email_template("FinTres Pro Davet", content)
    await send_email(email, "FinTres Pro - Hesap Daveti", html)

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya şifre")
    
    if user.get("status") == "pending":
        raise HTTPException(status_code=401, detail="Hesabınız henüz aktif değil. Lütfen davet e-postanızdaki bağlantıya tıklayarak şifrenizi oluşturun.")
    
    if not user.get("password") or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya şifre")
    
    token = create_token(user["id"], user["email"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        phone=current_user.get("phone"),
        company_ids=current_user.get("company_ids"),
        status=current_user.get("status", "active"),
        created_at=current_user["created_at"]
    )

# ============ USERS ROUTES ============

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return {"message": "Kullanıcı silindi"}

# ============ COMPANY ROUTES ============

@api_router.post("/companies", response_model=CompanyResponse)
async def create_company(company: CompanyCreate, current_user: dict = Depends(get_current_user)):
    company_doc = {
        "id": str(uuid.uuid4()),
        **company.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    await db.companies.insert_one(company_doc)
    return CompanyResponse(**{k: v for k, v in company_doc.items() if k != "_id"})

@api_router.get("/companies", response_model=List[CompanyResponse])
async def get_companies(current_user: dict = Depends(get_current_user)):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    return [CompanyResponse(**c) for c in companies]

@api_router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str, current_user: dict = Depends(get_current_user)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    return CompanyResponse(**company)

@api_router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, company: CompanyCreate, current_user: dict = Depends(get_current_user)):
    result = await db.companies.update_one(
        {"id": company_id},
        {"$set": company.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    return CompanyResponse(**updated)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    return {"message": "Firma silindi"}

# ============ INCOME ROUTES ============

@api_router.post("/incomes", response_model=IncomeResponse)
async def create_income(income: IncomeCreate, current_user: dict = Depends(get_current_user)):
    income_doc = {
        "id": str(uuid.uuid4()),
        **income.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.incomes.insert_one(income_doc)
    return IncomeResponse(**{k: v for k, v in income_doc.items() if k != "_id"})

@api_router.get("/incomes", response_model=List[IncomeResponse])
async def get_incomes(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    incomes = await db.incomes.find(query, {"_id": 0}).to_list(1000)
    return [IncomeResponse(**i) for i in incomes]

@api_router.put("/incomes/{income_id}", response_model=IncomeResponse)
async def update_income(income_id: str, income: IncomeCreate, current_user: dict = Depends(get_current_user)):
    result = await db.incomes.update_one({"id": income_id}, {"$set": income.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gelir bulunamadı")
    updated = await db.incomes.find_one({"id": income_id}, {"_id": 0})
    return IncomeResponse(**updated)

@api_router.delete("/incomes/{income_id}")
async def delete_income(income_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.incomes.delete_one({"id": income_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gelir bulunamadı")
    return {"message": "Gelir silindi"}

# ============ EXPENSE ROUTES ============

@api_router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    expense_doc = {
        "id": str(uuid.uuid4()),
        **expense.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.expenses.insert_one(expense_doc)
    return ExpenseResponse(**{k: v for k, v in expense_doc.items() if k != "_id"})

@api_router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    expenses = await db.expenses.find(query, {"_id": 0}).to_list(1000)
    return [ExpenseResponse(**e) for e in expenses]

@api_router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, expense: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    result = await db.expenses.update_one({"id": expense_id}, {"$set": expense.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gider bulunamadı")
    updated = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return ExpenseResponse(**updated)

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gider bulunamadı")
    return {"message": "Gider silindi"}

# ============ PERSONNEL ROUTES ============

@api_router.post("/personnel", response_model=PersonnelResponse)
async def create_personnel(personnel: PersonnelCreate, current_user: dict = Depends(get_current_user)):
    personnel_doc = {
        "id": str(uuid.uuid4()),
        **personnel.model_dump(),
        "status": personnel.status or "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.personnel.insert_one(personnel_doc)
    return PersonnelResponse(**{k: v for k, v in personnel_doc.items() if k != "_id"})

@api_router.get("/personnel", response_model=List[PersonnelResponse])
async def get_personnel(company_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if company_id:
        query["company_id"] = company_id
    if status:
        query["status"] = status
    personnel = await db.personnel.find(query, {"_id": 0}).to_list(1000)
    # Add default status for old records
    for p in personnel:
        if "status" not in p:
            p["status"] = "active"
    return [PersonnelResponse(**p) for p in personnel]

@api_router.put("/personnel/{personnel_id}", response_model=PersonnelResponse)
async def update_personnel(personnel_id: str, personnel: PersonnelCreate, current_user: dict = Depends(get_current_user)):
    result = await db.personnel.update_one({"id": personnel_id}, {"$set": personnel.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    updated = await db.personnel.find_one({"id": personnel_id}, {"_id": 0})
    if "status" not in updated:
        updated["status"] = "active"
    return PersonnelResponse(**updated)

@api_router.put("/personnel/{personnel_id}/terminate")
async def terminate_personnel(personnel_id: str, end_date: str, current_user: dict = Depends(get_current_user)):
    result = await db.personnel.update_one(
        {"id": personnel_id}, 
        {"$set": {"status": "terminated", "end_date": end_date}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return {"message": "Personel işten ayrıldı olarak işaretlendi"}

@api_router.delete("/personnel/{personnel_id}")
async def delete_personnel(personnel_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.personnel.delete_one({"id": personnel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return {"message": "Personel silindi"}

# ============ ADVANCE ROUTES ============

@api_router.post("/advances", response_model=AdvanceResponse)
async def create_advance(advance: AdvanceCreate, current_user: dict = Depends(get_current_user)):
    advance_doc = {
        "id": str(uuid.uuid4()),
        **advance.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.advances.insert_one(advance_doc)
    return AdvanceResponse(**{k: v for k, v in advance_doc.items() if k != "_id"})

@api_router.get("/advances", response_model=List[AdvanceResponse])
async def get_advances(company_id: Optional[str] = None, personnel_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if company_id:
        query["company_id"] = company_id
    if personnel_id:
        query["personnel_id"] = personnel_id
    advances = await db.advances.find(query, {"_id": 0}).to_list(1000)
    return [AdvanceResponse(**a) for a in advances]

@api_router.put("/advances/{advance_id}", response_model=AdvanceResponse)
async def update_advance(advance_id: str, advance: AdvanceCreate, current_user: dict = Depends(get_current_user)):
    result = await db.advances.update_one({"id": advance_id}, {"$set": advance.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Avans bulunamadı")
    updated = await db.advances.find_one({"id": advance_id}, {"_id": 0})
    return AdvanceResponse(**updated)

@api_router.put("/advances/{advance_id}/payback")
async def mark_advance_paid_back(advance_id: str, paid_back_date: str, current_user: dict = Depends(get_current_user)):
    result = await db.advances.update_one(
        {"id": advance_id}, 
        {"$set": {"is_paid_back": True, "paid_back_date": paid_back_date}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Avans bulunamadı")
    return {"message": "Avans geri ödendi olarak işaretlendi"}

@api_router.delete("/advances/{advance_id}")
async def delete_advance(advance_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.advances.delete_one({"id": advance_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Avans bulunamadı")
    return {"message": "Avans silindi"}

# ============ SALARY PAYMENT ROUTES ============

@api_router.post("/salaries", response_model=SalaryPaymentResponse)
async def create_salary_payment(salary: SalaryPaymentCreate, current_user: dict = Depends(get_current_user)):
    salary_doc = {
        "id": str(uuid.uuid4()),
        **salary.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.salaries.insert_one(salary_doc)
    return SalaryPaymentResponse(**{k: v for k, v in salary_doc.items() if k != "_id"})

@api_router.get("/salaries", response_model=List[SalaryPaymentResponse])
async def get_salaries(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    salaries = await db.salaries.find(query, {"_id": 0}).to_list(1000)
    return [SalaryPaymentResponse(**s) for s in salaries]

# ============ RECURRING ITEMS (BUDGET) ROUTES ============

@api_router.post("/recurring", response_model=RecurringItemResponse)
async def create_recurring_item(item: RecurringItemCreate, current_user: dict = Depends(get_current_user)):
    item_doc = {
        "id": str(uuid.uuid4()),
        **item.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recurring_items.insert_one(item_doc)
    return RecurringItemResponse(**{k: v for k, v in item_doc.items() if k != "_id"})

@api_router.get("/recurring", response_model=List[RecurringItemResponse])
async def get_recurring_items(company_id: Optional[str] = None, item_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if company_id:
        query["company_id"] = company_id
    if item_type:
        query["item_type"] = item_type
    items = await db.recurring_items.find(query, {"_id": 0}).to_list(1000)
    return [RecurringItemResponse(**i) for i in items]

@api_router.put("/recurring/{item_id}", response_model=RecurringItemResponse)
async def update_recurring_item(item_id: str, item: RecurringItemCreate, current_user: dict = Depends(get_current_user)):
    result = await db.recurring_items.update_one({"id": item_id}, {"$set": item.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    updated = await db.recurring_items.find_one({"id": item_id}, {"_id": 0})
    return RecurringItemResponse(**updated)

@api_router.delete("/recurring/{item_id}")
async def delete_recurring_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.recurring_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    return {"message": "Kayıt silindi"}

@api_router.get("/budget/summary")
async def get_budget_summary(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if company_id:
        query["company_id"] = company_id
    
    all_items = await db.recurring_items.find(query, {"_id": 0}).to_list(1000)
    
    monthly_income = 0
    monthly_expense = 0
    yearly_income = 0
    yearly_expense = 0
    
    income_by_category = {}
    expense_by_category = {}
    
    for item in all_items:
        if not item.get("is_active", True):
            continue
        amount = item["amount"]
        monthly_amount = amount if item["frequency"] == "monthly" else amount / 12
        yearly_amount = amount * 12 if item["frequency"] == "monthly" else amount
        
        if item["item_type"] == "income":
            monthly_income += monthly_amount
            yearly_income += yearly_amount
            cat = item["category"]
            income_by_category[cat] = income_by_category.get(cat, 0) + monthly_amount
        else:
            monthly_expense += monthly_amount
            yearly_expense += yearly_amount
            cat = item["category"]
            expense_by_category[cat] = expense_by_category.get(cat, 0) + monthly_amount
    
    return {
        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "monthly_net": monthly_income - monthly_expense,
        "yearly_income": yearly_income,
        "yearly_expense": yearly_expense,
        "yearly_net": yearly_income - yearly_expense,
        "income_by_category": [{"name": k, "value": v} for k, v in income_by_category.items()],
        "expense_by_category": [{"name": k, "value": v} for k, v in expense_by_category.items()],
        "items": all_items
    }


# ============ BANK ACCOUNT ROUTES ============

@api_router.post("/bank-accounts", response_model=BankAccountResponse)
async def create_bank_account(account: BankAccountCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        **account.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bank_accounts.insert_one(doc)
    return BankAccountResponse(**{k: v for k, v in doc.items() if k != "_id"})

@api_router.get("/bank-accounts", response_model=List[BankAccountResponse])
async def get_bank_accounts(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    items = await db.bank_accounts.find(query, {"_id": 0}).to_list(1000)
    return [BankAccountResponse(**i) for i in items]

@api_router.put("/bank-accounts/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(account_id: str, account: BankAccountCreate, current_user: dict = Depends(get_current_user)):
    result = await db.bank_accounts.update_one({"id": account_id}, {"$set": account.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hesap bulunamadı")
    updated = await db.bank_accounts.find_one({"id": account_id}, {"_id": 0})
    return BankAccountResponse(**updated)

@api_router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(account_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.bank_accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hesap bulunamadı")
    return {"message": "Hesap silindi"}

# ============ CREDIT CARD ROUTES ============

@api_router.post("/credit-cards", response_model=CreditCardResponse)
async def create_credit_card(card: CreditCardCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        **card.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.credit_cards.insert_one(doc)
    return CreditCardResponse(**{k: v for k, v in doc.items() if k != "_id"})

@api_router.get("/credit-cards", response_model=List[CreditCardResponse])
async def get_credit_cards(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    items = await db.credit_cards.find(query, {"_id": 0}).to_list(1000)
    return [CreditCardResponse(**i) for i in items]

@api_router.put("/credit-cards/{card_id}", response_model=CreditCardResponse)
async def update_credit_card(card_id: str, card: CreditCardCreate, current_user: dict = Depends(get_current_user)):
    result = await db.credit_cards.update_one({"id": card_id}, {"$set": card.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kart bulunamadı")
    updated = await db.credit_cards.find_one({"id": card_id}, {"_id": 0})
    return CreditCardResponse(**updated)

@api_router.delete("/credit-cards/{card_id}")
async def delete_credit_card(card_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.credit_cards.delete_one({"id": card_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kart bulunamadı")
    return {"message": "Kart silindi"}

@api_router.get("/bank-cards/summary")
async def get_bank_cards_summary(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    accounts = await db.bank_accounts.find(query, {"_id": 0}).to_list(1000)
    cards = await db.credit_cards.find(query, {"_id": 0}).to_list(1000)
    
    total_balance = sum(a.get("balance", 0) for a in accounts)
    total_kmh = sum(a.get("kmh_limit", 0) for a in accounts)
    total_card_limit = sum(c.get("total_limit", 0) for c in cards)
    total_available = sum(c.get("available_limit", 0) for c in cards)
    
    return {
        "total_balance": total_balance,
        "total_kmh": total_kmh,
        "total_card_limit": total_card_limit,
        "total_available": total_available,
        "account_count": len(accounts),
        "card_count": len(cards)
    }

# ============ REMINDER ROUTES ============

@api_router.post("/reminders", response_model=ReminderResponse)
async def create_reminder(reminder: ReminderCreate, current_user: dict = Depends(get_current_user)):
    reminder_doc = {
        "id": str(uuid.uuid4()),
        **reminder.model_dump(),
        "is_paid": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reminders.insert_one(reminder_doc)
    return ReminderResponse(**{k: v for k, v in reminder_doc.items() if k != "_id"})

@api_router.get("/reminders", response_model=List[ReminderResponse])
async def get_reminders(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    reminders = await db.reminders.find(query, {"_id": 0}).to_list(1000)
    return [ReminderResponse(**r) for r in reminders]

@api_router.put("/reminders/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(reminder_id: str, reminder: ReminderCreate, current_user: dict = Depends(get_current_user)):
    result = await db.reminders.update_one({"id": reminder_id}, {"$set": reminder.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")
    updated = await db.reminders.find_one({"id": reminder_id}, {"_id": 0})
    return ReminderResponse(**updated)

@api_router.put("/reminders/{reminder_id}/pay")
async def mark_reminder_paid(reminder_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.reminders.update_one({"id": reminder_id}, {"$set": {"is_paid": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")
    return {"message": "Ödeme yapıldı olarak işaretlendi"}

@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.reminders.delete_one({"id": reminder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")
    return {"message": "Hatırlatıcı silindi"}

# ============ SMTP SETTINGS ROUTES ============

@api_router.post("/smtp", response_model=SMTPSettingsResponse)
async def save_smtp_settings(settings: SMTPSettingsCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin SMTP ayarlarını değiştirebilir")
    
    # Mevcut ayarları sil ve yenisini ekle
    await db.smtp_settings.delete_many({})
    
    settings_doc = {
        "id": str(uuid.uuid4()),
        **settings.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.smtp_settings.insert_one(settings_doc)
    
    # Şifreyi response'dan çıkar
    response_doc = {k: v for k, v in settings_doc.items() if k not in ["_id", "smtp_password"]}
    return SMTPSettingsResponse(**response_doc)

@api_router.get("/smtp", response_model=Optional[SMTPSettingsResponse])
async def get_smtp_settings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin SMTP ayarlarını görüntüleyebilir")
    
    settings = await db.smtp_settings.find_one({}, {"_id": 0, "smtp_password": 0})
    if not settings:
        return None
    return SMTPSettingsResponse(**settings)

@api_router.post("/smtp/test")
async def test_smtp_settings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin test e-postası gönderebilir")
    
    settings = await db.smtp_settings.find_one({"is_active": True}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="SMTP ayarları bulunamadı veya aktif değil")
    
    content = '''
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
        Bu bir test e-postas&#305;d&#305;r. SMTP ayarlar&#305;n&#305;z ba&#351;ar&#305;yla yap&#305;land&#305;r&#305;lm&#305;&#351;t&#305;r.
    </p>
    <p style="margin: 0; color: #64748b; font-size: 14px;">
        Art&#305;k &#246;deme hat&#305;rlat&#305;c&#305;lar&#305; bu e-posta adresine g&#246;nderilecektir.
    </p>
    '''
    html = get_email_template("SMTP Test", content)
    
    success = await send_email(settings['notify_email'], "FinTres Pro - SMTP Test", html)
    if not success:
        raise HTTPException(status_code=500, detail="E-posta gönderilemedi. SMTP ayarlarını kontrol edin.")
    
    return {"message": f"Test e-postası {settings['notify_email']} adresine gönderildi"}

@api_router.post("/smtp/send-reminders")
async def trigger_reminder_emails(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin hatırlatıcı e-postası gönderebilir")
    
    background_tasks.add_task(send_reminder_notifications)
    return {"message": "Hatırlatıcı e-postaları gönderiliyor"}

# ============ REMINDER SETTINGS ROUTES ============

@api_router.get("/settings/reminders")
async def get_reminder_settings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    
    settings = await db.reminder_settings.find_one({}, {"_id": 0})
    if not settings:
        return {
            "id": "",
            "days_before": 7,
            "send_on_due_date": True,
            "is_scheduler_active": True,
            "updated_at": ""
        }
    return settings

@api_router.post("/settings/reminders")
async def save_reminder_settings(settings: ReminderSettingsCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin hatırlatma ayarlarını değiştirebilir")
    
    await db.reminder_settings.delete_many({})
    
    settings_doc = {
        "id": str(uuid.uuid4()),
        **settings.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reminder_settings.insert_one(settings_doc)
    
    # Zamanlayıcıyı güncelle
    update_scheduler(settings.is_scheduler_active)
    
    response = {k: v for k, v in settings_doc.items() if k != "_id"}
    return response

@api_router.get("/settings/scheduler-status")
async def get_scheduler_status(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    
    job = scheduler.get_job("daily_reminder")
    is_running = scheduler.running
    next_run = None
    if job and job.next_run_time:
        # UTC+3'e çevir
        next_run_utc3 = job.next_run_time + timedelta(hours=3)
        next_run = next_run_utc3.strftime("%Y-%m-%d %H:%M")
    
    return {
        "is_running": is_running,
        "has_job": job is not None,
        "next_run": next_run,
        "send_time": "08:00 (UTC+3 Türkiye)"
    }

# ============ REPORTS / DASHBOARD ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    
    # Get totals
    incomes = await db.incomes.find(query, {"_id": 0}).to_list(10000)
    expenses = await db.expenses.find(query, {"_id": 0}).to_list(10000)
    personnel = await db.personnel.find(query, {"_id": 0}).to_list(10000)
    reminders = await db.reminders.find({**query, "is_paid": False}, {"_id": 0}).to_list(10000)
    
    total_income = sum(i["amount"] for i in incomes if i.get("currency") == "TRY")
    total_expense = sum(e["amount"] for e in expenses if e.get("currency") == "TRY")
    total_personnel = len(personnel)
    pending_reminders = len(reminders)
    
    # Monthly data for charts
    monthly_data = {}
    for income in incomes:
        month = income["date"][:7]
        if month not in monthly_data:
            monthly_data[month] = {"month": month, "income": 0, "expense": 0}
        monthly_data[month]["income"] += income["amount"]
    
    for expense in expenses:
        month = expense["date"][:7]
        if month not in monthly_data:
            monthly_data[month] = {"month": month, "income": 0, "expense": 0}
        monthly_data[month]["expense"] += expense["amount"]
    
    chart_data = sorted(monthly_data.values(), key=lambda x: x["month"])[-12:]
    
    # Expense by category
    expense_categories = {}
    for expense in expenses:
        cat = expense.get("category", "Diğer")
        expense_categories[cat] = expense_categories.get(cat, 0) + expense["amount"]
    
    category_data = [{"name": k, "value": v} for k, v in expense_categories.items()]
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": total_income - total_expense,
        "total_personnel": total_personnel,
        "pending_reminders": pending_reminders,
        "monthly_chart": chart_data,
        "expense_categories": category_data
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ SCHEDULER SETUP ============

scheduler = AsyncIOScheduler()

def update_scheduler(is_active: bool):
    """Zamanlayıcıyı güncelle"""
    existing_job = scheduler.get_job("daily_reminder")
    if is_active:
        if not existing_job:
            scheduler.add_job(
                run_reminder_job,
                CronTrigger(hour=5, minute=0),  # UTC 05:00 = UTC+3 08:00
                id="daily_reminder",
                replace_existing=True
            )
            logger.info("Hatirlatici zamanlayicisi eklendi: Her gun 08:00 (UTC+3)")
    else:
        if existing_job:
            scheduler.remove_job("daily_reminder")
            logger.info("Hatirlatici zamanlayicisi durduruldu")

async def run_reminder_job():
    """Zamanlayıcı tarafından çağrılan iş"""
    logger.info("Otomatik hatirlatici e-posta kontrolu baslatildi...")
    try:
        await send_reminder_notifications()
        logger.info("Hatirlatici e-postalari gonderildi")
    except Exception as e:
        logger.error(f"Hatirlatici gonderme hatasi: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Uygulama başlatıldığında admin oluştur ve zamanlayıcıyı başlat"""
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@fintrack.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin123!')
    admin_name = os.environ.get('ADMIN_NAME', 'Admin')
    
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password": hash_password(admin_password),
            "name": admin_name,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info(f"Varsayilan admin olusturuldu: {admin_email}")
    else:
        logger.info(f"Admin zaten mevcut: {admin_email}")
    
    # Zamanlayıcıyı başlat
    reminder_config = await db.reminder_settings.find_one({}, {"_id": 0})
    is_active = reminder_config.get("is_scheduler_active", True) if reminder_config else True
    
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler baslatildi")
    
    update_scheduler(is_active)

@app.on_event("shutdown")
async def shutdown_event():
    if scheduler.running:
        scheduler.shutdown()
    client.close()
