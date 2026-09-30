export const rupiah = (n) => {
  const v = Math.round(Number(n) || 0);
  return "Rp " + v.toLocaleString("id-ID");
};

export const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
};

export const today = () => new Date().toISOString().slice(0, 10);

export const FOUNDATION = {
  name: "YAYASAN MERCUSUAR HARAPAN MULIA",
  sub: "Lembaga Pendidikan & Pengembangan Potensi Anak",
  address: "Jl. Ciater Raya Blok A1 No.2, BSD, Kel. Ciater, Kec. Serpong, Kota Tangerang Selatan, Banten 15310",
  contact: "Telp: (021) 538-9012  •  WhatsApp: +62 812-8899-7711  •  administrasi@mercusuarharapan.sch.id",
  bank: "BCA a.n. Yayasan Mercusuar Harapan Mulia — No. Rek. 217-088-9911",
};

export const PAYMENT_CATEGORIES = ["Biaya Pengembangan", "SPP Bulanan", "Pembayaran Lain"];

export const statusMeta = {  paid: { label: "LUNAS", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  partial: { label: "SEBAGIAN", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  unpaid: { label: "BELUM BAYAR", cls: "bg-rose-50 text-rose-700 border border-rose-200" },
  pending: { label: "MENUNGGU", cls: "bg-slate-100 text-slate-600 border border-slate-300" },
};
