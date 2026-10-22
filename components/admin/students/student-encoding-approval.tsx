"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, FileText, Search, UserRoundCheck, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout";
import Topbar from "@/components/shared/layout/topbar";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import { logActivity } from "@/lib/shared/storage/audit-logs";
import {
  getStudentDocuments,
  reviewStudentEncoding,
  STUDENT_DOCUMENTS_UPDATED_EVENT,
} from "@/lib/users/storage/student-documents";
import type { StudentDocument } from "@/lib/users/types/student";
import { COURSE_LABELS } from "@/lib/users/constants/student";

type StudentSubmission = { studentId: string; documents: StudentDocument[] };
type Filter = "Pending" | "Reviewed" | "All";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function getSubmissionTime(documents: StudentDocument[]) {
  return documents.map((document) => document.encodedAt || document.dateSubmitted || "")
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || "";
}

export default function StudentEncodingApproval() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [filter, setFilter] = useState<Filter>("Pending");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");

  const refresh = useCallback(() => setDocuments(getStudentDocuments()), []);

  useEffect(() => {
    const resize = () => setSidebarOpen(window.innerWidth >= 1024);
    refresh();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(STUDENT_DOCUMENTS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(STUDENT_DOCUMENTS_UPDATED_EVENT, refresh);
    };
  }, [refresh]);

  const submissions = useMemo(() => {
    const grouped = new Map<string, StudentDocument[]>();
    documents.forEach((document) => {
      const key = document.studentId.trim().toUpperCase();
      const group = grouped.get(key) ?? [];
      group.push(document);
      grouped.set(key, group);
    });
    return Array.from(grouped, ([studentId, studentDocuments]) => ({ studentId, documents: studentDocuments }))
      .sort((a, b) => new Date(getSubmissionTime(b.documents)).getTime() - new Date(getSubmissionTime(a.documents)).getTime());
  }, [documents]);

  const pendingCount = submissions.filter((submission) =>
    submission.documents.some((document) => document.approvalStatus === "pending")
  ).length;

  const visibleSubmissions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      const isPending = submission.documents.some((document) => document.approvalStatus === "pending");
      const matchesFilter = filter === "All" || (filter === "Pending" ? isPending : !isPending);
      const first = submission.documents[0];
      const matchesSearch = !search || [first?.studentName, submission.studentId, first?.course, first?.email]
        .join(" ").toLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [submissions, filter, query]);

  function review(submission: StudentSubmission, status: "approved" | "rejected") {
    const student = submission.documents[0];
    const admin = getCurrentUser();
    const reviewer = admin?.fullName || admin?.username || "Administrator";
    const updated = reviewStudentEncoding(submission.studentId, status, reviewer);
    setFeedback(updated
      ? `${student?.studentName || submission.studentId} was ${status}.`
      : "This student encoding was already reviewed.");
    if (updated) {
      logActivity({
        action: status === "approved" ? "Student Encoding Approved" : "Student Encoding Rejected",
        resourceType: "Student",
        resource: `${student?.studentName || "Student"} (${submission.studentId})`,
        details: `${reviewer} ${status} the student encoding with ${submission.documents.length} credential(s).`,
      });
    }
    refresh();
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fc] text-slate-800">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`min-h-screen w-full transition-[margin] duration-300 ${sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full"}`}>
        <Topbar title="Student Encoding Approval" onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-6">
          <section className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#102c79] to-[#1b4db5] p-6 text-white shadow-sm">
            <div className="rounded-xl bg-white/10 p-3"><UserRoundCheck size={28} /></div>
            <div>
              <h1 className="text-xl font-semibold">Student Encoding Approval</h1>
              <p className="mt-1 text-sm text-blue-100">Review a student’s information and all uploaded credentials together before adding them to the official student records.</p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Pending student encodings</p>
            <p className="mt-1 text-2xl font-semibold text-[#163b83]">{pendingCount}</p>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex flex-wrap gap-2" aria-label="Filter student encodings">
                {(["Pending", "Reviewed", "All"] as const).map((option) => (
                  <button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === option ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {option}{option === "Pending" ? ` (${pendingCount})` : ""}
                  </button>
                ))}
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-300 px-3 sm:max-w-xs">
                <Search size={15} className="text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 text-sm outline-none" placeholder="Search students" aria-label="Search student encodings" />
              </label>
            </div>

            {feedback && <p role="status" className="mx-4 mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{feedback}</p>}
            {visibleSubmissions.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <UserRoundCheck className="mx-auto text-slate-300" size={32} />
                <p className="mt-3 text-sm font-medium text-slate-700">{filter === "Pending" ? "No student encodings awaiting approval" : "No student encodings found"}</p>
                <p className="mt-1 text-xs text-slate-500">New student entries will appear here for review.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleSubmissions.map((submission) => {
                  const student = submission.documents[0];
                  const status = student?.approvalStatus ?? "approved";
                  const pending = submission.documents.some((document) => document.approvalStatus === "pending");
                  return (
                    <article key={submission.studentId} className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-slate-900">{student?.studentName || "Unnamed Student"}</h2>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${pending ? "bg-amber-50 text-amber-700" : status === "rejected" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                              {pending ? "Pending review" : status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{submission.studentId} · {student?.course ? COURSE_LABELS[student.course] ?? student.course : "—"}{student?.major && student.major !== "N/A" ? ` · ${student.major}` : ""} · {student?.yearLevel || "—"} · SY {student?.schoolYear || "—"}</p>
                          <p className="mt-1 text-xs text-slate-500">{student?.email || "—"} · Submitted {formatDate(getSubmissionTime(submission.documents))}</p>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {submission.documents.map((document) => (
                              <div key={document.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 p-3">
                                <FileText size={17} className="shrink-0 text-blue-600" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-slate-800">{document.documentType}</p>
                                  <p className="truncate text-[10px] text-slate-500">{document.fileName}</p>
                                </div>
                                {document.fileData && <a href={document.fileData} download={document.fileName} className="shrink-0 text-[10px] font-medium text-blue-700 hover:underline">Download</a>}
                              </div>
                            ))}
                          </div>
                        </div>
                        {pending && (
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => review(submission, "rejected")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50"><X size={15} /> Reject</button>
                            <button type="button" onClick={() => review(submission, "approved")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-700 px-3 text-xs font-medium text-white hover:bg-blue-800"><Check size={15} /> Approve</button>
                          </div>
                        )}
                      </div>
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
