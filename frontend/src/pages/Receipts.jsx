import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReceipts, deleteReceipt } from "../lib/api";
import { rupiah, formatDate } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Receipts() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const load = () => getReceipts().then(setItems);
  useEffect(() => { load(); }, []);

  const remove = async (id) => { await deleteReceipt(id); toast.success("Tanda terima dihapus"); load(); };
  const filtered = items.filter((r) => (r.student_name || "").toLowerCase().includes(q.toLowerCase()) || (r.receipt_number || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5" data-testid="receipts-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900">Tanda Terima Pembayaran</h1>
        <p className="text-slate-500 text-sm mt-1">Kuitansi resmi dibuat otomatis setiap pembayaran dicatat.</p>
      </div>
      <Input placeholder="Cari siswa atau nomor kuitansi…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" data-testid="receipt-search-input" />
      <Card className="border-slate-200/80 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>No. Kuitansi</TableHead><TableHead>Siswa</TableHead>
              <TableHead>Tgl Bayar</TableHead><TableHead>Metode</TableHead>
              <TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">Belum ada tanda terima.</TableCell></TableRow>}
            {filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50/80" data-testid={`receipt-row-${r.id}`}>
                <TableCell className="font-mono text-xs font-semibold text-blue-900">{r.receipt_number}</TableCell>
                <TableCell className="font-semibold text-slate-800">{r.student_name}{r.termin ? <span className="text-xs text-slate-400"> • Termin {r.termin}</span> : ""}</TableCell>
                <TableCell className="text-sm text-slate-600">{formatDate(r.payment_date)}</TableCell>
                <TableCell className="text-sm text-slate-600">{r.method}</TableCell>
                <TableCell className="text-right font-mono font-semibold text-emerald-700">{rupiah(r.amount)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => nav(`/receipts/${r.id}/print`)} data-testid={`print-receipt-${r.id}`}><Printer className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="ghost" data-testid={`delete-receipt-${r.id}`}><Trash2 className="w-4 h-4 text-rose-600" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Hapus tanda terima?</AlertDialogTitle><AlertDialogDescription>Kuitansi {r.receipt_number} akan dihapus dan pembayaran dikembalikan dari invoice terkait.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => remove(r.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
