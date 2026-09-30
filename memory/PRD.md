# PRD — Sistem Manajemen Invoice Yayasan Mercusuar Harapan Mulia

## Problem Statement
Web-based invoice management system for Yayasan Mercusuar Harapan Mulia (Jl. Ciater Raya Blok A1 No.2, BSD, Ciater, Serpong, Tangerang Selatan 15310). Modules: Invoice creation (programs PIJAR, PURRFECT LEARNING, DAYCARE; per-item nominal/percent discount; auto subtotal/discount/total; CRUD), Payment Schedule / installments (CRUD), Payment Receipts / Tanda Terima auto-created on payment (CRUD), printable professional PDF for all 3 docs with foundation header + logo, Master Data for programs/prices (CRUD).

## User Choices
- NO authentication (all modules open)
- Manual payment recording
- Indonesian Rupiah formatting
- Professional clean design (foundation user will upload real logo later; placeholder lighthouse SVG in use)

## Architecture
- Backend: FastAPI + MongoDB (motor). UUID string ids. Collections: programs, invoices, schedules, receipts.
- Frontend: Vite + React 19 + Tailwind v4 + shadcn/ui. React Router. Sonner toasts. Recharts.
- Currency util + terbilang (Indonesian number-to-words) on backend for receipts.

## Implemented (2026-06-30)
- Dashboard: KPI cards (total billed/paid/receivable/ratio), revenue-per-program chart, upcoming due list, recent receipts.
- Invoices: full CRUD, dynamic line items, per-item discount (nominal/percent), global discount, live calculation, program auto-load, full/installment payment type.
- Payment Schedules: auto-generated on installment invoice create; CRUD; per-termin payment recording; printable.
- Payments/Receipts: record payment against invoice or installment termin -> auto receipt (KWT/YMH/...) with terbilang; CRUD; delete reverts invoice amount_paid.
- Master Data: program CRUD (biaya pengembangan, SPP, pendaftaran, periode).
- Print views: Invoice (Faktur), Schedule (Lembar Komitmen), Receipt (Kuitansi) with foundation kop surat, address, logo placeholder, sign-off, bank instructions. window.print() with isolated @media print CSS.
- Auto-seed on startup: 3 programs + 4 sample invoices + schedule + receipt.

## Verified
- Backend all endpoints 200; invoice calc math (nominal + percent); payment -> receipt + status update; installment schedule auto-generation; delete flows.
- Frontend dashboard + all nav tabs render seeded data; Rupiah formatting.

## Backlog (P1/P2)
- P1: Upload real foundation logo (replace SVG placeholder).
- P1: Full Playwright E2E for form-save flow and PDF print rendering.
- P2: WhatsApp/email invoice sharing; export lists to Excel; academic-year filter.
