import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { recordPayment } from "../lib/api";
import { rupiah, today } from "../lib/format";
import { toast } from "sonner";

export const PaymentDialog = ({ open, onOpenChange, invoice, schedule, termin, onDone }) => {
  const outstanding = invoice ? invoice.total - invoice.amount_paid : 0;
  const preset = termin && schedule ? schedule.installments.find((i) => i.termin === termin)?.amount : outstanding;
  const [amount, setAmount] = useState(preset || 0);
  const [method, setMethod] = useState("Transfer BCA");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) { toast.error("Masukkan nominal pembayaran"); return; }
    setSaving(true);
    try {
      const rec = await recordPayment({
        invoice_id: invoice.id, amount: Number(amount), method, reference,
        payment_date: date, schedule_id: schedule?.id || "", termin: termin ?? null,
      });
      toast.success(`Pembayaran tercatat • ${rec.receipt_number}`);
      onOpenChange(false);
      onDone && onDone(rec);
    } catch (e) {
      toast.error("Gagal mencatat pembayaran");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="payment-dialog">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="font-semibold">{invoice?.student?.name}</p>
            <p className="text-slate-500 font-mono text-xs">{invoice?.invoice_number}</p>
            <p className="text-slate-600 mt-1">Sisa tagihan: <span className="font-mono font-semibold">{rupiah(outstanding)}</span>{termin ? ` • Termin ${termin}` : ""}</p>
          </div>
          <div>
            <Label>Nominal (Rp)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="payment-amount-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Bayar</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="payment-date-input" />
            </div>
            <div>
              <Label>Metode</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger data-testid="payment-method-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer BCA">Transfer BCA</SelectItem>
                  <SelectItem value="Transfer Mandiri">Transfer Mandiri</SelectItem>
                  <SelectItem value="Kas Tunai">Kas Tunai</SelectItem>
                  <SelectItem value="QRIS Yayasan">QRIS Yayasan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>No. Referensi / Rekening Pengirim</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} data-testid="payment-reference-input" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="bg-blue-900 hover:bg-blue-950" data-testid="payment-submit-btn">
            {saving ? "Menyimpan…" : "Simpan & Buat Kuitansi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
