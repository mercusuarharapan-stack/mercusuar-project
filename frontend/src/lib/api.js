import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const getPrograms = () => api.get("/programs").then((r) => r.data);
export const createProgram = (d) => api.post("/programs", d).then((r) => r.data);
export const updateProgram = (id, d) => api.put(`/programs/${id}`, d).then((r) => r.data);
export const deleteProgram = (id) => api.delete(`/programs/${id}`).then((r) => r.data);

export const getInvoices = () => api.get("/invoices").then((r) => r.data);
export const getInvoice = (id) => api.get(`/invoices/${id}`).then((r) => r.data);
export const createInvoice = (d) => api.post("/invoices", d).then((r) => r.data);
export const updateInvoice = (id, d) => api.put(`/invoices/${id}`, d).then((r) => r.data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`).then((r) => r.data);

export const getSchedules = (invoiceId = "") =>
  api.get("/schedules", { params: invoiceId ? { invoice_id: invoiceId } : {} }).then((r) => r.data);
export const getSchedule = (id) => api.get(`/schedules/${id}`).then((r) => r.data);
export const createSchedule = (d) => api.post("/schedules", d).then((r) => r.data);
export const updateSchedule = (id, d) => api.put(`/schedules/${id}`, d).then((r) => r.data);
export const deleteSchedule = (id) => api.delete(`/schedules/${id}`).then((r) => r.data);

export const getReceipts = () => api.get("/receipts").then((r) => r.data);
export const getReceipt = (id) => api.get(`/receipts/${id}`).then((r) => r.data);
export const recordPayment = (d) => api.post("/payments", d).then((r) => r.data);
export const updateReceipt = (id, d) => api.put(`/receipts/${id}`, d).then((r) => r.data);
export const deleteReceipt = (id) => api.delete(`/receipts/${id}`).then((r) => r.data);

export const getStats = () => api.get("/dashboard/stats").then((r) => r.data);
