"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import {
  Moon, Sun, LayoutDashboard, BarChart3, LineChart, ArrowLeftRight, Wallet, Coins, Receipt, Package, FileText, CreditCard, Truck, DollarSign, MapPin, ShoppingCart, Layers, TrendingUp, RefreshCw, PieChart, Download, History, Settings, Database, ChevronDown,
} from "lucide-react";

type Item = { href: string; label: string; icon: any };
type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  { title: "OVERVIEW", items: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/financial-summary", label: "Financial Summary", icon: BarChart3 },
    { href: "/cash-flow", label: "Cash Flow", icon: LineChart },
  ]},
  { title: "FINANCIAL MANAGEMENT", items: [
    { href: "/ledger", label: "All Transactions", icon: FileText },
    { href: "/currency-exchange", label: "Currency Exchange", icon: ArrowLeftRight },
    { href: "/wallets", label: "Wallets & Balances", icon: Wallet },
    { href: "/rates", label: "Exchange Rates", icon: Coins },
    { href: "/investments", label: "Founder Investments", icon: Coins },
    { href: "/expenses", label: "Expenses", icon: Receipt },
  ]},
  { title: "PURCHASING & SUPPLIERS", items: [
    { href: "/suppliers", label: "Suppliers", icon: Package },
    { href: "/supplier-invoices", label: "Supplier Invoices", icon: FileText },
    { href: "/supplier-payments", label: "Supplier Payments", icon: CreditCard },
    { href: "/outstanding-payables", label: "Outstanding Payables", icon: DollarSign },
  ]},
  { title: "SHIPPING & INVENTORY", items: [
    { href: "/shipments", label: "Shipments", icon: Truck },
    { href: "/shipping-payments", label: "Shipping Payments", icon: CreditCard },
    { href: "/pickup-charges", label: "Pickup Charges", icon: MapPin },
    { href: "/products", label: "Products & SKUs", icon: ShoppingCart },
    { href: "/inventory", label: "Inventory", icon: Layers },
    { href: "/landed-cost", label: "Landed Cost Calculator", icon: TrendingUp },
  ]},
  { title: "AMAZON MANAGEMENT", items: [
    { href: "/amazon-settlements", label: "Amazon Settlements", icon: TrendingUp },
    { href: "/amazon-reconciliation", label: "Amazon Payout Reconciliation", icon: RefreshCw },
    { href: "/sales-profit", label: "Sales & Profit Summary", icon: PieChart },
  ]},
  { title: "REPORTS", items: [
    { href: "/reports", label: "Financial Reports", icon: BarChart3 },
    { href: "/currency-reports", label: "Currency Reports", icon: Coins },
    { href: "/investment-reports", label: "Investment Reports", icon: Coins },
    { href: "/supplier-reports", label: "Supplier Reports", icon: Package },
    { href: "/shipping-reports", label: "Shipping Reports", icon: Truck },
    { href: "/product-profitability", label: "Product Profitability", icon: TrendingUp },
    { href: "/export-reports", label: "Export Reports", icon: Download },
  ]},
  { title: "SYSTEM", items: [
    { href: "/audit", label: "Activity & Audit History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/data-import-export", label: "Data Import / Export", icon: Database },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    GROUPS.forEach((g) => (init[g.title] = true));
    return init;
  });
  const toggleGroup = (t: string) => setOpen((p) => ({ ...p, [t]: !p[t] }));

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-bold">TRIZAH</h1>
        <p className="text-xs text-zinc-500">Accounting & FBA</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-2">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <button onClick={() => toggleGroup(g.title)} className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wide hover:text-zinc-700 dark:hover:text-zinc-300">
              {g.title}
              <ChevronDown size={12} className={`transition ${open[g.title] ? "rotate-0" : "-rotate-90"}`} />
            </button>
            {open[g.title] && (
              <div className="space-y-1 mt-1">
                {g.items.map((n) => {
                  const Icon = n.icon;
                  const active = pathname === n.href;
                  return (
                    <Link key={n.href} href={n.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                      <Icon size={16} /> {n.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={toggle} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 w-full">
          {dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}