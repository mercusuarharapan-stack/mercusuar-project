from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Helpers ----------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


_SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh",
           "delapan", "sembilan", "sepuluh", "sebelas"]


def _terbilang(n: int) -> str:
    n = int(n)
    if n < 12:
        return _SATUAN[n]
    elif n < 20:
        return _terbilang(n - 10) + " belas"
    elif n < 100:
        return _terbilang(n // 10) + " puluh" + ((" " + _terbilang(n % 10)) if n % 10 else "")
    elif n < 200:
        return "seratus" + ((" " + _terbilang(n - 100)) if n - 100 else "")
    elif n < 1000:
        return _terbilang(n // 100) + " ratus" + ((" " + _terbilang(n % 100)) if n % 100 else "")
    elif n < 2000:
        return "seribu" + ((" " + _terbilang(n - 1000)) if n - 1000 else "")
    elif n < 1000000:
        return _terbilang(n // 1000) + " ribu" + ((" " + _terbilang(n % 1000)) if n % 1000 else "")
    elif n < 1000000000:
        return _terbilang(n // 1000000) + " juta" + ((" " + _terbilang(n % 1000000)) if n % 1000000 else "")
    elif n < 1000000000000:
        return _terbilang(n // 1000000000) + " miliar" + ((" " + _terbilang(n % 1000000000)) if n % 1000000000 else "")
    else:
        return _terbilang(n // 1000000000000) + " triliun" + ((" " + _terbilang(n % 1000000000000)) if n % 1000000000000 else "")


def terbilang_rupiah(n) -> str:
    n = int(round(n))
    if n == 0:
        return "Nol Rupiah"
    words = _terbilang(n).strip()
    words = " ".join(w.capitalize() for w in words.split())
    return f"{words} Rupiah"


# ---------------- Models ----------------
class Program(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    label: str = ""
    biaya_pengembangan: float = 0
    spp_bulanan: float = 0
    periode_bulan: int = 12
    biaya_pendaftaran: float = 0
    badge_color: str = "emerald"
    created_at: str = Field(default_factory=now_iso)


class ProgramInput(BaseModel):
    name: str
    label: str = ""
    biaya_pengembangan: float = 0
    spp_bulanan: float = 0
    periode_bulan: int = 12
    biaya_pendaftaran: float = 0
    badge_color: str = "emerald"


class InvoiceItem(BaseModel):
    description: str
    program: str = ""
    qty: float = 1
    unit_price: float = 0
    discount_type: Literal["none", "nominal", "percent"] = "none"
    discount_value: float = 0
    line_subtotal: float = 0
    line_discount: float = 0
    line_total: float = 0


class Student(BaseModel):
    name: str = ""
    nis: str = ""
    kelas: str = ""
    parent_name: str = ""
    contact: str = ""
    email: str = ""


class InvoiceInput(BaseModel):
    student: Student = Field(default_factory=Student)
    invoice_date: str = ""
    due_date: str = ""
    items: List[InvoiceItem] = []
    global_discount_type: Literal["none", "nominal", "percent"] = "none"
    global_discount_value: float = 0
    payment_type: Literal["full", "installment"] = "full"
    tenor: int = 3
    notes: str = ""
    status: str = "unpaid"


class Invoice(InvoiceInput):
    id: str = Field(default_factory=new_id)
    invoice_number: str = ""
    subtotal: float = 0
    total_discount: float = 0
    total: float = 0
    amount_paid: float = 0
    created_at: str = Field(default_factory=now_iso)


class Installment(BaseModel):
    termin: int
    due_date: str
    amount: float
    category: str = "Class Fee"
    note: str = ""
    status: str = "pending"
    paid_amount: float = 0


class ScheduleInput(BaseModel):
    invoice_id: str
    tenor: int = 3
    start_date: str = ""
    day_of_month: int = 10
    installments: Optional[List[Installment]] = None


class Schedule(BaseModel):
    id: str = Field(default_factory=new_id)
    invoice_id: str
    invoice_number: str = ""
    student_name: str = ""
    total: float = 0
    tenor: int = 3
    installments: List[Installment] = []
    created_at: str = Field(default_factory=now_iso)


class ScheduleUpdate(BaseModel):
    tenor: Optional[int] = None
    installments: Optional[List[Installment]] = None


class PaymentInput(BaseModel):
    invoice_id: str
    amount: float
    payment_date: str = ""
    method: str = "Transfer Bank"
    reference: str = ""
    note: str = ""
    schedule_id: str = ""
    termin: Optional[int] = None


class Receipt(BaseModel):
    id: str = Field(default_factory=new_id)
    receipt_number: str = ""
    invoice_id: str = ""
    invoice_number: str = ""
    student_name: str = ""
    amount: float = 0
    terbilang: str = ""
    payment_date: str = ""
    method: str = "Transfer Bank"
    reference: str = ""
    note: str = ""
    category: str = ""
    termin: Optional[int] = None
    created_at: str = Field(default_factory=now_iso)


class ReceiptUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[str] = None
    method: Optional[str] = None
    reference: Optional[str] = None
    note: Optional[str] = None


# ---------------- Calculation ----------------
def compute_invoice(inv: dict) -> dict:
    subtotal = 0.0
    sum_line_total = 0.0
    line_discount_sum = 0.0
    items = inv.get("items", [])
    for it in items:
        qty = float(it.get("qty", 1) or 0)
        up = float(it.get("unit_price", 0) or 0)
        ls = qty * up
        dt = it.get("discount_type", "none")
        dv = float(it.get("discount_value", 0) or 0)
        if dt == "nominal":
            ld = dv
        elif dt == "percent":
            ld = ls * dv / 100.0
        else:
            ld = 0.0
        ld = min(ld, ls)
        lt = ls - ld
        it["line_subtotal"] = ls
        it["line_discount"] = ld
        it["line_total"] = lt
        subtotal += ls
        line_discount_sum += ld
        sum_line_total += lt
    gdt = inv.get("global_discount_type", "none")
    gdv = float(inv.get("global_discount_value", 0) or 0)
    if gdt == "nominal":
        gd = gdv
    elif gdt == "percent":
        gd = sum_line_total * gdv / 100.0
    else:
        gd = 0.0
    gd = min(gd, sum_line_total)
    total = sum_line_total - gd
    inv["subtotal"] = round(subtotal, 2)
    inv["total_discount"] = round(line_discount_sum + gd, 2)
    inv["total"] = round(total, 2)
    return inv


async def next_number(prefix: str, coll, field: str) -> str:
    now = datetime.now(timezone.utc)
    ym = now.strftime("%Y/%m")
    count = await coll.count_documents({}) + 1
    return f"{prefix}/YMH/{ym}/{count:04d}"


def apply_invoice_status(inv: dict) -> dict:
    paid = float(inv.get("amount_paid", 0) or 0)
    total = float(inv.get("total", 0) or 0)
    if paid <= 0:
        inv["status"] = "unpaid"
    elif paid >= total - 0.5:
        inv["status"] = "paid"
    else:
        inv["status"] = "partial"
    return inv


# ---------------- Program routes ----------------
@api_router.get("/programs", response_model=List[Program])
async def list_programs():
    docs = await db.programs.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return docs


@api_router.post("/programs", response_model=Program)
async def create_program(data: ProgramInput):
    prog = Program(**data.model_dump())
    await db.programs.insert_one(prog.model_dump())
    return prog


@api_router.put("/programs/{pid}", response_model=Program)
async def update_program(pid: str, data: ProgramInput):
    existing = await db.programs.find_one({"id": pid}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Program tidak ditemukan")
    existing.update(data.model_dump())
    await db.programs.update_one({"id": pid}, {"$set": existing})
    return existing


@api_router.delete("/programs/{pid}")
async def delete_program(pid: str):
    await db.programs.delete_one({"id": pid})
    return {"ok": True}


# ---------------- Invoice routes ----------------
@api_router.get("/invoices", response_model=List[Invoice])
async def list_invoices():
    docs = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.get("/invoices/{iid}", response_model=Invoice)
async def get_invoice(iid: str):
    doc = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Invoice tidak ditemukan")
    return doc


async def _sync_schedule(inv: dict, regenerate: bool = False):
    if inv.get("payment_type") != "installment":
        await db.schedules.delete_many({"invoice_id": inv["id"]})
        return
    existing = await db.schedules.count_documents({"invoice_id": inv["id"]})
    if existing and not regenerate:
        return
    await db.schedules.delete_many({"invoice_id": inv["id"]})
    installments = build_installments(inv["total"], inv.get("tenor", 3), inv.get("invoice_date", ""), 10)
    sched = Schedule(
        invoice_id=inv["id"],
        invoice_number=inv.get("invoice_number", ""),
        student_name=inv.get("student", {}).get("name", ""),
        total=inv["total"],
        tenor=inv.get("tenor", 3),
        installments=[Installment(**i) for i in installments],
    )
    await db.schedules.insert_one(sched.model_dump())


@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(data: InvoiceInput):
    inv = Invoice(**data.model_dump())
    d = inv.model_dump()
    compute_invoice(d)
    apply_invoice_status(d)
    d["invoice_number"] = await next_number("INV", db.invoices, "invoice_number")
    await db.invoices.insert_one(d)
    await _sync_schedule(d, regenerate=True)
    d.pop("_id", None)
    return d


@api_router.put("/invoices/{iid}", response_model=Invoice)
async def update_invoice(iid: str, data: InvoiceInput):
    existing = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Invoice tidak ditemukan")
    existing.update(data.model_dump())
    compute_invoice(existing)
    apply_invoice_status(existing)
    await db.invoices.update_one({"id": iid}, {"$set": existing})
    await _sync_schedule(existing, regenerate=False)
    return existing


@api_router.delete("/invoices/{iid}")
async def delete_invoice(iid: str):
    await db.invoices.delete_one({"id": iid})
    await db.schedules.delete_many({"invoice_id": iid})
    await db.receipts.delete_many({"invoice_id": iid})
    return {"ok": True}


# ---------------- Schedule routes ----------------
def build_installments(total: float, tenor: int, start_date: str, day_of_month: int) -> List[dict]:
    tenor = max(1, int(tenor))
    per = round(total / tenor)
    installments = []
    try:
        base = datetime.fromisoformat(start_date) if start_date else datetime.now(timezone.utc)
    except Exception:
        base = datetime.now(timezone.utc)
    allocated = 0
    for i in range(tenor):
        month = base.month - 1 + i
        year = base.year + month // 12
        month = month % 12 + 1
        try:
            due = datetime(year, month, min(day_of_month, 28))
        except Exception:
            due = datetime(year, month, 28)
        amt = per if i < tenor - 1 else round(total - allocated)
        allocated += amt
        installments.append({
            "termin": i + 1,
            "due_date": due.date().isoformat(),
            "amount": float(amt),
            "category": "Class Fee",
            "note": "",
            "status": "pending",
            "paid_amount": 0,
        })
    return installments


@api_router.get("/schedules", response_model=List[Schedule])
async def list_schedules(invoice_id: str = ""):
    q = {"invoice_id": invoice_id} if invoice_id else {}
    docs = await db.schedules.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.get("/schedules/{sid}", response_model=Schedule)
async def get_schedule(sid: str):
    doc = await db.schedules.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Jadwal tidak ditemukan")
    return doc


@api_router.post("/schedules", response_model=Schedule)
async def create_schedule(data: ScheduleInput):
    inv = await db.invoices.find_one({"id": data.invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice tidak ditemukan")
    await db.schedules.delete_many({"invoice_id": data.invoice_id})
    if data.installments:
        installments = [i.model_dump() for i in data.installments]
    else:
        installments = build_installments(inv["total"], data.tenor, data.start_date or inv.get("invoice_date", ""), data.day_of_month)
    sched = Schedule(
        invoice_id=data.invoice_id,
        invoice_number=inv.get("invoice_number", ""),
        student_name=inv.get("student", {}).get("name", ""),
        total=inv["total"],
        tenor=data.tenor,
        installments=[Installment(**i) for i in installments],
    )
    d = sched.model_dump()
    await db.schedules.insert_one(d)
    await db.invoices.update_one({"id": data.invoice_id}, {"$set": {"payment_type": "installment"}})
    d.pop("_id", None)
    return d


@api_router.put("/schedules/{sid}", response_model=Schedule)
async def update_schedule(sid: str, data: ScheduleUpdate):
    existing = await db.schedules.find_one({"id": sid}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Jadwal tidak ditemukan")
    if data.tenor is not None:
        existing["tenor"] = data.tenor
    if data.installments is not None:
        existing["installments"] = [i.model_dump() for i in data.installments]
    await db.schedules.update_one({"id": sid}, {"$set": existing})
    return existing


@api_router.delete("/schedules/{sid}")
async def delete_schedule(sid: str):
    await db.schedules.delete_one({"id": sid})
    return {"ok": True}


# ---------------- Payment & Receipt routes ----------------
@api_router.get("/receipts", response_model=List[Receipt])
async def list_receipts():
    docs = await db.receipts.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.get("/receipts/{rid}", response_model=Receipt)
async def get_receipt(rid: str):
    doc = await db.receipts.find_one({"id": rid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Tanda terima tidak ditemukan")
    return doc


@api_router.post("/payments", response_model=Receipt)
async def record_payment(data: PaymentInput):
    inv = await db.invoices.find_one({"id": data.invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice tidak ditemukan")
    inv["amount_paid"] = float(inv.get("amount_paid", 0) or 0) + float(data.amount)
    apply_invoice_status(inv)
    await db.invoices.update_one({"id": data.invoice_id}, {"$set": {"amount_paid": inv["amount_paid"], "status": inv["status"]}})

    termin_category = ""
    termin_note = ""
    if data.schedule_id and data.termin is not None:
        sched = await db.schedules.find_one({"id": data.schedule_id}, {"_id": 0})
        if sched:
            for ins in sched["installments"]:
                if ins["termin"] == data.termin:
                    ins["paid_amount"] = float(ins.get("paid_amount", 0)) + float(data.amount)
                    ins["status"] = "paid" if ins["paid_amount"] >= ins["amount"] - 0.5 else "partial"
                    termin_category = ins.get("category", "")
                    termin_note = ins.get("note", "")
            await db.schedules.update_one({"id": data.schedule_id}, {"$set": {"installments": sched["installments"]}})

    rec = Receipt(
        invoice_id=data.invoice_id,
        invoice_number=inv.get("invoice_number", ""),
        student_name=inv.get("student", {}).get("name", ""),
        amount=float(data.amount),
        terbilang=terbilang_rupiah(data.amount),
        payment_date=data.payment_date or now_iso()[:10],
        method=data.method,
        reference=data.reference,
        note=data.note or termin_note,
        category=termin_category,
        termin=data.termin,
    )
    rec.receipt_number = await next_number("KWT", db.receipts, "receipt_number")
    d = rec.model_dump()
    await db.receipts.insert_one(d)
    d.pop("_id", None)
    return d


@api_router.put("/receipts/{rid}", response_model=Receipt)
async def update_receipt(rid: str, data: ReceiptUpdate):
    existing = await db.receipts.find_one({"id": rid}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Tanda terima tidak ditemukan")
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if "amount" in upd:
        upd["terbilang"] = terbilang_rupiah(upd["amount"])
    existing.update(upd)
    await db.receipts.update_one({"id": rid}, {"$set": existing})
    return existing


@api_router.delete("/receipts/{rid}")
async def delete_receipt(rid: str):
    rec = await db.receipts.find_one({"id": rid}, {"_id": 0})
    if rec:
        inv = await db.invoices.find_one({"id": rec.get("invoice_id")}, {"_id": 0})
        if inv:
            inv["amount_paid"] = max(0, float(inv.get("amount_paid", 0)) - float(rec.get("amount", 0)))
            apply_invoice_status(inv)
            await db.invoices.update_one({"id": inv["id"]}, {"$set": {"amount_paid": inv["amount_paid"], "status": inv["status"]}})
    await db.receipts.delete_one({"id": rid})
    return {"ok": True}


# ---------------- Settings (branding) ----------------
class SettingsInput(BaseModel):
    logo: str = ""


@api_router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"id": "app"}, {"_id": 0})
    return doc or {"id": "app", "logo": ""}


@api_router.put("/settings")
async def update_settings(data: SettingsInput):
    await db.settings.update_one({"id": "app"}, {"$set": {"id": "app", "logo": data.logo}}, upsert=True)
    return {"id": "app", "logo": data.logo}


# ---------------- Dashboard ----------------
@api_router.get("/dashboard/stats")
async def dashboard_stats():
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(5000)
    receipts = await db.receipts.find({}, {"_id": 0}).to_list(5000)
    schedules = await db.schedules.find({}, {"_id": 0}).to_list(5000)
    total_billed = sum(float(i.get("total", 0)) for i in invoices)
    total_paid = sum(float(i.get("amount_paid", 0)) for i in invoices)
    receivable = total_billed - total_paid
    ratio = (total_paid / total_billed * 100) if total_billed else 0
    by_program = {}
    for i in invoices:
        for it in i.get("items", []):
            p = it.get("program") or "Lainnya"
            by_program[p] = by_program.get(p, 0) + float(it.get("line_total", 0))
    today = datetime.now(timezone.utc).date()
    upcoming = []
    for s in schedules:
        for ins in s.get("installments", []):
            if ins.get("status") == "paid":
                continue
            try:
                due = datetime.fromisoformat(ins["due_date"]).date()
            except Exception:
                continue
            days = (due - today).days
            if days <= 14:
                upcoming.append({
                    "schedule_id": s["id"],
                    "invoice_id": s["invoice_id"],
                    "invoice_number": s.get("invoice_number", ""),
                    "student_name": s.get("student_name", ""),
                    "termin": ins["termin"],
                    "due_date": ins["due_date"],
                    "amount": ins["amount"],
                    "overdue": days < 0,
                })
    upcoming.sort(key=lambda x: x["due_date"])
    recent_receipts = sorted(receipts, key=lambda r: r.get("created_at", ""), reverse=True)[:6]
    return {
        "total_billed": total_billed,
        "total_paid": total_paid,
        "receivable": receivable,
        "ratio": round(ratio, 1),
        "invoice_count": len(invoices),
        "receipt_count": len(receipts),
        "by_program": [{"program": k, "amount": v} for k, v in by_program.items()],
        "upcoming": upcoming[:10],
        "recent_receipts": recent_receipts,
    }


# ---------------- Seed ----------------
DEFAULT_PROGRAMS = [
    {"name": "PIJAR", "label": "Program Inklusif & Juara Akademik Ramah Anak", "biaya_pengembangan": 4500000, "spp_bulanan": 850000, "periode_bulan": 12, "biaya_pendaftaran": 500000, "badge_color": "emerald"},
    {"name": "PURRFECT LEARNING", "label": "Purrfect Learning Early & Elementary Skills", "biaya_pengembangan": 3750000, "spp_bulanan": 700000, "periode_bulan": 12, "biaya_pendaftaran": 400000, "badge_color": "amber"},
    {"name": "DAYCARE", "label": "Mercusuar Daycare & Nurture Care Center", "biaya_pengembangan": 2500000, "spp_bulanan": 1250000, "periode_bulan": 12, "biaya_pendaftaran": 350000, "badge_color": "sky"},
]


@api_router.post("/seed")
async def seed(force: bool = False):
    if force:
        await db.programs.delete_many({})
        await db.invoices.delete_many({})
        await db.schedules.delete_many({})
        await db.receipts.delete_many({})
    if await db.programs.count_documents({}) == 0:
        for p in DEFAULT_PROGRAMS:
            await db.programs.insert_one(Program(**p).model_dump())
    if await db.invoices.count_documents({}) == 0:
        await _seed_samples()
    return {"ok": True}


async def _seed_samples():
    samples = [
        ("Aisyah Putri Ramadhani", "24001", "1 Cendekia", "Budi Ramadhani", "PIJAR", 4500000, 850000, 6),
        ("Rafa Alghifari", "24002", "2 Bestari", "Siti Nurhaliza", "PURRFECT LEARNING", 3750000, 700000, 4),
        ("Kenzie Athaya", "24003", "Toddler A", "Dewi Lestari", "DAYCARE", 2500000, 1250000, 3),
        ("Nadia Kirana", "24004", "3 Cendekia", "Agus Salim", "PIJAR", 4500000, 850000, 12),
    ]
    for idx, (nama, nis, kelas, ortu, prog, dev, spp, bulan) in enumerate(samples):
        items = [
            {"description": "Biaya Pengembangan / Uang Gedung", "program": prog, "qty": 1, "unit_price": dev, "discount_type": "none", "discount_value": 0},
            {"description": f"Class Fee ({bulan} bulan)", "program": prog, "qty": bulan, "unit_price": spp, "discount_type": "percent" if idx == 0 else "none", "discount_value": 10 if idx == 0 else 0},
        ]
        inv = Invoice(
            student=Student(name=nama, nis=nis, kelas=kelas, parent_name=ortu, contact="+62 812-0000-000" + str(idx), email=""),
            invoice_date=datetime.now(timezone.utc).date().isoformat(),
            due_date=(datetime.now(timezone.utc) + timedelta(days=14)).date().isoformat(),
            items=[InvoiceItem(**it) for it in items],
            payment_type="installment" if idx < 2 else "full",
        )
        d = inv.model_dump()
        compute_invoice(d)
        apply_invoice_status(d)
        d["invoice_number"] = await next_number("INV", db.invoices, "invoice_number")
        await db.invoices.insert_one(d)
        if idx < 2:
            installments = build_installments(d["total"], 3, d["invoice_date"], 10)
            sched = Schedule(invoice_id=d["id"], invoice_number=d["invoice_number"], student_name=nama, total=d["total"], tenor=3, installments=[Installment(**i) for i in installments])
            await db.schedules.insert_one(sched.model_dump())
        if idx == 0:
            rec = Receipt(invoice_id=d["id"], invoice_number=d["invoice_number"], student_name=nama, amount=d["total"] / 3, terbilang=terbilang_rupiah(d["total"] / 3), payment_date=datetime.now(timezone.utc).date().isoformat(), method="Transfer BCA", reference="TRF-889912", termin=1)
            rec.receipt_number = await next_number("KWT", db.receipts, "receipt_number")
            await db.invoices.update_one({"id": d["id"]}, {"$set": {"amount_paid": d["total"] / 3, "status": "partial"}})
            await db.receipts.insert_one(rec.model_dump())


@api_router.get("/")
async def root():
    return {"message": "Mercusuar Invoice API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_seed():
    try:
        await seed()
    except Exception as e:
        logger.error(f"Seed error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
