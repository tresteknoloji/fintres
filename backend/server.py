from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'fintrack-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="FinTrack Pro API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
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

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "role": user.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_doc["id"], user_doc["email"], user_doc["role"])
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"]
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.personnel.insert_one(personnel_doc)
    return PersonnelResponse(**{k: v for k, v in personnel_doc.items() if k != "_id"})

@api_router.get("/personnel", response_model=List[PersonnelResponse])
async def get_personnel(company_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"company_id": company_id} if company_id else {}
    personnel = await db.personnel.find(query, {"_id": 0}).to_list(1000)
    return [PersonnelResponse(**p) for p in personnel]

@api_router.put("/personnel/{personnel_id}", response_model=PersonnelResponse)
async def update_personnel(personnel_id: str, personnel: PersonnelCreate, current_user: dict = Depends(get_current_user)):
    result = await db.personnel.update_one({"id": personnel_id}, {"$set": personnel.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    updated = await db.personnel.find_one({"id": personnel_id}, {"_id": 0})
    return PersonnelResponse(**updated)

@api_router.delete("/personnel/{personnel_id}")
async def delete_personnel(personnel_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.personnel.delete_one({"id": personnel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return {"message": "Personel silindi"}

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
