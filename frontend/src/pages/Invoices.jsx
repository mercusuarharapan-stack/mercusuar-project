import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices, deleteInvoice } from "../lib/api";
import { rupiah, formatDate, statusMeta } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { PaymentDialog } from "../components/PaymentDialog";
import { Plus, Eye, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function Invoices() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [payInv, setPayInv] = useState(null);

  const load = () => getInvoices().then(setItems);
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await deleteInvoice(id);
    toast.success("Invoice dihapus");
    load();
  };

  const filtered = items.filter((i) =>
    (i.student?.name || "").toLowerCase().includes(q.toLowerCase()) ||
    (i.invoice_number || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5" data-testid="invoices-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900">Invoice & SPP Siswa</h1>
          <p className="text-slate-500 text-sm mt-1">Buat, kelola, dan cetak tagihan siswa.</p>
        </div>
        <Button className="bg-blue-900 hover:bg-blue-950" onClick={() => nav("/invoices/new")} data-testid="create-invoice-button">
          <Plus className="w-4 h-4 mr-1" /> Buat Invoice Baru
        </Button>
      </div>

      <Input placeholder="Cari nama siswa atau nomor invoice…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" data-testid="invoice-search-input" />

      <Card className="border-slate-200/80 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>No. Invoice</TableHead>
              <TableHead>Siswa</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Terbayar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-10">Belum ada invoice.</TableCell></TableRow>
            )}
            {filtered.map((inv) => {
              const st = statusMeta[inv.status] || statusMeta.unpaid;
              return (
                <TableRow key={inv.id} data-testid={`invoice-row-${inv.id}`} className="hover:bg-slate-50/80">
                  <TableCell className="font-mono text-xs font-semibold text-blue-900">{inv.invoice_number}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800">{inv.student?.name}</p>
                    <p className="text-xs text-slate-500">{inv.student?.kelas}</p>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(inv.due_date)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{rupiah(inv.total)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-700">{rupiah(inv.amount_paid)}</TableCell>
                  <TableCell><span className={`text-[10px] font-bold px-2 py-1 rounded-md ${st.cls}`}>{st.label}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Catat Pembayaran" onClick={() => setPayInv(inv)} data-testid={`pay-invoice-${inv.id}`} disabled={inv.status === "paid"}>
                        <Wallet className="w-4 h-4 text-emerald-700" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Lihat / Cetak" onClick={() => nav(`/invoices/${inv.id}/print`)} data-testid={`view-invoice-${inv.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => nav(`/invoices/${inv.id}/edit`)} data-testid={`edit-invoice-${inv.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" title="Hapus" data-testid={`delete-invoice-${inv.id}`}><Trash2 className="w-4 h-4 text-rose-600" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus invoice ini?</AlertDialogTitle>
                            <AlertDialogDescription>Invoice {inv.invoice_number}, jadwal cicilan, dan tanda terima terkait akan dihapus permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => remove(inv.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {payInv && (
        <PaymentDialog open={!!payInv} onOpenChange={(o) => !o && setPayInv(null)} invoice={payInv} onDone={() => { setPayInv(null); load(); }} />
      )}
    </div>
  );
}
