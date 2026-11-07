"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";

export default function Wallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([fetch("/api/wallets").then((r) => r.json()), fetch("/api/transactions").then((r) => r.json())]).then(([w, t]) => { setWallets(w); setTxs(t); });
  }, []);
  const balance = (w: any) => {
    const ins = txs.filter((t) => t.account === w.name && t.direction === "IN").reduce((a, t) => a + t.amount, 0);
    const outs = txs.filter((t) => t.account === w.name && t.direction === "OUT").reduce((a, t) => a + t.amount, 0);
    return w.openingBalance + ins - outs;
  };
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Wallets & Balances</h2>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800"><tr><th className="px-3 py-2 text-left">Wallet</th><th>Currency</th><th>Opening</th><th>Received</th><th>Paid</th><th>Balance</th></tr></thead>
          <tbody>
            {wallets.map((w) => {
              const ins = txs.filter((t) => t.account === w.name && t.direction === "IN").reduce((a, t) => a + t.amount, 0);
              const outs = txs.filter((t) => t.account === w.name && t.direction === "OUT").reduce((a, t) => a + t.amount, 0);
              return (
                <tr key={w.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{w.name}</td><td>{w.currency}</td><td>{money(w.openingBalance)}</td><td>{money(ins)}</td><td>{money(outs)}</td><td className="font-semibold">{money(balance(w))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-zinc-500">Edit opening balances in Settings.</p>
    </div>
  );
}