"use client";
import { useEffect, useState, useRef } from "react";
import { money } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Row = any;
export default function Inventory() {
  const [rows, setRows] = useState<Row[]>([]);
  const rowsRef = useRef<Row[]>([]);
  rowsRef.current = rows;
  const load = async () => { setRows(await (await fetch("/api/inventory")).json()); };
  useEffect(() => { load(); }, []);

  const recalc = (nr: Row) => {
    const s = Number(nr.supplierCostRmb || 0); const sh = Number(nr.shippingCostRmb || 0); const p = Number(nr.pickupCostRmb || 0); const o = Number(nr.otherCostRmb || 0);
    nr.totalRmbLanded = s + sh + p + o;
    const rate = Number(nr.audCostPerRmb || 0);
    if (rate) nr.totalAudLanded = nr.totalRmbLanded * rate;
    const u = Number(nr.units || 0);
    if (u) { nr.audCostPerUnit = (nr.totalAudLanded || 0) / u; nr.rmbCostPerUnit = nr.totalRmbLanded / u; }
    return nr;
  };

  const updateCell = (id: string, field: string, value: any) => {
    setRows((prev) => prev.map((r) => r.id === id ? recalc({ ...r, [field]: value }) : r));
  };
  const saveRow = async (row: Row) => { await fetch("/api/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) }); };
  const addRow = async () => { const r = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku: "NEW-SKU", units: 0, isDemo: false }) }); const _j = await r.json();
    setRows((p) => [_j, ...p]); };
  const del = async (id: string) => { await fetch("/api/inventory?id=" + id, { method: "DELETE" }); setRows((p) => p.filter((r) => r.id !== id)); };

  const cols = ["sku","asin","productName","shipmentId","units","supplierCostRmb","shippingCostRmb","pickupCostRmb","otherCostRmb","totalRmbLanded","audCostPerRmb","totalAudLanded","audCostPerUnit","rmbCostPerUnit","allocationMethod"];
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Inventory Landed Cost</h2><button onClick={addRow} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm flex items-center gap-1"><Plus size={14} /> Add</button></div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-zinc-100 dark:bg-zinc-800"><tr>{cols.map((c) => <th key={c} className="px-2 py-2 text-left whitespace-nowrap">{c}</th>)}<th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                {cols.map((c) => (
                  <td key={c}>
                    {c === "allocationMethod" ? (
                      <select className="bg-transparent" value={r[c] ?? "Units"} onChange={(e) => updateCell(r.id, c, e.target.value)} onBlur={() => { const rr = rowsRef.current.find((x: any) => x.id === r.id); if (rr) saveRow(rr); }}>
                        {["Units","Weight","CBM","Manual"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type={["units","supplierCostRmb","shippingCostRmb","pickupCostRmb","otherCostRmb","totalRmbLanded","audCostPerRmb","totalAudLanded","audCostPerUnit","rmbCostPerUnit"].includes(c) ? "number" : "text"} step="any" className="bg-transparent w-24" value={r[c] ?? ""} onChange={(e) => updateCell(r.id, c, e.target.value)} onBlur={() => { const rr = rowsRef.current.find((x: any) => x.id === r.id); if (rr) saveRow(rr); }} />
                    )}
                  </td>
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