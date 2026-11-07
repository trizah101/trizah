"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Wallet = { id: string; name: string; currency: string; openingBalance: number };
type Tx = any;
type Rate = { pair: string; rate: number };

export default function Dashboard() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [shipping, setShipping] = useState<any[]>([]);
  const [pickup, setPickup] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [amazon, setAmazon] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

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

  const rateOf = (pair: string) => {
    const found = rates.filter((x) => x.pair === pair).sort((a, b) => 0)[0];
    return found ? found.rate : null;
  };
  const rmbToAud = () => {
    const r = rateOf("RMB->AUD");
    if (r) return r;
    const r2 = rateOf("AUD->RMB");
    return r2 ? 1 / r2 : 0.21;
  };
  const bdtToAud = () => {
    const r = rateOf("BDT->AUD");
    if (r) return r;
    const r2 = rateOf("AUD->BDT");
    return r2 ? 1 / r2 : 0.013;
  };

  const walletBalance = (w: Wallet) => {
    const ins = txs.filter((t) => t.account === w.name && t.direction === "IN").reduce((a, t) => a + t.amount, 0);
    const outs = txs.filter((t) => t.account === w.name && t.direction === "OUT").reduce((a, t) => a + t.amount, 0);
    return w.openingBalance + ins - outs;
  };
  const toAud = (w: Wallet, bal: number) => {
    if (w.currency === "AUD") return bal;
    if (w.currency === "RMB") return bal * rmbToAud();
    if (w.currency === "BDT") return bal * bdtToAud();
    if (w.currency === "USD") return bal * (rateOf("USD->AUD") ?? 1.5);
    return bal;
  };

  const totalCashAud = wallets.reduce((a, w) => a + toAud(w, walletBalance(w)), 0);

  const totalFounderInv = investments.reduce((a, i) => a + (i.audEquivalent ?? 0), 0);
  const totalBdtInv = investments.filter((i) => i.currency === "BDT").reduce((a, i) => a + (i.amount ?? 0), 0);
  const totalAudInv = investments.filter((i) => i.currency === "AUD").reduce((a, i) => a + (i.amount ?? 0), 0);
  const totalRmbPurchased = txs.filter((t) => t.type === "Conversion" && t.direction === "IN" && t.currency === "RMB").reduce((a, t) => a + t.amount, 0);
  const rmbFromAud = txs.filter((t) => t.type === "Conversion" && t.direction === "IN" && t.currency === "RMB" && t.convertedCurrency === "AUD").reduce((a, t) => a + t.amount, 0);
  const rmbFromBdt = txs.filter((t) => t.type === "Conversion" && t.direction === "IN" && t.currency === "RMB" && t.convertedCurrency === "BDT").reduce((a, t) => a + t.amount, 0);
  const rmbPaidSuppliers = suppliers.reduce((a, s) => a + (s.actualRmbPaid ?? 0), 0);
  const rmbPaidShipping = shipping.reduce((a, s) => a + (s.actualRmbPaid ?? 0), 0);
  const rmbPaidPickup = pickup.reduce((a, p) => a + (p.rmbCharge ?? 0), 0);
  const rmbWallet = wallets.find((w: any) => w.name === "China RMB Wallet");
  const rmbRemaining = rmbWallet ? walletBalance(rmbWallet) : 0;
  // weighted avg AUD cost per RMB
  let audSpentForRmb = 0; let rmbAcquired = 0;
  txs.filter((t) => t.type === "Conversion" && t.direction === "OUT" && t.currency === "AUD").forEach((t) => { audSpentForRmb += t.amount; const inLeg = txs.find((x) => x.linkId === t.linkId && x.direction === "IN" && x.currency === "RMB"); if (inLeg) rmbAcquired += inLeg.amount; });
  // BDT conversions: use BDT->AUD rate if available
  const bdtToAudRate = bdtToAud();
  txs.filter((t) => t.type === "Conversion" && t.direction === "OUT" && t.currency === "BDT").forEach((t) => { audSpentForRmb += t.amount * bdtToAudRate; const inLeg = txs.find((x) => x.linkId === t.linkId && x.direction === "IN" && x.currency === "RMB"); if (inLeg) rmbAcquired += inLeg.amount; });
  const avgAudPerRmb = rmbAcquired ? audSpentForRmb / rmbAcquired : 0;
  const totalSupplier = suppliers.reduce((a, s) => a + (s.actualRmbPaid ?? s.totalRmbPayable ?? 0), 0);
  const totalShipping = shipping.reduce((a, s) => a + (s.actualRmbPaid ?? s.expectedRmb ?? 0), 0);
  const totalPickup = pickup.reduce((a, p) => a + (p.rmbCharge ?? 0), 0);
  const totalInvValue = inventory.reduce((a, i) => a + (i.totalAudLanded ?? (i.totalRmbLanded ?? 0) * rmbToAud()), 0);
  const totalAmazon = amazon.reduce((a, a2) => a + (a2.netPayout ?? 0), 0);
  const totalExpenses = (totalSupplier + totalShipping + totalPickup) * rmbToAud();

  const cards = [
    { label: "Total Founder Investment (AUD)", value: money(totalFounderInv, "AUD") },
    { label: "Total BDT Investment", value: money(totalBdtInv, "BDT") },
    { label: "Total AUD Investment", value: money(totalAudInv, "AUD") },
    { label: "Total RMB Purchased", value: money(totalRmbPurchased, "RMB") },
    { label: "Total Supplier Payments (RMB)", value: money(totalSupplier, "RMB") },
    { label: "Total Shipping (RMB)", value: money(totalShipping, "RMB") },
    { label: "Total Pickup (RMB)", value: money(totalPickup, "RMB") },
    { label: "Inventory Value (AUD)", value: money(totalInvValue, "AUD") },
    { label: "Total Amazon Payouts (AUD)", value: money(totalAmazon, "AUD") },
    { label: "Current Cash (AUD)", value: money(totalCashAud, "AUD") },
    { label: "Operating Expenses (AUD)", value: money(totalExpenses, "AUD") },
  ];

  const walletChartData = wallets.map((w) => ({ name: w.name, balance: walletBalance(w) }));

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="text-xs text-zinc-500">{c.label}</div>
            <div className="text-lg font-semibold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Wallet Balances</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-zinc-500"><th>Wallet</th><th>Currency</th><th>Balance</th><th>AUD Eq</th></tr></thead>
            <tbody>
              {wallets.map((w) => {
                const bal = walletBalance(w);
                return (
                  <tr key={w.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td>{w.name}</td><td>{w.currency}</td><td>{money(bal)}</td><td>{money(toAud(w, bal), "AUD")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-semibold mb-2">Wallet Balance Chart</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={walletChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="balance" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h3 className="font-semibold mb-2">RMB Funding Source Tracking</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-xs text-zinc-500">RMB from AUD</div><div className="font-semibold">{money(rmbFromAud, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB from BDT</div><div className="font-semibold">{money(rmbFromBdt, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB paid suppliers</div><div className="font-semibold">{money(rmbPaidSuppliers, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB paid shipping</div><div className="font-semibold">{money(rmbPaidShipping, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">RMB paid pickup</div><div className="font-semibold">{money(rmbPaidPickup, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">Remaining RMB</div><div className="font-semibold">{money(rmbRemaining, "RMB")}</div></div>
          <div><div className="text-xs text-zinc-500">Avg AUD cost per RMB</div><div className="font-semibold">{avgAudPerRmb.toFixed(4)} AUD</div></div>
        </div>
      </div>
    </div>
  );
}