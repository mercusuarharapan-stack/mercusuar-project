import { useEffect, useState } from "react";
import { getPrograms, createProgram, updateProgram, deleteProgram, getSettings, updateSettings } from "../lib/api";
import { rupiah, FOUNDATION } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { LighthouseLogo } from "../components/Brand";
import { Plus, Pencil, Trash2, GraduationCap, Upload } from "lucide-react";
import { toast } from "sonner";

const empty = { name: "", label: "", biaya_pengembangan: 0, spp_bulanan: 0, periode_bulan: 12, biaya_pendaftaran: 0, badge_color: "emerald" };

export default function MasterData() {
  const [programs, setPrograms] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [logo, setLogo] = useState("");

  const load = () => getPrograms().then(setPrograms);
  useEffect(() => { load(); getSettings().then((s) => setLogo(s.logo || "")).catch(() => {}); }, []);

  const onLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar (PNG/JPG)"); return; }
    if (file.size > 1.5 * 1024 * 1024) { toast.error("Ukuran logo maksimal 1.5 MB"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setLogo(dataUrl);
      try { await updateSettings({ logo: dataUrl }); toast.success("Logo yayasan diperbarui — akan tampil di semua dokumen cetak"); }
      catch { toast.error("Gagal menyimpan logo"); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeLogo = async () => {
    setLogo("");
    await updateSettings({ logo: "" });
    toast.success("Logo dihapus, kembali ke placeholder");
  };

  const openNew = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (p) => { setForm(p); setEditId(p.id); setOpen(true); };

  const save = async () => {
    if (!form.name) { toast.error("Nama program wajib diisi"); return; }
    const payload = { ...form, biaya_pengembangan: Number(form.biaya_pengembangan), spp_bulanan: Number(form.spp_bulanan), periode_bulan: Number(form.periode_bulan), biaya_pendaftaran: Number(form.biaya_pendaftaran) };
    if (editId) await updateProgram(editId, payload); else await createProgram(payload);
    toast.success(editId ? "Program diperbarui" : "Program ditambahkan");
    setOpen(false); load();
  };

  const remove = async (id) => { await deleteProgram(id); toast.success("Program dihapus"); load(); };

  return (
    <div className="space-y-5" data-testid="master-data-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900">Master Data Program & Tarif</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola program pendidikan beserta komponen biayanya.</p>
        </div>
        <Button className="bg-blue-900 hover:bg-blue-950" onClick={openNew} data-testid="add-program-button"><Plus className="w-4 h-4 mr-1" /> Tambah Program</Button>
      </div>

      <Card className="p-5 border-slate-200/80" data-testid="logo-settings-card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-80 h-80 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
            {logo ? <img src={logo} alt="Logo yayasan" className="w-full h-full object-contain" data-testid="logo-preview" /> : <LighthouseLogo className="w-24 h-24" />}
          </div>
          <div className="flex-1 min-w-[220px]">
            <p className="font-heading font-bold text-blue-900">{FOUNDATION.name}</p>
            <p className="text-slate-500 text-xs mb-2">{FOUNDATION.address}</p>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" /> {logo ? "Ganti Logo" : "Unggah Logo"}
                <input type="file" accept="image/*" className="hidden" onChange={onLogoFile} data-testid="logo-upload-input" />
              </label>
              {logo && <Button variant="outline" size="sm" onClick={removeLogo} data-testid="logo-remove-btn">Hapus</Button>}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Logo tampil di semua dokumen cetak (invoice, jadwal, kuitansi). Format PNG/JPG, maks 1.5 MB.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((p) => (
          <Card key={p.id} className="p-5 border-slate-200/80 flex flex-col" data-testid={`program-card-${p.id}`}>
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800"><GraduationCap className="w-5 h-5" /></div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`edit-program-${p.id}`}><Pencil className="w-4 h-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost" data-testid={`delete-program-${p.id}`}><Trash2 className="w-4 h-4 text-rose-600" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Hapus program {p.name}?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => remove(p.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 mt-3">{p.name}</h3>
            <p className="text-xs text-slate-500 mb-3 flex-1">{p.label}</p>
            <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
              <div className="flex justify-between"><span className="text-slate-500">Development Fee</span><span className="font-mono font-semibold">{rupiah(p.biaya_pengembangan)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Class Fee</span><span className="font-mono font-semibold">{rupiah(p.spp_bulanan)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Registration Fee</span><span className="font-mono">{rupiah(p.biaya_pendaftaran)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Periode</span><span className="font-mono">{p.periode_bulan} bulan</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="program-dialog">
          <DialogHeader><DialogTitle>{editId ? "Edit Program" : "Tambah Program"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Program *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="program-name-input" /></div>
            <div><Label>Deskripsi / Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} data-testid="program-label-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Development Fee</Label><Input type="number" value={form.biaya_pengembangan} onChange={(e) => setForm({ ...form, biaya_pengembangan: e.target.value })} data-testid="program-dev-input" /></div>
              <div><Label>Class Fee</Label><Input type="number" value={form.spp_bulanan} onChange={(e) => setForm({ ...form, spp_bulanan: e.target.value })} data-testid="program-spp-input" /></div>
              <div><Label>Regristration Fee</Label><Input type="number" value={form.biaya_pendaftaran} onChange={(e) => setForm({ ...form, biaya_pendaftaran: e.target.value })} data-testid="program-reg-input" /></div>
              <div><Label>Periode (bulan)</Label><Input type="number" value={form.periode_bulan} onChange={(e) => setForm({ ...form, periode_bulan: e.target.value })} data-testid="program-period-input" /></div>
            </div>
          </div>
          <DialogFooter><Button className="bg-blue-900 hover:bg-blue-950" onClick={save} data-testid="save-master-program-btn">Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
