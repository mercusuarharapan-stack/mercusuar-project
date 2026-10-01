import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSchedules, getInvoices, deleteSchedule, getInvoice } from "../lib/api";
import { rupiah, formatDate, statusMeta } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { PaymentDialog } from "../components/PaymentDialog";
import { ScheduleEditor } from "../components/ScheduleEditor";
import { Printer, Trash2, Wallet, Plus, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Schedules() {
  const nav = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [open, setOpenId] = useState(null);
  const [pay, setPay] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);

  const load = () => { getSchedules().then(setSchedules); getInvoices().then(setInvoices); };
  useEffect(() => { load(); }, []);

  const remove = async (id) => { await deleteSchedule(id); toast.success("Jadwal dihapus"); load(); };

  const openPay = async (s, ins) => {
    const inv = await getInvoice(s.invoice_id);
    setPay({ invoice: inv, schedule: s, termin: ins.termin });
  };

  const openCreate = () => { setEditSchedule(null); setEditorOpen(true); };
  const openEdit = (s) => { setEditSchedule(s); setEditorOpen(true); };

  return (
    <div className="space-y-5" data-testid="schedules-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900">Jadwal Pembayaran & Cicilan</h1>
          <p className="text-slate-500 text-sm mt-1">Atur nominal & jenis pembayaran tiap termin, lalu catat pembayaran.</p>
        </div>
        <Button className="bg-blue-900 hover:bg-blue-950" onClick={openCreate} data-testid="create-schedule-button"><Plus className="w-4 h-4 mr-1" /> Buat Jadwal</Button>
      </div>

      <div className="space-y-3">
        {schedules.length === 0 && <Card className="p-10 text-center text-slate-400 border-slate-200/80">Belum ada jadwal cicilan.</Card>}
        {schedules.map((s) => {
          const paidCount = s.installments.filter((i) => i.status === "paid").length;
          const isOpen = open === s.id;
          return (
            <Card key={s.id} className="border-slate-200/80 overflow-hidden" data-testid={`schedule-card-${s.id}`}>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80" onClick={() => setOpenId(isOpen ? null : s.id)}>
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <div>
                    <p className="font-semibold text-slate-800">{s.student_name}</p>
                    <p className="text-xs font-mono text-blue-900">{s.invoice_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono font-semibold text-slate-800">{rupiah(s.total)}</p>
                    <p className="text-xs text-slate-500">{paidCount}/{s.tenor} termin PAID</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(s); }} data-testid={`edit-schedule-${s.id}`}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); nav(`/schedules/${s.id}/print`); }} data-testid={`print-schedule-${s.id}`}><Printer className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()} data-testid={`delete-schedule-${s.id}`}><Trash2 className="w-4 h-4 text-rose-600" /></Button></AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader><AlertDialogTitle>Hapus jadwal cicilan?</AlertDialogTitle><AlertDialogDescription>Jadwal untuk {s.invoice_number} akan dihapus.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => remove(s.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {isOpen && (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead>Termin</TableHead><TableHead>Jenis Pembayaran</TableHead><TableHead>Jatuh Tempo</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Dibayar</TableHead>
                      <TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.installments.map((ins) => {
                      const st = statusMeta[ins.status] || statusMeta.pending;
                      return (
                        <TableRow key={ins.termin}>
                          <TableCell className="font-semibold">Termin {ins.termin}</TableCell>
                          <TableCell className="text-sm">
                            {ins.category || "-"}
                            {ins.note ? <span className="text-xs text-slate-400 block">{ins.note}</span> : null}
                          </TableCell>
                          <TableCell>{formatDate(ins.due_date)}</TableCell>
                          <TableCell className="text-right font-mono">{rupiah(ins.amount)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-700">{rupiah(ins.paid_amount)}</TableCell>
                          <TableCell><span className={`text-[10px] font-bold px-2 py-1 rounded-md ${st.cls}`}>{st.label}</span></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" disabled={ins.status === "paid"} onClick={() => openPay(s, ins)} data-testid={`pay-termin-${s.id}-${ins.termin}`}>
                              <Wallet className="w-3.5 h-3.5 mr-1" /> Bayar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          );
        })}
      </div>

      {editorOpen && (
        <ScheduleEditor open={editorOpen} onOpenChange={setEditorOpen} invoices={invoices} schedule={editSchedule} onDone={load} />
      )}
      {pay && <PaymentDialog open={!!pay} onOpenChange={(o) => !o && setPay(null)} invoice={pay.invoice} schedule={pay.schedule} termin={pay.termin} onDone={() => { setPay(null); load(); }} />}
    </div>
  );
}
