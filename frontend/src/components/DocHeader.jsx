import { LighthouseLogo } from "./Brand";
import { FOUNDATION } from "../lib/format";
import { Button } from "./ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DocHeader = () => (
  <div className="border-b-[3px] border-blue-900 pb-4 mb-6">
    <div className="flex items-center gap-4">
      <LighthouseLogo className="w-16 h-16 shrink-0" />
      <div className="flex-1 text-center">
        <h1 className="font-heading font-extrabold text-blue-900 text-xl sm:text-2xl tracking-tight">
          {FOUNDATION.name}
        </h1>
        <p className="text-[13px] font-semibold text-slate-600">{FOUNDATION.sub}</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-2xl mx-auto">{FOUNDATION.address}</p>
        <p className="text-[11px] text-slate-500">{FOUNDATION.contact}</p>
      </div>
      <div className="w-16 shrink-0" />
    </div>
  </div>
);

export const PrintBar = ({ testid = "print-pdf-btn" }) => {
  const navigate = useNavigate();
  return (
    <div className="no-print flex items-center justify-between mb-4 max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => navigate(-1)} data-testid="print-back-btn">
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>
      <Button className="bg-blue-900 hover:bg-blue-950" onClick={() => window.print()} data-testid={testid}>
        <Printer className="w-4 h-4 mr-1" /> Cetak / Simpan PDF
      </Button>
    </div>
  );
};

export const SignOff = ({ leftLabel = "Orang Tua / Wali", rightLabel = "Staf Keuangan Yayasan" }) => (
  <div className="flex justify-between mt-12 text-sm">
    <div className="text-center w-56">
      <p className="mb-16">{leftLabel},</p>
      <p className="border-t border-slate-400 pt-1">( ........................... )</p>
    </div>
    <div className="text-center w-56">
      <p className="mb-16">{rightLabel},</p>
      <p className="border-t border-slate-400 pt-1">( ........................... )</p>
    </div>
  </div>
);
