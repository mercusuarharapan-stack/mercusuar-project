import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import InvoiceForm from "@/pages/InvoiceForm";
import InvoicePrint from "@/pages/InvoicePrint";
import Schedules from "@/pages/Schedules";
import SchedulePrint from "@/pages/SchedulePrint";
import Receipts from "@/pages/Receipts";
import ReceiptPrint from "@/pages/ReceiptPrint";
import MasterData from "@/pages/MasterData";

const withLayout = (el) => <Layout>{el}</Layout>;

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={withLayout(<Dashboard />)} />
        <Route path="/invoices" element={withLayout(<Invoices />)} />
        <Route path="/invoices/new" element={withLayout(<InvoiceForm />)} />
        <Route path="/invoices/:id/edit" element={withLayout(<InvoiceForm />)} />
        <Route path="/invoices/:id/print" element={withLayout(<InvoicePrint />)} />
        <Route path="/schedules" element={withLayout(<Schedules />)} />
        <Route path="/schedules/:id/print" element={withLayout(<SchedulePrint />)} />
        <Route path="/receipts" element={withLayout(<Receipts />)} />
        <Route path="/receipts/:id/print" element={withLayout(<ReceiptPrint />)} />
        <Route path="/master-data" element={withLayout(<MasterData />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
