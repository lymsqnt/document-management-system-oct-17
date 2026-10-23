"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, UsersRound, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout";
import Topbar from "@/components/shared/layout/topbar";
import { approveAccount, getPendingAccounts, rejectAccount } from "@/lib/admin/services/administration";
import { OPERATIONAL_ROLES } from "@/lib/shared/constants/account";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import type { SafeUser, UserProfile } from "@/lib/shared/types/account";

type Tab = "approvals" | "roles";

export default function AdminPanel({ initialTab = "approvals" }: { initialTab?: Tab }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<SafeUser[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.role === "Administrator") setPendingAccounts(getPendingAccounts());
    setIsReady(true);
  }, []);

  useEffect(() => {
    const updateSidebar = () => setSidebarOpen(window.innerWidth >= 1024);
    updateSidebar();
    refresh();
    window.addEventListener("resize", updateSidebar);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("resize", updateSidebar);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!isReady) return;
    if (!currentUser) router.replace("/login");
    else if (currentUser.role !== "Administrator") router.replace("/dashboard");
  }, [currentUser, isReady, router]);

  function handleApprove(account: SafeUser) {
    const assignedRole = assignedRoles[account.email] || "";
    const result = approveAccount(account.email, assignedRole);
    setFeedback(result.success ? `${account.fullName} approved as ${assignedRole}.` : result.message);
    if (result.success) setAssignedRoles((roles) => {
      const next = { ...roles };
      delete next[account.email];
      return next;
    });
    refresh();
  }

  function handleReject(account: SafeUser) {
    const result = rejectAccount(account.email);
    setFeedback(result.success ? `${account.fullName}'s request rejected.` : result.message);
    refresh();
  }

  if (!isReady || currentUser?.role !== "Administrator") {
    return <div className="min-h-screen bg-[#f2f6fc]" aria-label="Loading administration panel" />;
  }

  const roleTab = initialTab === "roles";
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fc] text-slate-800">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`min-h-screen w-full transition-[margin] duration-300 ${sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full"}`}>
        <Topbar title={roleTab ? "Role Management" : "Account Registration Approval"} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6">
          <section className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#102c79] to-[#1b4db5] p-6 text-white shadow-sm">
            <div className="rounded-xl bg-white/10 p-3"><ShieldCheck size={30} /></div>
            <div>
              <h1 className="text-xl font-semibold">{roleTab ? "System Roles" : "Account Registration Approval"}</h1>
              <p className="mt-1 text-sm text-blue-100">{roleTab ? "Each fixed role has its own screens and responsibilities." : "Assign a role to each applicant before approving the account."}</p>
            </div>
          </section>

          {!roleTab && <section className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Pending account requests</p>
            <p className="mt-1 text-2xl font-semibold text-[#163b83]">{pendingAccounts.length}</p>
          </section>}

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {feedback && <div role="status" className="mx-4 mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{feedback}</div>}
            {roleTab ? (
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <article className="rounded-xl border border-slate-200 p-4">
                  <h2 className="font-semibold text-slate-800">Student Records Encoder</h2>
                  <p className="mt-2 text-sm text-slate-600">Encodes student information and uploads student credentials.</p>
                  <p className="mt-3 text-xs font-medium text-blue-700">Dashboard · Documents · Student List</p>
                </article>
                <article className="rounded-xl border border-slate-200 p-4">
                  <h2 className="font-semibold text-slate-800">Document Request Encoder</h2>
                  <p className="mt-2 text-sm text-slate-600">Creates and submits document requests for administrator review.</p>
                  <p className="mt-3 text-xs font-medium text-blue-700">Dashboard · Request</p>
                </article>
                <p className="text-xs text-slate-500 md:col-span-2">Roles are fixed because each role has its own access and screens. New roles can be added when their workflow is defined.</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {pendingAccounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500"><UsersRound className="mx-auto mb-2 text-slate-400" />No accounts are waiting for approval.</div>
                ) : pendingAccounts.map((account) => (
                  <article key={account.email} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-800">{account.fullName}</h2>
                      <p className="text-sm text-slate-500">{account.email} · {account.username}</p>
                      <p className="mt-1 text-xs text-slate-500">{account.department || "No office selected"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`assign-role-${account.email}`}>Assign a role to {account.fullName}</label>
                      <select id={`assign-role-${account.email}`} value={assignedRoles[account.email] || ""} onChange={(event) => setAssignedRoles((roles) => ({ ...roles, [account.email]: event.target.value }))} className="h-10 min-w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600">
                        <option value="">Select role to assign</option>
                        {OPERATIONAL_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                      <button type="button" disabled={!assignedRoles[account.email]} onClick={() => handleApprove(account)} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Check size={16} /> Approve</button>
                      <button type="button" onClick={() => handleReject(account)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"><X size={16} /> Reject</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
