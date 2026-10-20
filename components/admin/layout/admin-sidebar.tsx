"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import { LayoutDashboard, ClipboardCheck, ClipboardList, BarChart3, Users, History, ShieldCheck, LogOut, X } from "lucide-react";

type Props = { isOpen: boolean; onClose: () => void };
type Item = { label: string; href: string; icon: typeof LayoutDashboard };
type Group = { label: string; items: Item[] };
const groups: Group[] = [
  { label: "Main", items: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Account Registration Approval", href: "/admin/account-registration-approval", icon: ClipboardCheck },
    { label: "Document Request Approval", href: "/admin/requests", icon: ClipboardList },
  ] },
  { label: "Management", items: [
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  ] },
  { label: "System", items: [
    { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
    { label: "Role Management", href: "/admin/roles", icon: ShieldCheck },
  ] },
];

export default function AdminSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("Administrator");
  useEffect(() => { setAdminName(getCurrentUser()?.fullName || "Administrator"); }, []);
  return (
    <>
      {isOpen && <button type="button" aria-label="Close admin sidebar overlay" onClick={onClose} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}
      <aside className={"fixed inset-y-0 left-0 z-50 flex w-[275px] max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#0B2A6F] via-[#1749A6] to-[#2563EB] text-white shadow-2xl transition-transform duration-300 " + (isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="relative flex shrink-0 flex-col items-center border-b border-white/10 px-4 pb-5 pt-6">
          <button type="button" aria-label="Close admin sidebar" onClick={onClose} className="absolute right-3 top-3 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"><X size={19} /></button>
          <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/10 p-1 ring-1 ring-white/15"><img src="/Qeci_Logo.png" alt="QECI Logo" className="h-full w-full rounded-full object-contain" /></div>
          <h1 className="text-base font-bold tracking-[0.08em]">QUEZONIAN</h1>
          <p className="mt-1 text-center text-[9px] font-medium tracking-[0.12em] text-blue-100/80">ADMINISTRATION</p>
          <p className="mt-3 max-w-full truncate text-xs text-blue-100">{adminName}</p>
        </div>
        <nav aria-label="Administrator navigation" className="flex-1 overflow-y-auto px-3 py-5"><div className="space-y-6">
          {groups.map((group) => <div key={group.label}><div className="mb-2 px-3"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/60">{group.label}</span></div><div className="space-y-1">
            {group.items.map((item) => { const Icon = item.icon; const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/")); return <Link key={item.href} href={item.href} onClick={onClose} aria-current={active ? "page" : undefined} className={"group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 " + (active ? "bg-white/14 text-white shadow-sm" : "text-blue-50/85 hover:bg-white/[0.08] hover:text-white")}><span className={"absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full " + (active ? "bg-white" : "bg-transparent")} /><Icon size={18} className="shrink-0" /><span className="truncate tracking-wide">{item.label}</span></Link>; })}
          </div></div>)}
        </div></nav>
        <div className="shrink-0 border-t border-white/10 p-3"><Link href="/login" onClick={() => { sessionStorage.removeItem("currentUser"); onClose(); }} className="group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium text-blue-50/80 hover:bg-white/[0.08] hover:text-white"><LogOut size={18} /><span className="tracking-wide">Log Out</span></Link></div>
      </aside>
    </>
  );
}
