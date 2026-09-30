import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSchedule } from "../lib/api";
import { rupiah, formatDate, statusMeta } from "../lib/format";
import { DocHeader, PrintBar, SignOff } from "../components/DocHeader";

export default function SchedulePrint() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  useEffect(() => { getSchedule(id).then(setS); }, [id]);
  if (!s) return <div className="text-center py-20 text-slate-500">Memuat…</div>;

  return (
    <div>
      <PrintBar testid="print-schedule-pdf-btn" />
      <div className="print-page max-w-4xl mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-sm border border-slate-200">
        <DocHeader />
        <div className="text-center mb-6">
          <h2 className="font-heading text-2xl font-black text-slate-900">LEMBAR KOMITMEN JADWAL CICILAN</h2>
          <p className="font-mono text-sm text-blue-900 font-semibold">Ref. {s.invoice_number}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <p className="text-slate-600">Nama Siswa: <span className="font-bold text-slate-900">{s.student_name}</span></p>
          <p className="text-slate-600 text-right">Total Tagihan: <span className="font-bold font-mono text-blue-900">{rupiah(s.total)}</span></p>
          <p className="text-slate-600">Jumlah Termin: <span className="font-semibold">{s.tenor}x</span></p>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="text-left p-2.5 rounded-l-md">Termin</th>
              <th className="text-left p-2.5">Jenis Pembayaran</th>
              <th className="text-left p-2.5">Tanggal Jatuh Tempo</th>
              <th className="text-right p-2.5">Jumlah Angsuran</th>
              <th className="text-center p-2.5 rounded-r-md">Status</th>
            </tr>
          </thead>
          <tbody>
            {s.installments.map((ins) => (
              <tr key={ins.termin} className="border-b border-slate-100">
                <td className="p-2.5 font-semibold">Termin ke-{ins.termin}</td>
                <td className="p-2.5">{ins.category || "-"}{ins.note ? <span className="text-xs text-slate-400 block">{ins.note}</span> : null}</td>
                <td className="p-2.5">{formatDate(ins.due_date)}</td>
                <td className="p-2.5 text-right font-mono font-semibold">{rupiah(ins.amount)}</td>
                <td className="p-2.5 text-center">{(statusMeta[ins.status] || statusMeta.pending).label}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-slate-500 italic">Dengan menandatangani lembar ini, orang tua/wali menyetujui jadwal pembayaran di atas dan berkomitmen melunasi setiap termin tepat waktu.</p>
        <SignOff />
      </div>
    </div>
  );
}
