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
  sub: "Pijar Preschool & Purrfect Learning ",
  address: "Jl. Ciater Raya Blok A1 No.2, BSD, Kel. Ciater, Kec. Serpong, Kota Tangerang Selatan, Banten 15310",
  contact: "  •  Whatsapp: +62 821 2120 3853  •  mercusuarharapan@gmail.com",
  bank: "Bank Mandiri a.n. Yayasan Mercusuar Harapan Mulia — No. Rek. 164-005-2588-888",
};

export const PAYMENT_CATEGORIES = ["Biaya Pengembangan", "Class Fee", "Pembayaran Lain"];

export const statusMeta = {  paid: { label: "PAID", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  partial: { label: "PAYING", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  unpaid: { label: "ISSUED", cls: "bg-rose-50 text-rose-700 border border-rose-200" },
  pending: { label: "WAITING", cls: "bg-slate-100 text-slate-600 border border-slate-300" },
};
