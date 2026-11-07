"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) router.push("/"); else setError("Invalid password");
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <form onSubmit={submit} className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow w-80 space-y-3">
        <h1 className="text-xl font-bold">TRIZAH Accounting</h1>
        <p className="text-sm text-zinc-500">Enter password to continue</p>
        <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full bg-indigo-600 text-white py-2 rounded">Sign in</button>
      </form>
    </div>
  );
}