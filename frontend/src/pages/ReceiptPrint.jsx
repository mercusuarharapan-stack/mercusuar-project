import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getReceipt } from "../lib/api";
import { rupiah, formatDate, FOUNDATION } from "../lib/format";
import { DocHeader, PrintBar } from "../components/DocHeader";

export default function ReceiptPrint() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  useEffect(() => { getReceipt(id).then(setR); }, [id]);
  if (!r) return <div className="text-center py-20 text-slate-500">Memuat…</div>;

  return (
    <div>
      <PrintBar testid="print-receipt-pdf-btn" />
      <div className="print-page max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-sm border border-slate-200">
        <DocHeader />
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-black text-slate-900">KUITANSI</h2>
          <p className="font-mono text-sm text-blue-900 font-semibold">{r.receipt_number}</p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex">
            <span className="w-48 text-slate-500">Telah diterima dari</span>
            <span className="flex-1 font-bold text-slate-900 border-b border-dotted border-slate-300 pb-1">{r.student_name}</span>
          </div>
          <div className="flex">
            <span className="w-48 text-slate-500">Uang sejumlah</span>
            <span className="flex-1 font-semibold italic text-slate-800 border-b border-dotted border-slate-300 pb-1 capitalize">{r.terbilang}</span>
          </div>
          <div className="flex">
            <span className="w-48 text-slate-500">Untuk pembayaran</span>
            <span className="flex-1 text-slate-800 border-b border-dotted border-slate-300 pb-1">
              Tagihan {r.invoice_number}{r.termin ? ` — Cicilan Termin ${r.termin}` : ""}
            </span>
          </div>
          <div className="flex">
            <span className="w-48 text-slate-500">Jenis pembayaran</span>
            <span className="flex-1 font-semibold text-slate-800 border-b border-dotted border-slate-300 pb-1">
              {r.category || "Pembayaran Invoice"}{r.note ? ` — ${r.note}` : ""}
            </span>
          </div>
          <div className="flex">
            <span className="w-48 text-slate-500">Metode / Referensi</span>
            <span className="flex-1 text-slate-800 border-b border-dotted border-slate-300 pb-1">{r.method}{r.reference ? ` — ${r.reference}` : ""}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-10">
          <div className="bg-blue-900 text-white rounded-xl px-6 py-4">
            <p className="text-xs uppercase tracking-wider opacity-80">Jumlah Diterima</p>
            <p className="text-3xl font-black font-mono">{rupiah(r.amount)}</p>
          </div>
          <div className="text-center text-sm">
            <p className="text-slate-600">Tangerang Selatan, {formatDate(r.payment_date)}</p>
            <p className="mt-16 border-t border-slate-400 pt-1 w-56">Penerima / Staf Keuangan</p>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-8">{FOUNDATION.name} • Kuitansi ini sah sebagai bukti pembayaran resmi.</p>
      </div>
    </div>
  );
}
