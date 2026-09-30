import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "../lib/api";
import { rupiah, formatDate } from "../lib/format";
import { Card } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { FileText, Wallet, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";

const COLORS = ["#1e3a8a", "#d97706", "#0f766e", "#0284c7", "#7c3aed"];

const Kpi = ({ icon: Icon, label, value, sub, tone, testid }) => (
  <Card className="p-5 border-slate-200/80" data-testid={testid}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-black font-heading text-slate-900 mt-2">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { getStats().then(setS); }, []);
  if (!s) return <div className="text-slate-500 py-20 text-center">Memuat ringkasan…</div>;

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900">Ringkasan Keuangan Yayasan</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau tagihan, pembayaran, dan cicilan siswa secara langsung.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi testid="stat-total-invoices" icon={FileText} label="Total Tagihan" value={rupiah(s.total_billed)} sub={`${s.invoice_count} invoice diterbitkan`} tone="bg-blue-50 text-blue-800" />
        <Kpi testid="stat-total-paid" icon={Wallet} label="Total Terbayar" value={rupiah(s.total_paid)} sub={`${s.receipt_count} tanda terima`} tone="bg-emerald-50 text-emerald-700" />
        <Kpi testid="stat-total-receivable" icon={AlertTriangle} label="Sisa Piutang" value={rupiah(s.receivable)} sub="Belum tertagih" tone="bg-rose-50 text-rose-700" />
        <Kpi testid="stat-ratio" icon={TrendingUp} label="Rasio Pembayaran" value={`${s.ratio}%`} sub="Terbayar dari total" tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 border-slate-200/80">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Pendapatan per Program</h3>
          {s.by_program.length === 0 ? (
            <p className="text-slate-400 text-sm py-10 text-center">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={s.by_program}>
                <XAxis dataKey="program" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v / 1000000}jt`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => rupiah(v)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {s.by_program.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 border-slate-200/80">
          <h3 className="font-heading font-bold text-slate-900 mb-3">Jatuh Tempo Mendekat</h3>
          <div className="space-y-2" data-testid="upcoming-list">
            {s.upcoming.length === 0 && <p className="text-slate-400 text-sm">Tidak ada cicilan jatuh tempo.</p>}
            {s.upcoming.map((u, i) => (
              <Link to="/schedules" key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{u.student_name}</p>
                  <p className="text-xs text-slate-500">Termin {u.termin} • {formatDate(u.due_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-slate-800">{rupiah(u.amount)}</p>
                  {u.overdue && <p className="text-[10px] font-bold text-rose-600">TERLEWAT</p>}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-slate-900">Pembayaran Terbaru</h3>
          <Link to="/receipts" className="text-sm text-blue-800 font-semibold flex items-center gap-1">Lihat semua <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="space-y-1">
          {s.recent_receipts.length === 0 && <p className="text-slate-400 text-sm">Belum ada pembayaran.</p>}
          {s.recent_receipts.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.student_name}</p>
                <p className="text-xs text-slate-500 font-mono">{r.receipt_number}</p>
              </div>
              <p className="text-sm font-mono font-semibold text-emerald-700">{rupiah(r.amount)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
