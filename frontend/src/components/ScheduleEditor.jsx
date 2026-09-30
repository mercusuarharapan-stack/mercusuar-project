import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { createSchedule, updateSchedule } from "../lib/api";
import { rupiah, PAYMENT_CATEGORIES } from "../lib/format";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

const genDue = (startDate, i) => {
  const base = startDate ? new Date(startDate + "T00:00:00") : new Date();
  const d = new Date(base.getFullYear(), base.getMonth() + i, 10);
  return d.toISOString().slice(0, 10);
};

const buildRows = (total, tenor, startDate) => {
  const per = Math.round(total / tenor);
  const rows = [];
  let allocated = 0;
  for (let i = 0; i < tenor; i++) {
    const amount = i < tenor - 1 ? per : Math.round(total - allocated);
    allocated += amount;
    rows.push({
      termin: i + 1,
      due_date: genDue(startDate, i),
      amount,
      category: i === 0 ? "Biaya Pengembangan" : "SPP Bulanan",
      note: "",
      status: "pending",
      paid_amount: 0,
    });
  }
  return rows;
};

export const ScheduleEditor = ({ open, onOpenChange, invoices, invoice, schedule, onDone }) => {
  const editing = !!schedule;
  const [invoiceId, setInvoiceId] = useState(invoice?.id || schedule?.invoice_id || "");
  const [tenor, setTenor] = useState(schedule?.tenor || 3);
  const [rows, setRows] = useState(schedule?.installments || []);
  const [saving, setSaving] = useState(false);

  const selectedInvoice = useMemo(
    () => invoices.find((i) => i.id === invoiceId) || invoice || null,
    [invoices, invoiceId, invoice]
  );
  const total = schedule?.total ?? selectedInvoice?.total ?? 0;

  useEffect(() => {
    if (editing) return;
    if (selectedInvoice) setRows(buildRows(selectedInvoice.total, tenor, selectedInvoice.invoice_date));
  }, [invoiceId, tenor, editing]); // eslint-disable-line

  const setRow = (idx, patch) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const sum = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const sisa = total - sum;

  const save = async () => {
    if (!invoiceId) { toast.error("Pilih invoice terlebih dahulu"); return; }
    if (rows.length === 0) { toast.error("Tidak ada termin"); return; }
    if (Math.abs(sisa) > 0.5) {
      toast.warning(`Total termin belum sesuai. Selisih ${rupiah(Math.abs(sisa))}`);
    }
    setSaving(true);
    const installments = rows.map((r, i) => ({
      termin: i + 1,
      due_date: r.due_date,
      amount: Number(r.amount) || 0,
      category: r.category,
      note: r.category === "Pembayaran Lain" ? r.note : "",
      status: r.status || "pending",
      paid_amount: r.paid_amount || 0,
    }));
    try {
      if (editing) {
        await updateSchedule(schedule.id, { tenor: installments.length, installments });
        toast.success("Jadwal cicilan diperbarui");
      } else {
        await createSchedule({ invoice_id: invoiceId, tenor: installments.length, installments });
        toast.success("Jadwal cicilan dibuat");
      }
      onOpenChange(false);
      onDone && onDone();
    } catch (e) {
      toast.error("Gagal menyimpan jadwal");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="schedule-editor-dialog">
        <DialogHeader><DialogTitle>{editing ? "Edit Jadwal Cicilan" : "Buat Jadwal Cicilan"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <Label>Invoice</Label>
                <Select value={invoiceId} onValueChange={setInvoiceId}>
                  <SelectTrigger data-testid="schedule-invoice-select"><SelectValue placeholder="Pilih invoice…" /></SelectTrigger>
                  <SelectContent>{invoices.map((i) => <SelectItem key={i.id} value={i.id}>{i.invoice_number} • {i.student?.name} • {rupiah(i.total)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jumlah Termin</Label>
                <Select value={String(tenor)} onValueChange={(v) => setTenor(Number(v))}>
                  <SelectTrigger data-testid="schedule-tenor-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{[2, 3, 4, 5, 6, 8, 10, 12].map((t) => <SelectItem key={t} value={String(t)}>{t}x cicilan</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {selectedInvoice && !editing && (
            <Button variant="outline" size="sm" className="border-dashed" onClick={() => setRows(buildRows(selectedInvoice.total, tenor, selectedInvoice.invoice_date))} data-testid="schedule-autofill-btn">
              <Wand2 className="w-3.5 h-3.5 mr-1" /> Bagi rata otomatis
            </Button>
          )}

          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3" data-testid={`schedule-row-${idx}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Termin {idx + 1}</span>
                  {r.status === "paid" && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">LUNAS</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Tanggal Jatuh Tempo</Label>
                    <Input type="date" value={r.due_date} onChange={(e) => setRow(idx, { due_date: e.target.value })} data-testid={`schedule-due-${idx}`} />
                  </div>
                  <div>
                    <Label className="text-xs">Nominal (Rp)</Label>
                    <Input type="number" value={r.amount} onChange={(e) => setRow(idx, { amount: e.target.value })} data-testid={`schedule-amount-${idx}`} />
                  </div>
                  <div>
                    <Label className="text-xs">Jenis Pembayaran</Label>
                    <Select value={r.category} onValueChange={(v) => setRow(idx, { category: v })}>
                      <SelectTrigger data-testid={`schedule-category-${idx}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {r.category === "Pembayaran Lain" && (
                  <div className="mt-2">
                    <Label className="text-xs">Keterangan</Label>
                    <Input value={r.note} onChange={(e) => setRow(idx, { note: e.target.value })} placeholder="cth: Uang kegiatan, seragam…" data-testid={`schedule-note-${idx}`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1 sticky bottom-0">
            <div className="flex justify-between"><span className="text-slate-500">Total Invoice</span><span className="font-mono font-semibold">{rupiah(total)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Termin</span><span className="font-mono font-semibold" data-testid="schedule-sum-display">{rupiah(sum)}</span></div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
              <span>Sisa</span>
              <span className={`font-mono ${Math.abs(sisa) < 0.5 ? "text-emerald-700" : "text-rose-600"}`} data-testid="schedule-remaining-display">{rupiah(sisa)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button className="bg-blue-900 hover:bg-blue-950" onClick={save} disabled={saving} data-testid="schedule-save-submit">
            {saving ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Buat Jadwal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
