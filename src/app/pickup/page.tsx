"use client";
import { useEffect, useState, useRef } from "react";
import { money } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Row = any;
export default function Pickup() {
  const [rows, setRows] = useState<Row[]>([]);
  const rowsRef = useRef<Row[]>([]);
  rowsRef.current = rows;
  const load = async () => { setRows(await (await fetch("/api/pickup")).json()); };
  useEffect(() => { load(); }, []);
  const updateCell = (id: string, field: string, value: any) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const saveRow = async (row: Row) => { await fetch("/api/pickup", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) }); };
  const addRow = async () => { const r = await fetch("/api/pickup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDemo: false }) }); const _j = await r.json();
    setRows((p) => [_j, ...p]); };
  const del = async (id: string) => { await fetch("/api/pickup?id=" + id, { method: "DELETE" }); setRows((p) => p.filter((r) => r.id !== id)); };
  const cols = ["reference","supplier","location","shipmentId","rmbCharge","audEquivalent","sku","notes"];
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Pickup Costs</h2><button onClick={addRow} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm flex items-center gap-1"><Plus size={14} /> Add</button></div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-zinc-100 dark:bg-zinc-800"><tr>{cols.map((c) => <th key={c} className="px-2 py-2 text-left whitespace-nowrap">{c}</th>)}<th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                {cols.map((c) => (
                  <td key={c}><input type={["rmbCharge","audEquivalent"].includes(c) ? "number" : "text"} step="any" className="bg-transparent w-24" value={r[c] ?? ""} onChange={(e) => updateCell(r.id, c, e.target.value)} onBlur={() => { const rr = rowsRef.current.find((x: any) => x.id === r.id); if (rr) saveRow(rr); }} /></td>
                ))}
                <td><button onClick={() => del(r.id)}><Trash2 size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}