"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { money } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Plus, ArrowLeftRight, Download, Search, X, Filter } from "lucide-react";

type Tx = any;

const TYPES = ["Investment", "Conversion", "Supplier", "Shipping", "Pickup", "Payout", "Expense"];
const CURRENCIES = ["AUD", "BDT", "RMB", "USD"];
const DATE_PRESETS = ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "This Quarter", "This Year", "Last Year", "All Time", "Custom"];

function dateRange(preset: string, customFrom: string, customTo: string, n: Date | null): { from: Date | null; to: Date | null } {
  if (!n) return { from: null, to: null };
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  switch (preset) {
    case "Today": return { from: startOfDay(n), to: endOfDay(n) };
    case "Yesterday": { const y = new Date(n); y.setDate(y.getDate() - 1); return { from: startOfDay(y), to: endOfDay(y) }; }
    case "This Week": { const d = new Date(n); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const mon = new Date(d); mon.setDate(diff); return { from: startOfDay(mon), to: endOfDay(n) }; }
    case "Last Week": { const d = new Date(n); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7; const mon = new Date(d); mon.setDate(diff); const sun = new Date(mon); sun.setDate(sun.getDate() + 6); return { from: startOfDay(mon), to: endOfDay(sun) }; }
    case "This Month": return { from: new Date(n.getFullYear(), n.getMonth(), 1), to: endOfDay(n) };
    case "Last Month": { const first = new Date(n.getFullYear(), n.getMonth() - 1, 1); const last = new Date(n.getFullYear(), n.getMonth(), 0); return { from: first, to: endOfDay(last) }; }
    case "This Quarter": { const q = Math.floor(n.getMonth() / 3); return { from: new Date(n.getFullYear(), q * 3, 1), to: endOfDay(n) }; }
    case "This Year": return { from: new Date(n.getFullYear(), 0, 1), to: endOfDay(n) };
    case "Last Year": return { from: new Date(n.getFullYear() - 1, 0, 1), to: new Date(n.getFullYear() - 1, 11, 31, 23, 59, 59) };
    case "Custom": return { from: customFrom ? new Date(customFrom) : null, to: customTo ? new Date(customTo + "T23:59:59") : null };
    default: return { from: null, to: null };
  }
}

const TX_FILTERS = ["All Transactions", "Money In", "Money Out", "Currency Exchange", "Investment", "Supplier Payment", "Shipping Payment", "Pickup Charge", "Operating Expense", "Amazon Payout", "Inventory Purchase", "Refund / Adjustment"];

