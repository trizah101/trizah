"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun, LayoutDashboard, BookOpen, Wallet, Package, Truck, MapPin, ShoppingCart, TrendingUp, Coins, BarChart3, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/suppliers", label: "Suppliers", icon: Package },
  { href: "/shipping", label: "Shipping", icon: Truck },
  { href: "/pickup", label: "Pickup", icon: MapPin },
  { href: "/inventory", label: "Inventory", icon: ShoppingCart },
  { href: "/amazon", label: "Amazon", icon: TrendingUp },
  { href: "/investments", label: "Investments", icon: Coins },
  { href: "/rates", label: "Rates", icon: Coins },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-bold">TRIZAH</h1>
        <p className="text-xs text-zinc-500">Accounting & FBA</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
              <Icon size={16} /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={toggle} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 w-full">
          {dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}