"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { money, CURRENCIES } from "@/lib/utils";
import { Plus, Trash2, Copy, ArrowLeftRight, Download } from "lucide-react";

type Tx = any;

const TYPES = ["Investment", "Conversion", "Supplier", "Shipping", "Pickup", "Payout", "Expense"];
const DIRECTIONS = ["IN", "OUT"];

export default function Ledger() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const txsRef = useRef<Tx[]>([]);
  txsRef.current = txs;
  const [wallets, setWallets] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: "", type: "All", currency: "All", account: "All", direction: "All", from: "", to: "" });
  const [showConv, setShowConv] = useState(false);
  const [conv, setConv] = useState({ fromAccount: "", fromCurrency: "BDT", amount: "", rate: "", toAccount: "", toCurrency: "RMB", ref: "" });

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (filters.type !== "All") qs.set("type", filters.type);
    if (filters.currency !== "All") qs.set("currency", filters.currency);
    if (filters.account !== "All") qs.set("account", filters.account);
    if (filters.direction !== "All") qs.set("direction", filters.direction);
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    if (filters.search) qs.set("search", filters.search);
    const [t, w] = await Promise.all([fetch("/api/transactions?" + qs.toString()).then((x) => x.json()), fetch("/api/wallets").then((x) => x.json())]);
    setTxs(t); setWallets(w);
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const saveRow = async (row: Tx) => {
    await fetch("/api/transactions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
  };
  const updateCell = (id: string, field: string, value: any) => {
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };
  const onBlurSave = (row: Tx) => { saveRow(row); };

  const addRow = async () => {
    const ref = "TX-" + Date.now();
    const r = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10), referenceId: ref, type: "Expense", account: wallets[0]?.name ?? "", direction: "OUT", currency: "AUD", amount: 0, isDemo: false,
    }) });
    const j = await r.json();
    setTxs((p) => [j, ...p]);
  };

  const deleteRow = async (id: string, linkId?: string) => {
    let deleteBoth = false;
    if (linkId) {
      deleteBoth = confirm("This transaction is part of a linked conversion. Delete both legs?");
      if (deleteBoth) {
        const sibling = txs.find((t) => t.linkId === linkId && t.id !== id);
        if (sibling) await fetch("/api/transactions?id=" + sibling.id, { method: "DELETE" });
      }
    }
    await fetch("/api/transactions?id=" + id, { method: "DELETE" });
    setTxs((p) => p.filter((t) => {
      if (t.id === id) return false;
      if (deleteBoth && linkId && t.linkId === linkId) return false;
      return true;
    }));
    load();
  };

  const duplicateRow = async (row: Tx) => {
    const r = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...row, id: undefined, referenceId: row.referenceId + "-COPY", isDemo: false }) });
    const j = await r.json();
    setTxs((p) => [j, ...p]);
  };

  const doConversion = async () => {
    const amt = Number(conv.amount);
    const rate = Number(conv.rate);
    const converted = amt * rate;
    const ref = conv.ref || "CONV-" + Date.now();
    // OUT leg
    await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10), referenceId: ref, type: "Conversion", account: conv.fromAccount, direction: "OUT", currency: conv.fromCurrency, amount: amt, exchangeRate: rate, convertedAmount: converted, convertedCurrency: conv.toCurrency, audEquivalent: conv.fromCurrency === "AUD" ? amt : null, notes: "Currency conversion", isDemo: false, linkId: ref,
    }) });
    await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10), referenceId: ref, type: "Conversion", account: conv.toAccount, direction: "IN", currency: conv.toCurrency, amount: converted, exchangeRate: rate, convertedAmount: amt, convertedCurrency: conv.fromCurrency, audEquivalent: conv.toCurrency === "AUD" ? converted : null, notes: "Currency conversion", isDemo: false, linkId: ref,
    }) });
    setShowConv(false);
    load();
  };

  const exportCSV = () => {
    const headers = ["date","referenceId","type","account","direction","currency","amount","exchangeRate","convertedAmount","convertedCurrency","audEquivalent","counterparty","sku","asin","notes","isDemo"];
    const rows = txs.map((t) => headers.map((h) => {
      let v = t[h];
      if (h === "date") v = t.date ? new Date(t.date).toISOString().slice(0, 10) : "";
      return `"${String(v ?? "").replace(/"/g, '""')}"`;
    }).join(","));
    const csv = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ledger.csv"; a.click();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transaction Ledger</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowConv(true)} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm flex items-center gap-1"><ArrowLeftRight size={14} /> Add Conversion</button>
          <button onClick={addRow} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm flex items-center gap-1"><Plus size={14} /> Add Row</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded border text-sm flex items-center gap-1"><Download size={14} /> CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input placeholder="Search" className="border rounded px-2 py-1 text-sm" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="border rounded px-2 py-1 text-sm" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option>All</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="border rounded px-2 py-1 text-sm" value={filters.currency} onChange={(e) => setFilters({ ...filters, currency: e.target.value })}>
          <option>All</option>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="border rounded px-2 py-1 text-sm" value={filters.account} onChange={(e) => setFilters({ ...filters, account: e.target.value })}>
          <option>All</option>{wallets.map((w) => <option key={w.id}>{w.name}</option>)}
        </select>
        <select className="border rounded px-2 py-1 text-sm" value={filters.direction} onChange={(e) => setFilters({ ...filters, direction: e.target.value })}>
          <option>All</option>{DIRECTIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <input type="date" className="border rounded px-2 py-1 text-sm" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" className="border rounded px-2 py-1 text-sm" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              {["Date","Ref","Type","Account","Dir","Cur","Amount","Rate","ConvAmt","ConvCur","AUD Eq","Counterparty","SKU","ASIN","Notes","Demo",""].map((h) => <th key={h} className="px-2 py-2 text-left whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td><input type="date" className="w-24 bg-transparent" value={t.date ? new Date(t.date).toISOString().slice(0,10) : ""} onChange={(e) => updateCell(t.id, "date", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input className="w-20 bg-transparent" value={t.referenceId ?? ""} onChange={(e) => updateCell(t.id, "referenceId", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><select className="bg-transparent" value={t.type} onChange={(e) => { updateCell(t.id, "type", e.target.value); }} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }}>
                  {TYPES.map((x) => <option key={x}>{x}</option>)}
                </select></td>
                <td><select className="bg-transparent" value={t.account} onChange={(e) => updateCell(t.id, "account", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }}>
                  {wallets.map((w) => <option key={w.id}>{w.name}</option>)}
                </select></td>
                <td><select className="bg-transparent" value={t.direction} onChange={(e) => updateCell(t.id, "direction", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }}>
                  {DIRECTIONS.map((d) => <option key={d}>{d}</option>)}
                </select></td>
                <td><select className="bg-transparent" value={t.currency} onChange={(e) => updateCell(t.id, "currency", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select></td>
                <td><input type="number" step="any" className="w-20 bg-transparent" value={t.amount ?? 0} onChange={(e) => updateCell(t.id, "amount", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input type="number" step="any" className="w-16 bg-transparent" value={t.exchangeRate ?? ""} onChange={(e) => updateCell(t.id, "exchangeRate", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input type="number" step="any" className="w-20 bg-transparent" value={t.convertedAmount ?? ""} onChange={(e) => updateCell(t.id, "convertedAmount", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input className="w-12 bg-transparent" value={t.convertedCurrency ?? ""} onChange={(e) => updateCell(t.id, "convertedCurrency", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input type="number" step="any" className="w-20 bg-transparent" value={t.audEquivalent ?? ""} onChange={(e) => updateCell(t.id, "audEquivalent", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input className="w-24 bg-transparent" value={t.counterparty ?? ""} onChange={(e) => updateCell(t.id, "counterparty", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input className="w-20 bg-transparent" value={t.sku ?? ""} onChange={(e) => updateCell(t.id, "sku", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input className="w-20 bg-transparent" value={t.asin ?? ""} onChange={(e) => updateCell(t.id, "asin", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input className="w-32 bg-transparent" value={t.notes ?? ""} onChange={(e) => updateCell(t.id, "notes", e.target.value)} onBlur={() => { const rr = txsRef.current.find((x: any) => x.id === t.id); if (rr) onBlurSave(rr); }} /></td>
                <td><input type="checkbox" checked={!!t.isDemo} onChange={(e) => { updateCell(t.id, "isDemo", e.target.checked); saveRow({ ...t, isDemo: e.target.checked }); }} /></td>
                <td className="flex gap-1">
                  <button onClick={() => duplicateRow(t)} title="Duplicate"><Copy size={12} /></button>
                  <button onClick={() => deleteRow(t.id, t.linkId)} title="Delete"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConv && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-96 space-y-3">
            <h3 className="font-bold">Add Currency Conversion</h3>
            <input placeholder="Reference (optional)" className="w-full border rounded px-2 py-1 text-sm" value={conv.ref} onChange={(e) => setConv({ ...conv, ref: e.target.value })} />
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.fromAccount} onChange={(e) => setConv({ ...conv, fromAccount: e.target.value })}>
              <option value="">From account</option>{wallets.map((w) => <option key={w.id}>{w.name}</option>)}
            </select>
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.fromCurrency} onChange={(e) => setConv({ ...conv, fromCurrency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Amount" type="number" className="w-full border rounded px-2 py-1 text-sm" value={conv.amount} onChange={(e) => setConv({ ...conv, amount: e.target.value })} />
            <input placeholder="Rate" type="number" step="any" className="w-full border rounded px-2 py-1 text-sm" value={conv.rate} onChange={(e) => setConv({ ...conv, rate: e.target.value })} />
            <div className="text-xs text-zinc-500">Converted: {conv.amount && conv.rate ? (Number(conv.amount) * Number(conv.rate)).toFixed(4) : "-"}</div>
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.toAccount} onChange={(e) => setConv({ ...conv, toAccount: e.target.value })}>
              <option value="">To account</option>{wallets.map((w) => <option key={w.id}>{w.name}</option>)}
            </select>
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.toCurrency} onChange={(e) => setConv({ ...conv, toCurrency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConv(false)} className="px-3 py-1 text-sm border rounded">Cancel</button>
              <button onClick={doConversion} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}