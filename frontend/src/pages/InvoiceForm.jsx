import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPrograms, getInvoice, createInvoice, updateInvoice, createSchedule } from "../lib/api";
import { rupiah, today } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Trash2, ArrowLeft, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

const emptyItem = () => ({ description: "", program: "", qty: 1, unit_price: 0, discount_type: "none", discount_value: 0 });

const calcItem = (it) => {
  const ls = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
  const dv = Number(it.discount_value) || 0;
  const ld = it.discount_type === "nominal" ? Math.min(dv, ls) : it.discount_type === "percent" ? (ls * dv) / 100 : 0;
  return { ls, ld: Math.min(ld, ls), lt: ls - Math.min(ld, ls) };
};

export default function InvoiceForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const editing = !!id;
  const [programs, setPrograms] = useState([]);
  const [student, setStudent] = useState({ name: "", nis: "", kelas: "", parent_name: "", contact: "", email: "" });
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [items, setItems] = useState([emptyItem()]);
  const [gType, setGType] = useState("none");
  const [gValue, setGValue] = useState(0);
  const [paymentType, setPaymentType] = useState("full");
  const [tenor, setTenor] = useState(3);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPrograms().then(setPrograms);
    if (editing) {
      getInvoice(id).then((inv) => {
        setStudent(inv.student || student);
        setInvoiceDate(inv.invoice_date || today());
        setDueDate(inv.due_date || today());
        setItems(inv.items?.length ? inv.items : [emptyItem()]);
        setGType(inv.global_discount_type || "none");
        setGValue(inv.global_discount_value || 0);
        setPaymentType(inv.payment_type || "full");
        setNotes(inv.notes || "");
      });
    }
  }, [id]);

  const setItem = (idx, patch) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const loadProgram = (progName) => {
    const p = programs.find((x) => x.name === progName);
    if (!p) return;
    setItems([
      { description: "Biaya Pengembangan / Uang Gedung", program: p.name, qty: 1, unit_price: p.biaya_pengembangan, discount_type: "none", discount_value: 0 },
      { description: `SPP Bulanan (${p.periode_bulan} bulan)`, program: p.name, qty: p.periode_bulan, unit_price: p.spp_bulanan, discount_type: "none", discount_value: 0 },
    ]);
    toast.success(`Biaya standar ${p.name} dimuat`);
  };

  const subtotal = items.reduce((s, it) => s + calcItem(it).ls, 0);
  const lineDisc = items.reduce((s, it) => s + calcItem(it).ld, 0);
  const afterLine = items.reduce((s, it) => s + calcItem(it).lt, 0);
  const globalDisc = gType === "nominal" ? Math.min(Number(gValue) || 0, afterLine) : gType === "percent" ? (afterLine * (Number(gValue) || 0)) / 100 : 0;
  const total = afterLine - globalDisc;

  const save = async () => {
    if (!student.name) { toast.error("Nama siswa wajib diisi"); return; }
    if (items.every((it) => !it.description)) { toast.error("Tambahkan minimal satu item"); return; }
    setSaving(true);
    const payload = {
      student, invoice_date: invoiceDate, due_date: dueDate,
      items: items.filter((it) => it.description).map((it) => ({ ...it, qty: Number(it.qty), unit_price: Number(it.unit_price), discount_value: Number(it.discount_value) })),
      global_discount_type: gType, global_discount_value: Number(gValue) || 0,
      payment_type: paymentType, notes,
    };
    try {
      const inv = editing ? await updateInvoice(id, payload) : await createInvoice(payload);
      if (paymentType === "installment") {
        await createSchedule({ invoice_id: inv.id, tenor: Number(tenor), start_date: invoiceDate, day_of_month: 10 });
      }
      toast.success(editing ? "Invoice diperbarui" : `Invoice dibuat • ${inv.invoice_number}`);
      nav(`/invoices/${inv.id}/print`);
    } catch (e) {
      toast.error("Gagal menyimpan invoice");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5" data-testid="invoice-form-page">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => nav("/invoices")}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-black font-heading text-slate-900">{editing ? "Edit Invoice" : "Buat Invoice Baru"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <Card className="p-5 border-slate-200/80">
            <h3 className="font-heading font-bold text-slate-900 mb-4">Data Siswa</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Nama Siswa *</Label><Input value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} data-testid="invoice-student-name-input" /></div>
              <div><Label>NIS</Label><Input value={student.nis} onChange={(e) => setStudent({ ...student, nis: e.target.value })} data-testid="invoice-student-nis-input" /></div>
              <div><Label>Kelas / Rombel</Label><Input value={student.kelas} onChange={(e) => setStudent({ ...student, kelas: e.target.value })} data-testid="invoice-student-kelas-input" /></div>
              <div><Label>Nama Orang Tua / Wali</Label><Input value={student.parent_name} onChange={(e) => setStudent({ ...student, parent_name: e.target.value })} data-testid="invoice-parent-input" /></div>
              <div><Label>Kontak (WA/Telp)</Label><Input value={student.contact} onChange={(e) => setStudent({ ...student, contact: e.target.value })} data-testid="invoice-contact-input" /></div>
              <div><Label>Email</Label><Input value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} data-testid="invoice-email-input" /></div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200/80">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-heading font-bold text-slate-900">Rincian Tagihan</h3>
              <div className="flex items-center gap-2">
                <Select onValueChange={loadProgram}>
                  <SelectTrigger className="w-56 h-9" data-testid="invoice-program-select"><SelectValue placeholder="Muat biaya standar program…" /></SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => <SelectItem key={p.id} value={p.name}><Sparkles className="w-3 h-3 inline mr-1" />{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => {
                const c = calcItem(it);
                return (
                  <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2" data-testid={`invoice-item-${idx}`}>
                    <div className="flex gap-2">
                      <Input placeholder="Deskripsi item" value={it.description} onChange={(e) => setItem(idx, { description: e.target.value })} className="flex-1" data-testid={`item-desc-${idx}`} />
                      <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} data-testid={`item-remove-${idx}`}><Trash2 className="w-4 h-4 text-rose-600" /></Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                      <div><Label className="text-xs">Qty</Label><Input type="number" value={it.qty} onChange={(e) => setItem(idx, { qty: e.target.value })} data-testid={`item-qty-${idx}`} /></div>
                      <div><Label className="text-xs">Harga Satuan</Label><Input type="number" value={it.unit_price} onChange={(e) => setItem(idx, { unit_price: e.target.value })} data-testid={`item-price-${idx}`} /></div>
                      <div>
                        <Label className="text-xs">Diskon</Label>
                        <Select value={it.discount_type} onValueChange={(v) => setItem(idx, { discount_type: v })}>
                          <SelectTrigger data-testid={`item-disc-type-${idx}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tanpa</SelectItem>
                            <SelectItem value="nominal">Rp</SelectItem>
                            <SelectItem value="percent">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Nilai Diskon</Label><Input type="number" value={it.discount_value} disabled={it.discount_type === "none"} onChange={(e) => setItem(idx, { discount_value: e.target.value })} data-testid={`item-disc-value-${idx}`} /></div>
                      <div className="text-right"><Label className="text-xs">Jumlah</Label><p className="font-mono font-semibold text-slate-800 h-9 flex items-center justify-end" data-testid={`item-total-${idx}`}>{rupiah(c.lt)}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="mt-3 w-full border-dashed" onClick={addItem} data-testid="invoice-add-item-btn"><Plus className="w-4 h-4 mr-1" /> Tambah Item</Button>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="p-5 border-slate-200/80 sticky top-24 space-y-4">
            <h3 className="font-heading font-bold text-slate-900">Ringkasan</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tgl Invoice</Label><Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} data-testid="invoice-date-input" /></div>
              <div><Label className="text-xs">Jatuh Tempo</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} data-testid="invoice-due-input" /></div>
            </div>
            <div>
              <Label className="text-xs">Diskon Total (Beasiswa/Saudara)</Label>
              <div className="flex gap-2">
                <Select value={gType} onValueChange={setGType}>
                  <SelectTrigger className="w-24" data-testid="invoice-global-disc-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa</SelectItem>
                    <SelectItem value="nominal">Rp</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" value={gValue} disabled={gType === "none"} onChange={(e) => setGValue(e.target.value)} data-testid="invoice-global-disc-value" />
              </div>
            </div>
            <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-mono" data-testid="invoice-subtotal-display">{rupiah(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Diskon</span><span className="font-mono text-rose-600" data-testid="invoice-total-discount-display">- {rupiah(lineDisc + globalDisc)}</span></div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-slate-100"><span>Total</span><span className="font-mono text-blue-900" data-testid="invoice-grand-total-display">{rupiah(total)}</span></div>
            </div>
            <div>
              <Label className="text-xs">Metode Pembayaran</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger data-testid="invoice-payment-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Bayar Penuh</SelectItem>
                  <SelectItem value="installment">Cicilan / Angsuran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentType === "installment" && (
              <div>
                <Label className="text-xs">Jumlah Termin</Label>
                <Select value={String(tenor)} onValueChange={(v) => setTenor(Number(v))}>
                  <SelectTrigger data-testid="invoice-tenor-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{[2, 3, 4, 6, 10, 12].map((t) => <SelectItem key={t} value={String(t)}>{t}x cicilan • {rupiah(total / t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <Textarea placeholder="Catatan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="invoice-notes-input" />
            <Button className="w-full bg-blue-900 hover:bg-blue-950" onClick={save} disabled={saving} data-testid="invoice-save-submit-btn">
              <Save className="w-4 h-4 mr-1" /> {saving ? "Menyimpan…" : "Simpan Invoice"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
