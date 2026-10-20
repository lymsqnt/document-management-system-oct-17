"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, Users, BarChart3, History, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout";
import Topbar from "@/components/shared/layout/topbar";
import { getAccounts } from "@/lib/shared/storage/accounts";
import { getAuditLogs } from "@/lib/shared/storage/audit-logs";
import { getRoles } from "@/lib/shared/storage/roles";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ pending: 0, users: 0, roles: 0, auditLogs: 0 });
  useEffect(() => {
    const updateSidebar = () => setSidebarOpen(window.innerWidth >= 1024);
    const load = () => {
      const accounts = getAccounts();
      setStats({
        pending: accounts.filter((account) => account.status === "pending").length,
        users: accounts.filter((account) => account.role !== "Administrator").length,
        roles: getRoles().filter((role) => role !== "Administrator").length,
        auditLogs: getAuditLogs().length,
      });
    };
    updateSidebar();
    load();
    window.addEventListener("resize", updateSidebar);
    window.addEventListener("focus", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("resize", updateSidebar);
      window.removeEventListener("focus", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const cards = [
    { label: "Pending registrations", value: stats.pending, href: "/admin/account-registration-approval", icon: ClipboardCheck, tone: "text-amber-700 bg-amber-50" },
    { label: "Users", value: stats.users, href: "/admin/users", icon: Users, tone: "text-blue-700 bg-blue-50" },
    { label: "Available roles", value: stats.roles, href: "/admin/roles", icon: ShieldCheck, tone: "text-indigo-700 bg-indigo-50" },
    { label: "Audit records", value: stats.auditLogs, href: "/admin/audit-logs", icon: History, tone: "text-emerald-700 bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fc] text-slate-800">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={"min-h-screen w-full transition-[margin] duration-300 " + (sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full")}>
        <Topbar title="Admin Dashboard" onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:p-6">
          <section className="rounded-2xl bg-gradient-to-r from-[#102c79] to-[#1b4db5] p-6 text-white shadow-sm">
            <h1 className="text-xl font-semibold">Administration Overview</h1>
            <p className="mt-1 text-sm text-blue-100">Manage registrations, users, reports, roles, and system activity.</p>
          </section>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => { const Icon = card.icon; return <Link key={card.label} href={card.href} className="rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{card.label}</p><p className="mt-2 text-3xl font-semibold text-[#163b83]">{card.value}</p></div><span className={"rounded-xl p-3 " + card.tone}><Icon size={22} /></span></div></Link>; })}
          </section>
          <Link href="/admin/reports" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><BarChart3 size={22} /></span><span><span className="block font-semibold text-slate-800">View reports</span><span className="mt-1 block text-sm text-slate-500">Review document compliance and submission summaries.</span></span></Link>
        </div>
      </main>
    </div>
  );
}
