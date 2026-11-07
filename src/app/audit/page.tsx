"use client";
import { useEffect, useState } from "react";

export default function Audit() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { fetch("/api/audit").then((r) => r.json()).then(setLogs); }, []);
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Activity & Audit History</h2>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-zinc-100 dark:bg-zinc-800"><tr><th className="px-2 py-2">Date</th><th>Action</th><th>Transaction</th><th>Before</th><th>After</th></tr></thead>
          <tbody>
            {logs.map((a) => (
              <tr key={a.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-2 py-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</td>
                <td>{a.action}</td><td>{a.transactionId}</td>
                <td className="max-w-xs truncate">{a.before}</td><td className="max-w-xs truncate">{a.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}