# FinTres Pro - Product Requirements Document

## Original Problem Statement
Multi-company pre-accounting/finance tracking software. Income, Expenses, Personnel, Salaries, Bank/Card/Credit/Rent payment reminders. Two companies managed from a single panel with ability to add more.
- Companies: Tres Teknoloji A.S. & Netlen Internet Hizmetleri Ltd. Sti.

## Tech Stack
- Frontend: React + TailwindCSS + Shadcn UI + Recharts
- Backend: FastAPI + Motor (async MongoDB)
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
- [x] Corporate email template (no emoji, responsive)
- [x] Project renamed to "FinTres Pro" everywhere

## Upcoming Tasks (P1)
- [ ] APScheduler: Automatic daily/weekly email reminders for upcoming payments

## Backlog (P2)
- [ ] server.py modularization (split routes into separate files)
- [ ] Password change functionality for users
- [ ] Export data to Excel/PDF
