"use client";
import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";

type Wallet = any;
export default function Settings() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const walletsRef = useRef<Wallet[]>([]);
  walletsRef.current = wallets;
  const [audit, setAudit] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    setWallets(await (await fetch("/api/wallets")).json());
    setAudit(await (await fetch("/api/audit")).json());
  };
  useEffect(() => { load(); }, []);

  const updateWallet = (id: string, field: string, value: any) => setWallets((prev) => prev.map((w) => w.id === id ? { ...w, [field]: value } : w));
  const saveWallet = async (w: Wallet) => { await fetch("/api/wallets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(w) }); };
  const addWallet = async () => { const r = await fetch("/api/wallets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "New Wallet", currency: "AUD", openingBalance: 0 }) }); const _j = await r.json();
    setWallets((p) => [...p, _j]); };
  const delWallet = async (id: string) => { await fetch("/api/wallets?id=" + id, { method: "DELETE" }); setWallets((p) => p.filter((w) => w.id !== id)); };

  const seedDemo = async () => { await fetch("/api/demo", { method: "POST" }); setStatus("Demo data seeded"); load(); };
  const clearDemo = async () => { await fetch("/api/demo", { method: "DELETE" }); setStatus("Demo data removed"); load(); };

  const backup = async () => {
    const data = await (await fetch("/api/backup")).json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "trizah-backup.json"; a.click();
  };
  const restore = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setStatus("Restored"); load();
  };

  const exportCSV = async (endpoint: string, name: string) => {
    const data = await (await fetch(endpoint)).json();
    if (!Array.isArray(data) || data.length === 0) { setStatus("No data"); return; }
    const headers = Object.keys(data[0]);
    const rows = data.map((d: any) => headers.map((h) => `"${String(d[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  };

  // CSV import for transactions
  const importCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    for (let i = 1; i < lines.length; i++) {
      // naive csv split
      const vals = lines[i].split(",");
      const obj: any = {};
      headers.forEach((h, idx) => { obj[h] = (vals[idx] ?? "").replace(/^"|"$/g, ""); });
      await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        date: obj.date || new Date().toISOString().slice(0,10),
        referenceId: obj.referenceId || "IMP-" + Date.now() + "-" + i,
        type: obj.type || "Expense",
        account: obj.account || wallets[0]?.name,
        direction: obj.direction || "OUT",
        currency: obj.currency || "AUD",
        amount: Number(obj.amount || 0),
        exchangeRate: obj.exchangeRate ? Number(obj.exchangeRate) : null,
        convertedAmount: obj.convertedAmount ? Number(obj.convertedAmount) : null,
        convertedCurrency: obj.convertedCurrency || null,
        audEquivalent: obj.audEquivalent ? Number(obj.audEquivalent) : null,
        counterparty: obj.counterparty || null,
        sku: obj.sku || null,
        asin: obj.asin || null,
        notes: obj.notes || null,
        isDemo: false,
      }) });
    }
    setStatus("Imported"); load();
  };

  const exportExcel = async (endpoint: string, name: string) => {
    const data = await (await fetch(endpoint)).json();
    if (!Array.isArray(data) || data.length === 0) { setStatus("No data"); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, name);
  };

  const importExcel = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    for (const obj of rows) {
      await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        date: obj.date || new Date().toISOString().slice(0, 10),
        referenceId: obj.referenceId || "XLS-" + Date.now(),
        type: obj.type || "Expense",
        account: obj.account || wallets[0]?.name,
        direction: obj.direction || "OUT",
        currency: obj.currency || "AUD",
        amount: Number(obj.amount || 0),
        exchangeRate: obj.exchangeRate ? Number(obj.exchangeRate) : null,
        convertedAmount: obj.convertedAmount ? Number(obj.convertedAmount) : null,
        convertedCurrency: obj.convertedCurrency || null,
        audEquivalent: obj.audEquivalent ? Number(obj.audEquivalent) : null,
        counterparty: obj.counterparty || null,
        sku: obj.sku || null,
        asin: obj.asin || null,
        notes: obj.notes || null,
        isDemo: false,
      }) });
    }
    setStatus("Excel imported"); load();
  };

  const downloadTemplate = () => {
    const headers = ["date","referenceId","type","account","direction","currency","amount","exchangeRate","convertedAmount","convertedCurrency","audEquivalent","counterparty","sku","asin","notes"];
    const ws = XLSX.utils.aoa_to_sheet([headers, ["2026-01-01","TX-001","Expense","Wise Account","OUT","AUD","100","","","","100","","","","demo"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "trizah-ledger-template.xlsx");
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      {status && <div className="text-sm text-emerald-600">{status}</div>}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Wallets & Opening Balances</h3>
          <button onClick={addWallet} className="px-3 py-1 text-sm bg-emerald-600 text-white rounded flex items-center gap-1"><Plus size={14} /> Add Wallet</button>
        </div>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-800"><tr><th className="px-2 py-2">Name</th><th>Currency</th><th>Opening Balance</th><th></th></tr></thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td><input className="bg-transparent" value={w.name} onChange={(e) => updateWallet(w.id, "name", e.target.value)} onBlur={() => { const ww = walletsRef.current.find((x: any) => x.id === w.id); if (ww) saveWallet(ww); }} /></td>
                  <td>
                    <select className="bg-transparent" value={w.currency} onChange={(e) => updateWallet(w.id, "currency", e.target.value)} onBlur={() => { const ww = walletsRef.current.find((x: any) => x.id === w.id); if (ww) saveWallet(ww); }}>
                      {["AUD","BDT","RMB","USD"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td><input type="number" step="any" className="bg-transparent w-24" value={w.openingBalance ?? 0} onChange={(e) => updateWallet(w.id, "openingBalance", e.target.value)} onBlur={() => { const ww = walletsRef.current.find((x: any) => x.id === w.id); if (ww) saveWallet(ww); }} /></td>
                  <td><button onClick={() => delWallet(w.id)}><Trash2 size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Demo Data</h3>
        <div className="flex gap-2">
          <button onClick={seedDemo} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Seed Demo Data</button>
          <button onClick={clearDemo} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Remove Demo Data</button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Import / Export</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={backup} className="px-3 py-1 text-sm border rounded flex items-center gap-1"><Download size={12} /> Backup JSON</button>
          <label className="px-3 py-1 text-sm border rounded flex items-center gap-1 cursor-pointer"><Upload size={12} /> Restore JSON
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
          </label>
          <button onClick={() => exportExcel("/api/transactions", "transactions.xlsx")} className="px-3 py-1 text-sm border rounded">Export Transactions Excel</button>
          <button onClick={downloadTemplate} className="px-3 py-1 text-sm border rounded">Download Excel Template</button>
          <label className="px-3 py-1 text-sm border rounded flex items-center gap-1 cursor-pointer"><Upload size={12} /> Import Transactions Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])} />
          </label>
          <button onClick={() => exportCSV("/api/transactions", "transactions.csv")} className="px-3 py-1 text-sm border rounded">Export Transactions CSV</button>
          <button onClick={() => exportCSV("/api/suppliers", "suppliers.csv")} className="px-3 py-1 text-sm border rounded">Export Suppliers CSV</button>
          <button onClick={() => exportCSV("/api/shipping", "shipping.csv")} className="px-3 py-1 text-sm border rounded">Export Shipping CSV</button>
          <button onClick={() => exportCSV("/api/pickup", "pickup.csv")} className="px-3 py-1 text-sm border rounded">Export Pickup CSV</button>
          <button onClick={() => exportCSV("/api/inventory", "inventory.csv")} className="px-3 py-1 text-sm border rounded">Export Inventory CSV</button>
          <button onClick={() => exportCSV("/api/amazon", "amazon.csv")} className="px-3 py-1 text-sm border rounded">Export Amazon CSV</button>
          <label className="px-3 py-1 text-sm border rounded flex items-center gap-1 cursor-pointer"><Upload size={12} /> Import Transactions CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
          </label>
        </div>
        <p className="text-xs text-zinc-500">Excel import/export: use CSV then open in Excel, or backup JSON. (SheetJS available for future.)</p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Audit History</h3>
        <div className="overflow-x-auto border rounded-lg max-h-64 overflow-y-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-800"><tr><th className="px-2 py-2">Date</th><th>Action</th><th>Transaction</th><th>Before</th><th>After</th></tr></thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-2 py-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</td>
                  <td>{a.action}</td>
                  <td>{a.transactionId}</td>
                  <td className="max-w-xs truncate">{a.before}</td>
                  <td className="max-w-xs truncate">{a.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}