export default function Dashboard() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [shipping, setShipping] = useState<any[]>([]);
  const [pickup, setPickup] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [amazon, setAmazon] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

  // filters
  const [datePreset, setDatePreset] = useState("This Month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [currency, setCurrency] = useState("All");
  const [txFilter, setTxFilter] = useState("All Transactions");
  const [walletFilter, setWalletFilter] = useState("All Wallets");
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const [search, setSearch] = useState("");
  const [audView, setAudView] = useState(true);

  // modals
  const [showAddTx, setShowAddTx] = useState(false);
  const [showConv, setShowConv] = useState(false);
  const [newTx, setNewTx] = useState({ date: "", referenceId: "", type: "Expense", account: "", direction: "OUT", currency: "AUD", amount: "", exchangeRate: "", convertedAmount: "", convertedCurrency: "", audEquivalent: "", counterparty: "", sku: "", notes: "" });
  useEffect(() => { setNewTx((p) => ({ ...p, date: new Date().toISOString().slice(0, 10) })); }, []);
  const [conv, setConv] = useState({ fromAccount: "", fromCurrency: "BDT", amount: "", rate: "", toAccount: "", toCurrency: "RMB", ref: "" });

  const load = async () => {
    const [w, t, r, s, sh, p, inv, am, invt] = await Promise.all([
      fetch("/api/wallets").then((x) => x.json()),
      fetch("/api/transactions").then((x) => x.json()),
      fetch("/api/rates").then((x) => x.json()),
      fetch("/api/suppliers").then((x) => x.json()),
      fetch("/api/shipping").then((x) => x.json()),
      fetch("/api/pickup").then((x) => x.json()),
      fetch("/api/inventory").then((x) => x.json()),
      fetch("/api/amazon").then((x) => x.json()),
      fetch("/api/investments").then((x) => x.json()),
    ]);
    setWallets(w); setTxs(t); setRates(r); setSuppliers(s); setShipping(sh); setPickup(p); setInventory(inv); setAmazon(am); setInvestments(invt);
  };
  useEffect(() => { load(); }, []);

  const { from, to } = useMemo(() => dateRange(datePreset, customFrom, customTo, now), [datePreset, customFrom, customTo, now]);

  const rateOf = (pair: string) => { const f = rates.filter((x: any) => x.pair === pair); return f.length ? f[0].rate : null; };
  const rmbToAud = () => { const r = rateOf("RMB->AUD"); if (r) return r; const r2 = rateOf("AUD->RMB"); return r2 ? 1 / r2 : 0.21; };
  const bdtToAud = () => { const r = rateOf("BDT->AUD"); if (r) return r; const r2 = rateOf("AUD->BDT"); return r2 ? 1 / r2 : 0.013; };

  const walletBalance = (w: any) => {
    const ins = txs.filter((t: any) => t.account === w.name && t.direction === "IN").reduce((a: number, t: any) => a + t.amount, 0);
    const outs = txs.filter((t: any) => t.account === w.name && t.direction === "OUT").reduce((a: number, t: any) => a + t.amount, 0);
    return w.openingBalance + ins - outs;
  };
  const toAud = (w: any, bal: number) => {
    if (w.currency === "AUD") return bal;
    if (w.currency === "RMB") return bal * rmbToAud();
    if (w.currency === "BDT") return bal * bdtToAud();
    if (w.currency === "USD") return bal * (rateOf("USD->AUD") ?? 1.5);
    return bal;
  };

  // filtered transactions
  const filteredTxs = useMemo(() => {
    return txs.filter((t: any) => {
      if (from && new Date(t.date) < from) return false;
      if (to && new Date(t.date) > to) return false;
      if (currency !== "All" && t.currency !== currency) return false;
      if (walletFilter !== "All Wallets" && t.account !== walletFilter) return false;
      if (txFilter !== "All Transactions") {
        const map: Record<string, string> = {
          "Money In": "IN", "Money Out": "OUT",
        };
        if (txFilter === "Money In" && t.direction !== "IN") return false;
        if (txFilter === "Money Out" && t.direction !== "OUT") return false;
        if (txFilter === "Currency Exchange" && t.type !== "Conversion") return false;
        if (txFilter === "Investment" && t.type !== "Investment") return false;
        if (txFilter === "Supplier Payment" && t.type !== "Supplier") return false;
        if (txFilter === "Shipping Payment" && t.type !== "Shipping") return false;
        if (txFilter === "Pickup Charge" && t.type !== "Pickup") return false;
        if (txFilter === "Operating Expense" && t.type !== "Expense") return false;
        if (txFilter === "Amazon Payout" && t.type !== "Payout") return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = [t.referenceId, t.counterparty, t.notes, t.sku, t.asin, t.account, t.type].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [txs, from, to, currency, walletFilter, txFilter, search]);

  const totalCashAud = wallets.reduce((a: number, w: any) => a + toAud(w, walletBalance(w)), 0);
  const totalFounderInv = investments.reduce((a: number, i: any) => a + (i.audEquivalent ?? 0), 0);
  const totalRmbPurchased = filteredTxs.filter((t: any) => t.type === "Conversion" && t.direction === "IN" && t.currency === "RMB").reduce((a: number, t: any) => a + t.amount, 0);
  const totalSupplier = suppliers.reduce((a: number, s: any) => a + (s.actualRmbPaid ?? s.totalRmbPayable ?? 0), 0);
  const totalShipping = shipping.reduce((a: number, s: any) => a + (s.actualRmbPaid ?? s.expectedRmb ?? 0), 0);
  const totalPickup = pickup.reduce((a: number, p: any) => a + (p.rmbCharge ?? 0), 0);
  const totalInvValue = inventory.reduce((a: number, i: any) => a + (i.totalAudLanded ?? (i.totalRmbLanded ?? 0) * rmbToAud()), 0);
  const totalAmazon = amazon.reduce((a: number, a2: any) => a + (a2.netPayout ?? 0), 0);
  const totalExpenses = (totalSupplier + totalShipping + totalPickup) * rmbToAud();
  const totalRevenue = amazon.reduce((a: number, a2: any) => a + (a2.grossSales ?? 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  const rmbFromAud = txs.filter((t: any) => t.type === "Conversion" && t.direction === "IN" && t.currency === "RMB" && t.convertedCurrency === "AUD").reduce((a: number, t: any) => a + t.amount, 0);
  const rmbFromBdt = txs.filter((t: any) => t.type === "Conversion" && t.direction === "IN" && t.currency === "RMB" && t.convertedCurrency === "BDT").reduce((a: number, t: any) => a + t.amount, 0);
  const rmbRemaining = wallets.find((w: any) => w.name === "China RMB Wallet") ? walletBalance(wallets.find((w: any) => w.name === "China RMB Wallet")) : 0;

  const chips: { label: string; clear: () => void }[] = [];
  if (datePreset !== "This Month") chips.push({ label: `Date: ${datePreset}`, clear: () => setDatePreset("This Month") });
  if (currency !== "All") chips.push({ label: `Currency: ${currency}`, clear: () => setCurrency("All") });
  if (txFilter !== "All Transactions") chips.push({ label: `Type: ${txFilter}`, clear: () => setTxFilter("All Transactions") });
  if (walletFilter !== "All Wallets") chips.push({ label: `Wallet: ${walletFilter}`, clear: () => setWalletFilter("All Wallets") });
  if (search) chips.push({ label: `Search: ${search}`, clear: () => setSearch("") });

  const clearAll = () => { setDatePreset("This Month"); setCurrency("All"); setTxFilter("All Transactions"); setWalletFilter("All Wallets"); setSearch(""); setCustomFrom(""); setCustomTo(""); };

  const cashByCurrency = ["AUD", "BDT", "RMB", "USD"].map((c) => {
    const ws = wallets.filter((w: any) => w.currency === c);
    const bal = ws.reduce((a: number, w: any) => a + walletBalance(w), 0);
    return { name: c, balance: bal, aud: ws.reduce((a: number, w: any) => a + toAud(w, walletBalance(w)), 0) };
  });

  const cashFlowData = useMemo(() => {
    const map: Record<string, { in: number; out: number }> = {};
    filteredTxs.forEach((t: any) => {
      const d = t.date ? new Date(t.date).toISOString().slice(0, 10) : "unknown";
      if (!map[d]) map[d] = { in: 0, out: 0 };
      const v = audView ? (t.audEquivalent ?? t.amount ?? 0) : (t.amount ?? 0);
      if (t.direction === "IN") map[d].in += v; else map[d].out += v;
    });
    return Object.entries(map).sort().map(([d, v]) => ({ date: d, in: v.in, out: v.out, net: v.in - v.out }));
  }, [filteredTxs, audView]);

  const conversionData = txs.filter((t: any) => t.type === "Conversion" && t.direction === "OUT").map((t: any) => {
    const inLeg = txs.find((x: any) => x.linkId === t.linkId && x.direction === "IN");
    return { pair: `${t.currency}->${inLeg?.currency}`, amount: t.amount, rate: t.exchangeRate };
  });
  const convAgg: Record<string, number> = {};
  conversionData.forEach((c: any) => { convAgg[c.pair] = (convAgg[c.pair] || 0) + c.amount; });
  const convChartData = Object.entries(convAgg).map(([k, v]) => ({ pair: k, amount: v }));

  const allocationData = [
    { name: "Inventory", value: totalInvValue },
    { name: "Supplier", value: totalSupplier * rmbToAud() },
    { name: "Shipping", value: totalShipping * rmbToAud() },
    { name: "Pickup", value: totalPickup * rmbToAud() },
    { name: "Expenses", value: totalExpenses },
    { name: "Cash", value: totalCashAud },
  ].filter((d) => d.value > 0);

  const monthlyData = useMemo(() => {
    const map: Record<string, { rev: number; exp: number }> = {};
    amazon.forEach((a: any) => {
      const m = a.settlementDate ? new Date(a.settlementDate).toISOString().slice(0, 7) : "unknown";
      if (!map[m]) map[m] = { rev: 0, exp: 0 };
      map[m].rev += a.grossSales ?? 0;
    });
    // expenses spread: use totalExpenses in current month bucket
    const m = now ? now.toISOString().slice(0, 7) : null;
    if (m) {
      if (!map[m]) map[m] = { rev: 0, exp: 0 };
      map[m].exp += totalExpenses;
    }
    return Object.entries(map).sort().map(([k, v]) => ({ month: k, revenue: v.rev, expenses: v.exp, profit: v.rev - v.exp }));
  }, [amazon, totalExpenses, now]);

  const doAddTx = async () => {
    await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTx) });
    setShowAddTx(false);
    load();
  };
  const doConv = async () => {
    const amt = Number(conv.amount); const rate = Number(conv.rate); const converted = amt * rate; const ref = conv.ref || "CONV-" + Date.now();
    await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), referenceId: ref, type: "Conversion", account: conv.fromAccount, direction: "OUT", currency: conv.fromCurrency, amount: amt, exchangeRate: rate, convertedAmount: converted, convertedCurrency: conv.toCurrency, notes: "Currency conversion", isDemo: false, linkId: ref }) });
    await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), referenceId: ref, type: "Conversion", account: conv.toAccount, direction: "IN", currency: conv.toCurrency, amount: converted, exchangeRate: rate, convertedAmount: amt, convertedCurrency: conv.fromCurrency, notes: "Currency conversion", isDemo: false, linkId: ref }) });
    setShowConv(false);
    load();
  };

  const kpis = [
    { label: "Total Cash Balance", value: money(totalCashAud, "AUD"), href: "/wallets" },
    { label: "AUD Balance", value: money(wallets.filter((w: any) => w.currency === "AUD").reduce((a: number, w: any) => a + walletBalance(w), 0), "AUD"), href: "/ledger?currency=AUD" },
    { label: "BDT Balance", value: money(wallets.filter((w: any) => w.currency === "BDT").reduce((a: number, w: any) => a + walletBalance(w), 0), "BDT"), href: "/ledger?currency=BDT" },
    { label: "RMB Balance", value: money(wallets.filter((w: any) => w.currency === "RMB").reduce((a: number, w: any) => a + walletBalance(w), 0), "RMB"), href: "/ledger?currency=RMB" },
    { label: "USD Balance", value: money(wallets.filter((w: any) => w.currency === "USD").reduce((a: number, w: any) => a + walletBalance(w), 0), "USD"), href: "/ledger?currency=USD" },
    { label: "Founder Investment", value: money(totalFounderInv, "AUD"), href: "/investments" },
    { label: "Inventory Investment", value: money(totalInvValue, "AUD"), href: "/inventory" },
    { label: "Supplier Payables", value: money(suppliers.reduce((a: number, s: any) => a + Math.max(0, (s.totalRmbPayable ?? 0) - (s.actualRmbPaid ?? 0)), 0), "RMB"), href: "/outstanding-payables" },
    { label: "Shipping Payables", value: money(shipping.reduce((a: number, s: any) => a + Math.max(0, (s.expectedRmb ?? 0) - (s.actualRmbPaid ?? 0)), 0), "RMB"), href: "/shipping-payments" },
    { label: "Amazon Payouts", value: money(totalAmazon, "AUD"), href: "/amazon" },
    { label: "Revenue", value: money(totalRevenue, "AUD"), href: "/sales-profit" },
    { label: "Expenses", value: money(totalExpenses, "AUD"), href: "/expenses" },
    { label: "Net Profit", value: money(totalProfit, "AUD"), href: "/reports" },
  ];

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

  const quickActions = [
    { label: "Add Transaction", onClick: () => setShowAddTx(true) },
    { label: "Currency Exchange", onClick: () => setShowConv(true) },
    { label: "Add Investment", href: "/investments" },
    { label: "Add Supplier Invoice", href: "/suppliers" },
    { label: "Record Supplier Payment", href: "/supplier-payments" },
    { label: "Add Shipment", href: "/shipments" },
    { label: "Record Shipping Payment", href: "/shipping-payments" },
    { label: "Add Pickup Charge", href: "/pickup-charges" },
    { label: "Add Product", href: "/products" },
    { label: "Record Amazon Settlement", href: "/amazon-settlements" },
    { label: "Add Operating Expense", href: "/expenses" },
    { label: "Import Transactions", href: "/data-import-export" },
    { label: "Export Financial Data", href: "/export-reports" },
    { label: "Transfer Between Wallets", onClick: () => setShowConv(true) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setAudView(!audView)} className="px-3 py-1 text-sm border rounded">{audView ? "AUD View" : "Original Currency"}</button>
        </div>
      </div>

      {/* Global Filters */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-zinc-500" />
          <select className="border rounded px-2 py-1 text-sm" value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
            {DATE_PRESETS.map((d) => <option key={d}>{d}</option>)}
          </select>
          {datePreset === "Custom" && (
            <>
              <input type="date" className="border rounded px-2 py-1 text-sm" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <input type="date" className="border rounded px-2 py-1 text-sm" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>
          )}
          <select className="border rounded px-2 py-1 text-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option>All</option>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={txFilter} onChange={(e) => setTxFilter(e.target.value)}>
            {TX_FILTERS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)}>
            <option>All Wallets</option>{wallets.map((w: any) => <option key={w.id}>{w.name}</option>)}
          </select>
          <div className="flex items-center border rounded px-2 py-1">
            <Search size={14} className="text-zinc-400" />
            <input className="ml-1 text-sm outline-none bg-transparent" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={clearAll} className="px-3 py-1 text-sm border rounded">Clear All</button>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                {c.label}
                <button onClick={c.clear}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h3 className="font-semibold mb-2">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a, i) => (
            a.onClick ? (
              <button key={i} onClick={a.onClick} className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">{a.label}</button>
            ) : (
              <Link key={i} href={a.href!} className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">{a.label}</Link>
            )
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:shadow-md transition">
            <div className="text-xs text-zinc-500">{k.label}</div>
            <div className="text-lg font-semibold mt-1">{k.value}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Cash Balance by Currency</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={cashByCurrency} dataKey="aud" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {cashByCurrency.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlowData}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="in" fill="#22c55e" name="In" />
              <Bar dataKey="out" fill="#ef4444" name="Out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Currency Exchange Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={convChartData}>
              <XAxis dataKey="pair" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Investment Allocation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h3 className="font-semibold mb-2">Revenue, Expenses & Profit</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#22c55e" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
            <Line type="monotone" dataKey="profit" stroke="#6366f1" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Recent Transactions</h3>
          <Link href="/ledger" className="text-sm text-indigo-600">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-800"><tr>
              <th className="px-2 py-2 text-left">Date</th><th>Ref</th><th>Type</th><th>Description</th><th>Wallet</th><th>Currency</th><th>Amount</th><th>AUD Eq</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filteredTxs.slice(0, 15).map((t: any) => (
                <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td>{t.date ? new Date(t.date).toISOString().slice(0, 10) : ""}</td>
                  <td>{t.referenceId}</td><td>{t.type}</td><td>{t.notes || t.counterparty || "-"}</td><td>{t.account}</td><td>{t.currency}</td>
                  <td>{money(t.amount)}</td><td>{money(t.audEquivalent)}</td>
                  <td className="flex gap-1">
                    <Link href="/ledger" className="text-indigo-600">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outstanding Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Supplier Outstanding</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-zinc-500"><th>Supplier</th><th>Invoice</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              {suppliers.map((s: any) => (
                <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td>{s.supplier}</td><td>{s.invoiceNumber}</td><td>{money(s.totalRmbPayable)}</td><td>{money(s.actualRmbPaid)}</td>
                  <td>{money(Math.max(0, (s.totalRmbPayable ?? 0) - (s.actualRmbPaid ?? 0)))}</td><td>{s.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Shipping Outstanding</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-zinc-500"><th>Agent</th><th>Ref</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              {shipping.map((s: any) => (
                <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td>{s.agent}</td><td>{s.shipmentRef}</td><td>{money(s.expectedRmb)}</td><td>{money(s.actualRmbPaid)}</td>
                  <td>{money(Math.max(0, (s.expectedRmb ?? 0) - (s.actualRmbPaid ?? 0)))}</td><td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RMB Funding */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h3 className="font-semibold mb-2">RMB Funding Source Tracking</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-xs text-zinc-500">RMB from AUD</div><div className="font-semibold">{money(rmbFromAud, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB from BDT</div><div className="font-semibold">{money(rmbFromBdt, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB paid suppliers</div><div className="font-semibold">{money(totalSupplier, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB paid shipping</div><div className="font-semibold">{money(totalShipping, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB paid pickup</div><div className="font-semibold">{money(totalPickup, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">Remaining RMB</div><div className="font-semibold">{money(rmbRemaining, "RMB")}</div></div>
        </div>
      </div>

      {/* Modals */}
      {showAddTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto space-y-3">
            <h3 className="font-bold">Add Transaction</h3>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="border rounded px-2 py-1 text-sm" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} />
              <input placeholder="Reference ID" className="border rounded px-2 py-1 text-sm" value={newTx.referenceId} onChange={(e) => setNewTx({ ...newTx, referenceId: e.target.value })} />
              <select className="border rounded px-2 py-1 text-sm" value={newTx.type} onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <select className="border rounded px-2 py-1 text-sm" value={newTx.account} onChange={(e) => setNewTx({ ...newTx, account: e.target.value })}><option value="">Account</option>{wallets.map((w: any) => <option key={w.id}>{w.name}</option>)}</select>
              <select className="border rounded px-2 py-1 text-sm" value={newTx.direction} onChange={(e) => setNewTx({ ...newTx, direction: e.target.value })}><option>IN</option><option>OUT</option></select>
              <select className="border rounded px-2 py-1 text-sm" value={newTx.currency} onChange={(e) => setNewTx({ ...newTx, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
              <input placeholder="Amount" type="number" step="any" className="border rounded px-2 py-1 text-sm" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} />
              <input placeholder="Exchange Rate" type="number" step="any" className="border rounded px-2 py-1 text-sm" value={newTx.exchangeRate} onChange={(e) => setNewTx({ ...newTx, exchangeRate: e.target.value })} />
              <input placeholder="Converted Amount" type="number" step="any" className="border rounded px-2 py-1 text-sm" value={newTx.convertedAmount} onChange={(e) => setNewTx({ ...newTx, convertedAmount: e.target.value })} />
              <input placeholder="Converted Currency" className="border rounded px-2 py-1 text-sm" value={newTx.convertedCurrency} onChange={(e) => setNewTx({ ...newTx, convertedCurrency: e.target.value })} />
              <input placeholder="AUD Equivalent" type="number" step="any" className="border rounded px-2 py-1 text-sm" value={newTx.audEquivalent} onChange={(e) => setNewTx({ ...newTx, audEquivalent: e.target.value })} />
              <input placeholder="Counterparty" className="border rounded px-2 py-1 text-sm" value={newTx.counterparty} onChange={(e) => setNewTx({ ...newTx, counterparty: e.target.value })} />
              <input placeholder="SKU" className="border rounded px-2 py-1 text-sm" value={newTx.sku} onChange={(e) => setNewTx({ ...newTx, sku: e.target.value })} />
              <input placeholder="Notes" className="border rounded px-2 py-1 text-sm col-span-2" value={newTx.notes} onChange={(e) => setNewTx({ ...newTx, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddTx(false)} className="px-3 py-1 text-sm border rounded">Cancel</button>
              <button onClick={doAddTx} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {showConv && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-96 space-y-3">
            <h3 className="font-bold">Add Currency Conversion</h3>
            <input placeholder="Reference (optional)" className="w-full border rounded px-2 py-1 text-sm" value={conv.ref} onChange={(e) => setConv({ ...conv, ref: e.target.value })} />
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.fromAccount} onChange={(e) => setConv({ ...conv, fromAccount: e.target.value })}><option value="">From account</option>{wallets.map((w: any) => <option key={w.id}>{w.name}</option>)}</select>
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.fromCurrency} onChange={(e) => setConv({ ...conv, fromCurrency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input placeholder="Amount" type="number" className="w-full border rounded px-2 py-1 text-sm" value={conv.amount} onChange={(e) => setConv({ ...conv, amount: e.target.value })} />
            <input placeholder="Rate" type="number" step="any" className="w-full border rounded px-2 py-1 text-sm" value={conv.rate} onChange={(e) => setConv({ ...conv, rate: e.target.value })} />
            <div className="text-xs text-zinc-500">Converted: {conv.amount && conv.rate ? (Number(conv.amount) * Number(conv.rate)).toFixed(4) : "-"}</div>
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.toAccount} onChange={(e) => setConv({ ...conv, toAccount: e.target.value })}><option value="">To account</option>{wallets.map((w: any) => <option key={w.id}>{w.name}</option>)}</select>
            <select className="w-full border rounded px-2 py-1 text-sm" value={conv.toCurrency} onChange={(e) => setConv({ ...conv, toCurrency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConv(false)} className="px-3 py-1 text-sm border rounded">Cancel</button>
              <button onClick={doConv} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}