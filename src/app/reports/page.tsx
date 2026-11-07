"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";

export default function Reports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [txs, setTxs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [shipping, setShipping] = useState<any[]>([]);
  const [pickup, setPickup] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [amazon, setAmazon] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

  const load = async () => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const [t, s, sh, p, inv, am, invt] = await Promise.all([
      fetch("/api/transactions?" + qs.toString()).then((x) => x.json()),
      fetch("/api/suppliers").then((x) => x.json()),
      fetch("/api/shipping").then((x) => x.json()),
      fetch("/api/pickup").then((x) => x.json()),
      fetch("/api/inventory").then((x) => x.json()),
      fetch("/api/amazon").then((x) => x.json()),
      fetch("/api/investments").then((x) => x.json()),
    ]);
    setTxs(t); setSuppliers(s); setShipping(sh); setPickup(p); setInventory(inv); setAmazon(am); setInvestments(invt);
  };
  useEffect(() => { load(); }, []);

  // daily cash flow
  const daily: Record<string, { in: number; out: number }> = {};
  txs.forEach((t) => {
    const d = t.date ? new Date(t.date).toISOString().slice(0, 10) : "unknown";
    if (!daily[d]) daily[d] = { in: 0, out: 0 };
    const val = t.audEquivalent ?? t.amount ?? 0;
    if (t.direction === "IN") daily[d].in += val; else daily[d].out += val;
  });
  const dailyRows = Object.entries(daily).sort();

  // monthly
  const monthly: Record<string, { in: number; out: number }> = {};
  txs.forEach((t) => {
    const m = t.date ? new Date(t.date).toISOString().slice(0, 7) : "unknown";
    if (!monthly[m]) monthly[m] = { in: 0, out: 0 };
    const val = t.audEquivalent ?? t.amount ?? 0;
    if (t.direction === "IN") monthly[m].in += val; else monthly[m].out += val;
  });
  const monthlyRows = Object.entries(monthly).sort();

  const section = (title: string, children: any) => (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Reports</h2>
      <div className="flex gap-2 items-center">
        <input type="date" className="border rounded px-2 py-1 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={load} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Apply</button>
      </div>

      {section("Daily Cash Flow", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Date</th><th>In</th><th>Out</th><th>Net</th></tr></thead><tbody>
          {dailyRows.map(([d, v]) => <tr key={d} className="border-t border-zinc-100 dark:border-zinc-800"><td>{d}</td><td>{money(v.in)}</td><td>{money(v.out)}</td><td>{money(v.in - v.out)}</td></tr>)}
        </tbody></table>
      ))}

      {section("Monthly Cash Flow", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Month</th><th>In</th><th>Out</th><th>Net</th></tr></thead><tbody>
          {monthlyRows.map(([m, v]) => <tr key={m} className="border-t border-zinc-100 dark:border-zinc-800"><td>{m}</td><td>{money(v.in)}</td><td>{money(v.out)}</td><td>{money(v.in - v.out)}</td></tr>)}
        </tbody></table>
      ))}

      {section("Founder Investment Report", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Founder</th><th>Currency</th><th>Amount</th><th>AUD Eq</th><th>Type</th></tr></thead><tbody>
          {investments.map((i) => <tr key={i.id} className="border-t border-zinc-100 dark:border-zinc-800"><td>{i.founder}</td><td>{i.currency}</td><td>{money(i.amount)}</td><td>{money(i.audEquivalent)}</td><td>{i.type}</td></tr>)}
          <tr className="font-semibold border-t"><td colSpan={3}>Total</td><td>{money(investments.reduce((a, i) => a + (i.audEquivalent ?? 0), 0))}</td><td></td></tr>
        </tbody></table>
      ))}

      {section("Supplier Payment Report", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Supplier</th><th>Invoice</th><th>Total RMB</th><th>Paid RMB</th><th>Status</th></tr></thead><tbody>
          {suppliers.map((s) => <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800"><td>{s.supplier}</td><td>{s.invoiceNumber}</td><td>{money(s.totalRmbPayable)}</td><td>{money(s.actualRmbPaid)}</td><td>{s.paymentStatus}</td></tr>)}
        </tbody></table>
      ))}

      {section("Shipping Expense Report", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Agent</th><th>Ref</th><th>AUD</th><th>Expected RMB</th><th>Paid RMB</th></tr></thead><tbody>
          {shipping.map((s) => <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800"><td>{s.agent}</td><td>{s.shipmentRef}</td><td>{money(s.audCharge)}</td><td>{money(s.expectedRmb)}</td><td>{money(s.actualRmbPaid)}</td></tr>)}
        </tbody></table>
      ))}

      {section("Pickup Expense Report", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Ref</th><th>Supplier</th><th>RMB</th><th>AUD Eq</th></tr></thead><tbody>
          {pickup.map((p) => <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800"><td>{p.reference}</td><td>{p.supplier}</td><td>{money(p.rmbCharge)}</td><td>{money(p.audEquivalent)}</td></tr>)}
          <tr className="font-semibold border-t"><td colSpan={2}>Total</td><td>{money(pickup.reduce((a, p) => a + (p.rmbCharge ?? 0), 0))}</td><td>{money(pickup.reduce((a, p) => a + (p.audEquivalent ?? 0), 0))}</td></tr>
        </tbody></table>
      ))}

      {section("Inventory Investment Report", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>SKU</th><th>Units</th><th>Total RMB</th><th>Total AUD</th><th>AUD/Unit</th></tr></thead><tbody>
          {inventory.map((i) => <tr key={i.id} className="border-t border-zinc-100 dark:border-zinc-800"><td>{i.sku}</td><td>{i.units}</td><td>{money(i.totalRmbLanded)}</td><td>{money(i.totalAudLanded)}</td><td>{money(i.audCostPerUnit)}</td></tr>)}
        </tbody></table>
      ))}

      {section("Amazon Payout Reconciliation", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Settlement</th><th>Net Payout</th><th>Actual Received</th><th>Diff</th></tr></thead><tbody>
          {amazon.map((a) => <tr key={a.id} className="border-t border-zinc-100 dark:border-zinc-800"><td>{a.settlementId}</td><td>{money(a.netPayout)}</td><td>{money(a.actualAudReceived)}</td><td>{money((a.actualAudReceived ?? 0) - (a.netPayout ?? 0))}</td></tr>)}
        </tbody></table>
      ))}

      {section("Currency Conversion Gain/Loss", (
        <table className="w-full text-xs"><thead><tr className="text-zinc-500"><th>Ref</th><th>Account</th><th>Dir</th><th>Currency</th><th>Amount</th><th>Rate</th></tr></thead><tbody>
          {txs.filter((t) => t.type === "Conversion").map((t) => <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800"><td>{t.referenceId}</td><td>{t.account}</td><td>{t.direction}</td><td>{t.currency}</td><td>{money(t.amount)}</td><td>{t.exchangeRate}</td></tr>)}
        </tbody></table>
      ))}
    </div>
  );
}