"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Search, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout";
import Topbar from "@/components/shared/layout/topbar";
import {
  DOCUMENT_REQUESTS_UPDATED_EVENT,
  getDocumentRequests,
  reviewDocumentRequest,
} from "@/lib/shared/storage/requests";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import { COURSE_LABELS } from "@/lib/users/constants/student";
import type { DocumentRequest } from "@/lib/shared/types/request";

type RequestFilter = "Pending" | "Reviewed" | "All";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export default function DocumentRequestApproval() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RequestFilter>("Pending");
  const [feedback, setFeedback] = useState("");

  const refresh = useCallback(() => setRequests(getDocumentRequests()), []);

  useEffect(() => {
    const updateSidebar = () => setSidebarOpen(window.innerWidth >= 1024);
    refresh();
    updateSidebar();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(DOCUMENT_REQUESTS_UPDATED_EVENT, refresh);
    window.addEventListener("resize", updateSidebar);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(DOCUMENT_REQUESTS_UPDATED_EVENT, refresh);
      window.removeEventListener("resize", updateSidebar);
    };
  }, [refresh]);

  const pendingCount = requests.filter((request) => request.status === "Pending Admin Review").length;
  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesFilter = filter === "All"
        || (filter === "Pending" && request.status === "Pending Admin Review")
        || (filter === "Reviewed" && request.status !== "Pending Admin Review");
      const matchesQuery = !normalizedQuery || [
        request.studentName,
        request.studentId,
        request.requestedBy,
        request.requestedByEmail,
        request.documentType,
        request.purpose,
      ].join(" ").toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [requests, filter, query]);

  function handleReview(request: DocumentRequest, status: "Approved" | "Rejected") {
    const currentUser = getCurrentUser();
    const updated = reviewDocumentRequest(
      request.id,
      status,
      currentUser?.fullName || currentUser?.username || "Administrator"
    );
    setFeedback(updated
      ? `${request.studentName}'s document request was ${status.toLowerCase()}.`
      : "This request was already reviewed or is no longer available.");
    refresh();
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fc] text-slate-800">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`min-h-screen w-full transition-[margin] duration-300 ${sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full"}`}>
        <Topbar title="Document Request Approval" onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6">
          <section className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#102c79] to-[#1b4db5] p-6 text-white shadow-sm">
            <div className="rounded-xl bg-white/10 p-3"><ClipboardList size={28} /></div>
            <div>
              <h1 className="text-xl font-semibold">Document Request Approval</h1>
              <p className="mt-1 text-sm text-blue-100">Review user-submitted student document requests and approve or reject them.</p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Pending document requests</p>
            <p className="mt-1 text-2xl font-semibold text-[#163b83]">{pendingCount}</p>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex flex-wrap gap-2" aria-label="Filter document requests">
                {(["Pending", "Reviewed", "All"] as const).map((option) => (
                  <button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === option ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {option}{option === "Pending" ? ` (${pendingCount})` : ""}
                  </button>
                ))}
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-300 px-3 sm:max-w-xs">
                <Search size={15} className="text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 text-sm outline-none" placeholder="Search requests" aria-label="Search document requests" />
              </label>
            </div>

            {feedback && <p role="status" className="mx-4 mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{feedback}</p>}
            {visibleRequests.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <ClipboardList className="mx-auto text-slate-300" size={30} />
                <p className="mt-3 text-sm font-medium text-slate-700">{filter === "Pending" ? "No requests awaiting approval" : "No requests found"}</p>
                <p className="mt-1 text-xs text-slate-500">Requests submitted by users will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleRequests.map((request) => (
                  <article key={request.id} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-800">{request.studentName}</h2>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${request.status === "Approved" ? "bg-emerald-50 text-emerald-700" : request.status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{request.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{request.studentId} · {COURSE_LABELS[request.course ?? ""] ?? request.course ?? "Course not set"} · {request.yearLevel ?? "Year level not set"}</p>
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <p><span className="text-slate-500">Document: </span><span className="font-medium">{request.documentType}</span></p>
                          <p><span className="text-slate-500">Submitted: </span>{formatDate(request.dateCreated)}</p>
                          <p><span className="text-slate-500">Requested by: </span>{request.requestedBy}{request.requestedByEmail ? ` · ${request.requestedByEmail}` : ""}</p>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.purpose}</p>
                        {request.reviewedAt && <p className="mt-2 text-xs text-slate-400">Reviewed by {request.reviewedBy || "Administrator"} · {formatDate(request.reviewedAt)}</p>}
                      </div>
                      {request.status === "Pending Admin Review" && (
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => handleReview(request, "Approved")} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"><Check size={16} /> Approve</button>
                          <button type="button" onClick={() => handleReview(request, "Rejected")} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"><X size={16} /> Reject</button>
                        </div>
                      )}
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
