"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, ShieldCheck, Trash2, UsersRound, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout";
import Topbar from "@/components/shared/layout/topbar";
import {
  approveAccount,
  createRole,
  deleteRole,
  getPendingAccounts,
  rejectAccount,
  renameRole,
} from "@/lib/admin/services/administration";
import { getRoles } from "@/lib/shared/storage/roles";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import type { SafeUser, UserProfile } from "@/lib/shared/types/account";

type Tab = "approvals" | "roles";

export default function AdminPanel({ initialTab = "approvals" }: { initialTab?: Tab }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<SafeUser[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [tab] = useState<Tab>(initialTab);
  const [newRole, setNewRole] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.role === "Administrator") {
      const pending = getPendingAccounts();
      const availableRoles = getRoles();
      setPendingAccounts(pending);
      setRoles(availableRoles);
    }
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
    const result = approveAccount(account.email);
    setFeedback(result.success ? `${account.fullName} approved.` : result.message);
    refresh();
  }

  function handleReject(account: SafeUser) {
    const result = rejectAccount(account.email);
    setFeedback(result.success ? `${account.fullName}'s request rejected.` : result.message);
    refresh();
  }

  function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createRole(newRole);
    setFeedback(result.success ? `Role “${newRole.trim()}” created.` : result.message);
    if (result.success) setNewRole("");
    refresh();
  }

  function handleEditRole(role: string) {
    setEditingRole(role);
    setRoleDraft(role);
    setFeedback("");
  }

  function handleSaveRole(role: string) {
    const result = renameRole(role, roleDraft);
    setFeedback(result.success ? `Role “${role}” updated to “${roleDraft.trim()}”.` : result.message);
    if (result.success) setEditingRole(null);
    refresh();
  }

  function handleDeleteRole(role: string) {
    const result = deleteRole(role);
    setFeedback(result.success ? `Role “${role}” removed.` : result.message);
    refresh();
  }

  if (!isReady || currentUser?.role !== "Administrator") {
    return <div className="min-h-screen bg-[#f2f6fc]" aria-label="Loading administration panel" />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fc] text-slate-800">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`min-h-screen w-full transition-[margin] duration-300 ${sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full"}`}>
        <Topbar title={tab === "approvals" ? "Account Registration Approval" : "Role Management"} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6">
          <section className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#102c79] to-[#1b4db5] p-6 text-white shadow-sm">
            <div className="rounded-xl bg-white/10 p-3"><ShieldCheck size={30} /></div>
            <div>
              <h1 className="text-xl font-semibold">{tab === "approvals" ? "Account Registration Approval" : "Role Management"}</h1>
              <p className="mt-1 text-sm text-blue-100">{tab === "approvals" ? "Review and approve account registration requests." : "Manage the roles available in the system."}</p>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Pending account requests</p>
              <p className="mt-1 text-2xl font-semibold text-[#163b83]">{pendingAccounts.length}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Available roles</p>
              <p className="mt-1 text-2xl font-semibold text-[#163b83]">{roles.length}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {feedback && (
              <div role="status" className="mx-4 mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{feedback}</div>
            )}

            {tab === "approvals" ? (
              <div className="space-y-3 p-4">
                {pendingAccounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
                    <UsersRound className="mx-auto mb-2 text-slate-400" />
                    No accounts are waiting for approval.
                  </div>
                ) : pendingAccounts.map((account) => (
                  <article key={account.email} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-800">{account.fullName}</h2>
                      <p className="text-sm text-slate-500">{account.email} · {account.username}</p>
                      <p className="mt-1 text-xs text-slate-500">{account.department || "No department selected"} · Requested role: {account.role || "None"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => handleApprove(account)} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"><Check size={16} /> Approve</button>
                      <button type="button" onClick={() => handleReject(account)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"><X size={16} /> Reject</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <form onSubmit={handleCreateRole} className="flex flex-col gap-2 sm:flex-row">
                  <label className="sr-only" htmlFor="new-role">New role name</label>
                  <input id="new-role" value={newRole} onChange={(event) => setNewRole(event.target.value)} maxLength={32} placeholder="New role name" className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" />
                  <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800"><Plus size={16} /> Add role</button>
                </form>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {roles.map((role) => (
                    <li key={role} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      {editingRole === role ? (
                        <input autoFocus aria-label={"Edit " + role + " role name"} value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} maxLength={32} className="h-9 min-w-40 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" />
                      ) : (
                        <span className="text-sm font-medium text-slate-700">{role}</span>
                      )}
                      {role === "Administrator" ? (
                        <span className="text-xs text-slate-400">Required system role</span>
                      ) : editingRole === role ? (
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleSaveRole(role)} aria-label={"Save " + role + " role"} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"><Check size={16} /></button>
                          <button type="button" onClick={() => setEditingRole(null)} aria-label={"Cancel editing " + role + " role"} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleEditRole(role)} aria-label={"Edit " + role + " role"} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"><Pencil size={16} /></button>
                          <button type="button" onClick={() => handleDeleteRole(role)} aria-label={"Remove " + role + " role"} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500">Editing a role also updates accounts that use it. A role assigned to an account cannot be removed.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
