import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInvoice } from "../lib/api";
import { rupiah, formatDate, FOUNDATION, statusMeta } from "../lib/format";
import { DocHeader, PrintBar, SignOff } from "../components/DocHeader";

export default function InvoicePrint() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  useEffect(() => { getInvoice(id).then(setInv); }, [id]);
  if (!inv) return <div className="text-center py-20 text-slate-500">Memuat…</div>;
  const st = statusMeta[inv.status] || statusMeta.unpaid;

  return (
    <div>
      <PrintBar testid="print-invoice-pdf-btn" />
      <div className="print-page max-w-4xl mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-sm border border-slate-200">
        <DocHeader />
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-black text-slate-900">FAKTUR TAGIHAN</h2>
            <p className="font-mono text-sm text-blue-900 font-semibold">{inv.invoice_number}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-md ${st.cls}`}>{st.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Ditagihkan Kepada</p>
            <p className="font-bold text-slate-900">{inv.student?.name}</p>
            <p className="text-slate-600">NIS: {inv.student?.nis || "-"} • {inv.student?.kelas}</p>
            <p className="text-slate-600">Wali: {inv.student?.parent_name || "-"}</p>
            <p className="text-slate-600">{inv.student?.contact}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-600">Tanggal Faktur: <span className="font-semibold">{formatDate(inv.invoice_date)}</span></p>
            <p className="text-slate-600">Jatuh Tempo: <span className="font-semibold">{formatDate(inv.due_date)}</span></p>
            <p className="text-slate-600">Pembayaran: <span className="font-semibold">{inv.payment_type === "installment" ? "Cicilan" : "Penuh"}</span></p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="text-left p-2.5 rounded-l-md">Deskripsi</th>
              <th className="text-right p-2.5">Qty</th>
              <th className="text-right p-2.5">Harga</th>
              <th className="text-right p-2.5">Diskon</th>
              <th className="text-right p-2.5 rounded-r-md">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2.5">{it.description}{it.program ? <span className="text-xs text-slate-400"> • {it.program}</span> : ""}</td>
                <td className="p-2.5 text-right font-mono">{it.qty}</td>
                <td className="p-2.5 text-right font-mono">{rupiah(it.unit_price)}</td>
                <td className="p-2.5 text-right font-mono text-rose-600">{it.line_discount ? "- " + rupiah(it.line_discount) : "-"}</td>
                <td className="p-2.5 text-right font-mono font-semibold">{rupiah(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-mono">{rupiah(inv.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Diskon</span><span className="font-mono text-rose-600">- {rupiah(inv.total_discount)}</span></div>
            <div className="flex justify-between text-lg font-black pt-2 border-t border-slate-300"><span>TOTAL</span><span className="font-mono text-blue-900">{rupiah(inv.total)}</span></div>
            {inv.amount_paid > 0 && (
              <>
                <div className="flex justify-between text-emerald-700"><span>Terbayar</span><span className="font-mono">- {rupiah(inv.amount_paid)}</span></div>
                <div className="flex justify-between font-bold"><span>Sisa</span><span className="font-mono">{rupiah(inv.total - inv.amount_paid)}</span></div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-slate-600">
          <span className="font-semibold text-blue-900">Pembayaran ditujukan ke:</span> {FOUNDATION.bank}
        </div>
        {inv.notes && <p className="text-xs text-slate-500 mt-3 italic">Catatan: {inv.notes}</p>}
        <SignOff />
        <p className="text-center text-[10px] text-slate-400 mt-8">Dokumen ini dicetak dari Sistem Manajemen Invoice Yayasan Mercusuar Harapan Mulia.</p>
      </div>
    </div>
  );
}
