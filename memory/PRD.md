# FinTres Pro - Product Requirements Document

## Original Problem Statement
Multi-company pre-accounting/finance tracking software. Income, Expenses, Personnel, Salaries, Bank/Card/Credit/Rent payment reminders. Two companies managed from a single panel with ability to add more.
- Companies: Tres Teknoloji A.S. & Netlen Internet Hizmetleri Ltd. Sti.

## Tech Stack
- Frontend: React + TailwindCSS + Shadcn UI + Recharts
- Backend: FastAPI + Motor (async MongoDB) + APScheduler
- Database: MongoDB
- Auth: JWT (no open registration, first user = admin)

## Core Requirements
1. Multi-company management (single + combined "Tum Firmalar" view)
2. Multi-user system with role-based access (Admin/User), no open registration
3. Income/Expense tracking with multi-currency support
4. Personnel management (status filtering, advance tracking, detail modals)
5. Budget/Cash Flow page for recurring revenues/expenses
6. Payment reminders with automated SMTP email notifications
7. Dark/Light theme toggle
8. Corporate, responsive, emoji-free email template
9. Project name: "FinTres Pro"
10. Automatic daily reminder emails at 08:00 UTC+3 (Turkish time)
11. Configurable reminder settings (days before due date, due date reminder)

## Completed Features (as of 2026-04-14)
- [x] FastAPI + React full-stack setup with Shadcn UI
- [x] JWT Authentication (admin auto-creation, no open registration)
- [x] Multi-company CRUD (Income, Expense, Companies)
- [x] Combined data viewing ("Tum Firmalar" dropdown)
- [x] Dark/Light Theme toggle
- [x] Personnel Module (status filtering, advance tracking, detail modal)
- [x] Budget Page (recurring incomes/expenses, cash flow calculation)
- [x] Reminders page
- [x] Reports page
- [x] Settings page (Profile, Users management, SMTP configuration)
- [x] SMTP backend endpoints (save, get, test, send-reminders)
- [x] Corporate email template (no emoji, responsive, grouped by urgency)
- [x] Project renamed to "FinTres Pro" everywhere
- [x] APScheduler: Automatic daily reminder emails at 08:00 UTC+3
- [x] Admin-configurable reminder settings (days_before, send_on_due_date, scheduler on/off)
- [x] Scheduler status display (active/passive, next run time, send time)
- [x] Grouped email template (overdue, today, upcoming)

## API Endpoints
- /api/auth/login, /api/auth/me, /api/auth/register
- /api/companies (CRUD)
- /api/incomes (CRUD)
- /api/expenses (CRUD)
- /api/personnel (CRUD + terminate)
- /api/advances (CRUD + payback)
- /api/salaries (CRUD)
- /api/recurring (CRUD) + /api/budget/summary
- /api/reminders (CRUD + pay)
- /api/smtp (GET/POST + test + send-reminders)
- /api/settings/reminders (GET/POST)
- /api/settings/scheduler-status (GET)
- /api/dashboard/stats
- /api/users (GET/DELETE)

## Backlog (P2)
- [ ] server.py modularization (split routes into separate files)
- [ ] Password change functionality for users
- [ ] Export data to Excel/PDF
