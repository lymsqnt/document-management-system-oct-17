"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck, Download, FileText, Search } from "lucide-react";
import RequesterSidebar from "@/components/users/layout/requester-sidebar";
import Topbar from "@/components/shared/layout/topbar";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import { logActivity } from "@/lib/shared/storage/audit-logs";
import {
  DOCUMENT_REQUESTS_UPDATED_EVENT,
  getDocumentRequests,
  releaseDocumentRequest,
} from "@/lib/shared/storage/requests";
import { getDocumentsByStudentId } from "@/lib/users/storage/student-documents";
import { COURSE_LABELS } from "@/lib/users/constants/student";
import type { DocumentRequest } from "@/lib/shared/types/request";
import type { StudentDocument } from "@/lib/users/types/student";

const REQUEST_ENCODER_ROLES = ["Document Request Encoder", "Document Request Officer", "Staff"];

function getRequestedFile(request: DocumentRequest): StudentDocument | null {
  return getDocumentsByStudentId(request.studentId)
    .filter((document) =>
      document.documentType.trim().toLowerCase() === request.documentType.trim().toLowerCase() &&
      Boolean(document.fileData)
    )
    .sort((a, b) =>
      new Date(b.encodedAt || b.dateSubmitted).getTime() -
      new Date(a.encodedAt || a.dateSubmitted).getTime()
    )[0] ?? null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export default function RequestProcessing() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [role, setRole] = useState("");
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => setRequests(getDocumentRequests()), []);

  useEffect(() => {
    const user = getCurrentUser();
    setRole(user?.role ?? "");
    setIsReady(true);
    refresh();
    setSidebarOpen(window.innerWidth >= 1024);

    const updateSidebar = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", updateSidebar);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(DOCUMENT_REQUESTS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("resize", updateSidebar);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(DOCUMENT_REQUESTS_UPDATED_EVENT, refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (isReady && !REQUEST_ENCODER_ROLES.includes(role)) router.replace("/dashboard");
  }, [isReady, role, router]);

  const approvedRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (request.status !== "Approved") return false;
      return !normalizedQuery || [
        request.studentName,
        request.studentId,
        request.documentType,
        request.reason,
        request.purpose,
        request.requestedBy,
      ].join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [requests, query]);

  const handleRelease = (request: DocumentRequest) => {
    const user = getCurrentUser();
    if (!user || !REQUEST_ENCODER_ROLES.includes(user.role)) return;

    const file = getRequestedFile(request);
    if (!file?.fileData) {
      setFeedback("The uploaded document file could not be found, so it cannot be released.");
      return;
    }

    const released = releaseDocumentRequest(
      request.id,
      user.fullName || user.username || "Request Encoder",
      file.id,
    );
    if (!released) {
      setFeedback("This request was already released or is no longer approved.");
      refresh();
      return;
    }

    logActivity({
      action: "Document Request Released",
      resourceType: "Document",
      resource: `${request.documentType} · ${request.studentName} (${request.studentId})`,
      details: `Released the approved ${request.documentType} request to ${request.requestedBy}.`,
    });
    setFeedback(`${request.documentType} for ${request.studentName} is now available to the requester.`);
    refresh();
  };

  if (!isReady || !REQUEST_ENCODER_ROLES.includes(role)) {
    return <div className="min-h-screen bg-[#f2f6fc]" aria-label="Loading approved requests" />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fc] text-slate-800">
      <RequesterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`min-h-screen w-full transition-[margin] duration-300 ${sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full"}`}>
        <Topbar title="Approved Requests" onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6">
          <section className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#102c79] to-[#1b4db5] p-6 text-white shadow-sm">
            <div className="rounded-xl bg-white/10 p-3"><ClipboardCheck size={27} /></div>
            <div>
              <h1 className="text-xl font-semibold">Approved Requests</h1>
              <p className="mt-1 text-sm text-blue-100">Find the requested uploaded credential and release it to the requester.</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-sm font-semibold">Waiting for document release</h2>
                <p className="mt-1 text-xs text-slate-500">{approvedRequests.length} approved {approvedRequests.length === 1 ? "request" : "requests"}</p>
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-300 px-3 sm:max-w-xs">
                <Search size={15} className="text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 text-sm outline-none" placeholder="Search requests" aria-label="Search approved requests" />
              </label>
            </div>

            {feedback && <p role="status" className="mx-4 mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{feedback}</p>}
            {approvedRequests.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <ClipboardCheck className="mx-auto text-slate-300" size={30} />
                <p className="mt-3 text-sm font-medium text-slate-700">{query ? "No matching approved requests" : "No approved requests waiting"}</p>
                <p className="mt-1 text-xs text-slate-500">Requests approved by the administrator will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {approvedRequests.map((request) => {
                  const file = getRequestedFile(request);
                  return (
                    <article key={request.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-800">{request.studentName}</h2>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Approved</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{request.studentId} · {COURSE_LABELS[request.course ?? ""] ?? request.course ?? "Course not set"} · {request.yearLevel ?? "Year level not set"}</p>
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <p><span className="text-slate-500">Document: </span><span className="font-medium">{request.documentType}</span></p>
                          <p><span className="text-slate-500">Requester: </span>{request.requestedBy}{request.requestedByEmail ? ` · ${request.requestedByEmail}` : ""}</p>
                          <p><span className="text-slate-500">Reason: </span>{request.reason || request.purpose}</p>
                          <p><span className="text-slate-500">Approved: </span>{formatDate(request.reviewedAt || request.dateCreated)}</p>
                        </div>
                        {file ? (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"><FileText size={14} />{file.fileName}</p>
                        ) : (
                          <p role="alert" className="mt-2 text-xs text-amber-700">The uploaded file for this document was not found. Check the student record before releasing it.</p>
                        )}
                        {request.reason && request.purpose && <p className="mt-1 text-xs text-slate-500">Remarks: {request.purpose}</p>}
                      </div>
                      <button
                        type="button"
                        disabled={!file?.fileData}
                        onClick={() => handleRelease(request)}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check size={16} /> Release to requester
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
