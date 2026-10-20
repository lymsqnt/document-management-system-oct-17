"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ClipboardList, FileText, Plus, Search, Send } from "lucide-react";

import Sidebar from "@/components/users/layout/sidebar";
import Topbar from "@/components/shared/layout/topbar";
import { COURSE_LABELS, DOCUMENT_TYPES, YEAR_LEVELS } from "@/lib/users/constants/student";
import {
  DOCUMENT_REQUESTS_UPDATED_EVENT,
  getDocumentRequests,
  saveDocumentRequest,
} from "@/lib/shared/storage/requests";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import {
  getStudentDocuments,
  STUDENT_DOCUMENTS_UPDATED_EVENT,
} from "@/lib/users/storage/student-documents";
import { buildStudentSummaries } from "@/lib/users/services/students";
import type { StudentSummary } from "@/lib/users/types/student";
import type { DocumentRequest } from "@/lib/shared/types/request";

type RequestForm = Pick<
  DocumentRequest,
  "studentId" | "studentName" | "course" | "yearLevel" | "documentType" | "purpose"
>;

const EMPTY_FORM: RequestForm = {
  studentId: "",
  studentName: "",
  course: "",
  yearLevel: "",
  documentType: "",
  purpose: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export default function RequestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRequests = () => setRequests(getDocumentRequests());
    const loadStudents = () => setStudents(buildStudentSummaries(getStudentDocuments()));
    const updateSidebar = () => setSidebarOpen(window.innerWidth >= 1024);

    loadRequests();
    loadStudents();
    const currentUser = getCurrentUser();
    setCurrentUserEmail(currentUser?.email?.toLowerCase() ?? "");
    setCurrentUserName(currentUser?.fullName || currentUser?.username || "");
    updateSidebar();
    window.addEventListener("storage", loadRequests);
    window.addEventListener(DOCUMENT_REQUESTS_UPDATED_EVENT, loadRequests);
    window.addEventListener("focus", loadRequests);
    window.addEventListener("focus", loadStudents);
    window.addEventListener(STUDENT_DOCUMENTS_UPDATED_EVENT, loadStudents);
    window.addEventListener("storage", loadStudents);
    window.addEventListener("resize", updateSidebar);

    return () => {
      window.removeEventListener("storage", loadRequests);
      window.removeEventListener(DOCUMENT_REQUESTS_UPDATED_EVENT, loadRequests);
      window.removeEventListener("focus", loadRequests);
      window.removeEventListener("focus", loadStudents);
      window.removeEventListener(STUDENT_DOCUMENTS_UPDATED_EVENT, loadStudents);
      window.removeEventListener("storage", loadStudents);
      window.removeEventListener("resize", updateSidebar);
    };
  }, []);

  const myRequests = useMemo(() => requests.filter((request) => {
    if (request.requestedByEmail && currentUserEmail) {
      return request.requestedByEmail.toLowerCase() === currentUserEmail;
    }
    return Boolean(currentUserName && request.requestedBy === currentUserName);
  }), [requests, currentUserEmail, currentUserName]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return myRequests;
    return myRequests.filter((request) =>
      [
        request.studentName,
        request.studentId,
        request.course,
        request.yearLevel,
        request.documentType,
        request.purpose,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [myRequests, search]);

  const updateField = (field: keyof RequestForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const selectedStudent = students.find(
    (student) => student.studentId.trim().toUpperCase() === form.studentId.trim().toUpperCase()
  );
  const handleStudentIdChange = (studentId: string) => {
    const normalizedId = studentId.trim().toUpperCase();
    const student = students.find(
      (item) => item.studentId.trim().toUpperCase() === normalizedId
    );
    setForm((current) => ({
      ...current,
      studentId: studentId.toUpperCase(),
      ...(student
        ? {
            studentName: student.studentName,
            course: student.course === "—" ? current.course : student.course,
            yearLevel: student.yearLevel === "—" ? current.yearLevel : student.yearLevel,
            documentType: "",
          }
        : {}),
    }));
    setError("");
    setMessage("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const studentId = form.studentId.trim().toUpperCase();
    const studentName = form.studentName.trim();
    const purpose = form.purpose.trim();

    if (!studentId || !studentName || !form.course || !form.yearLevel || !form.documentType || !purpose) {
      setError("Complete all fields before sending the request.");
      return;
    }

    if (!selectedStudent) {
      setError("Student ID was not found in the Student List. Add the student and their documents before sending a request.");
      return;
    }

    const normalizedName = studentName.trim().replace(/\s+/g, " ").toLowerCase();
    const savedName = selectedStudent.studentName.trim().replace(/\s+/g, " ").toLowerCase();
    const normalizedCourse = form.course.trim().toUpperCase();
    const savedCourse = selectedStudent.course.trim().toUpperCase();
    const normalizedYearLevel = form.yearLevel.trim().toLowerCase();
    const savedYearLevel = selectedStudent.yearLevel.trim().toLowerCase();

    if (normalizedName !== savedName || normalizedCourse !== savedCourse || normalizedYearLevel !== savedYearLevel) {
      setError("Student name, course, and year level must match the Student List record for this ID.");
      return;
    }

    if (!DOCUMENT_TYPES.includes(form.documentType)) {
      setError("Select a valid document type.");
      return;
    }

    if (!selectedStudent.submittedTypes.includes(form.documentType)) {
      setError(
        `${form.documentType} has not been submitted for this student. Upload it on the Documents page before sending this request.`
      );
      return;
    }

    const staff = getCurrentUser();
    const request: DocumentRequest = {
      id: crypto.randomUUID(),
      studentId,
      studentName,
      course: form.course,
      yearLevel: form.yearLevel,
      documentType: form.documentType,
      purpose,
      status: "Pending Admin Review",
      dateCreated: new Date().toISOString(),
      requestedBy: staff?.fullName || staff?.username || "Staff",
      requestedByEmail: staff?.email,
    };

    saveDocumentRequest(request);
    setRequests(getDocumentRequests());
    setForm(EMPTY_FORM);
    setMessage("Request submitted. It is now pending admin approval.");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f1f3fc] text-slate-800">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`min-h-screen w-full transition-[margin] duration-300 ${
          sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full"
        }`}
      >
        <Topbar
          title="Document Requests"
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-5 lg:p-6">
          <section className="rounded-xl bg-gradient-to-r from-blue-950 to-blue-700 p-5 text-white shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/15 p-2.5"><ClipboardList size={23} /></div>
              <div>
                <h1 className="text-lg font-semibold">Student document requests</h1>
                <p className="mt-1 max-w-3xl text-sm text-blue-100">Submit a student document request and track its approval status.</p>
              </div>
            </div>
          </section>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Plus size={18} /></div>
                <div>
                  <h2 className="text-sm font-semibold">Create a request</h2>
                  <p className="text-xs text-slate-500">Enter the student and document you need.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium">Student ID</span>
                  <input
                    value={form.studentId}
                    onChange={(event) => handleStudentIdChange(event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. CS-23-033"
                    maxLength={9}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium">Student name</span>
                  <input
                    value={form.studentName}
                    onChange={(event) => updateField("studentName", event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Full name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium">Course</span>
                  <select
                    value={form.course}
                    onChange={(event) => updateField("course", event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Select a course</option>
                    {Object.entries(COURSE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium">Year level</span>
                  <select
                    value={form.yearLevel}
                    onChange={(event) => updateField("yearLevel", event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Select a year level</option>
                    {YEAR_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium">Document needed</span>
                  <select
                    value={form.documentType}
                    onChange={(event) => updateField("documentType", event.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Select a document</option>
                    {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  {selectedStudent && <span className="mt-1 block text-[10px] text-slate-500">Student record found · {selectedStudent.submittedCount}/{selectedStudent.requiredCount} documents on file.</span>}
                  {selectedStudent && form.documentType && !selectedStudent.submittedTypes.includes(form.documentType) && (
                    <span role="alert" className="mt-1 block text-[10px] text-amber-700">
                      This document has not been submitted for the student. Upload it on the Documents page before sending the request.
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium">Purpose / remarks</span>
                  <textarea
                    value={form.purpose}
                    onChange={(event) => updateField("purpose", event.target.value)}
                    className="min-h-20 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Reason for the request"
                    required
                  />
                </label>

                {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
                {message && <p role="status" className="text-xs text-emerald-700">{message}</p>}

                <button
                  type="submit"
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} /> Submit request
                </button>
              </form>
            </section>

            <section className="min-w-0 rounded-xl bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                <div>
                  <h2 className="text-sm font-semibold">My submitted requests</h2>
                  <p className="mt-1 text-xs text-slate-500">Track the status of requests you submitted.</p>
                </div>
                <label className="flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-3 sm:w-64">
                  <Search size={15} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="min-w-0 flex-1 text-xs outline-none"
                    placeholder="Search requests"
                    aria-label="Search requests"
                  />
                </label>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                  <div className="rounded-full bg-slate-100 p-3 text-slate-500"><FileText size={22} /></div>
                  <p className="mt-3 text-sm font-medium">{search ? "No matching requests" : "No requests yet"}</p>
                  <p className="mt-1 text-xs text-slate-500">Your requests and their admin approval status will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredRequests.map((request) => (
                    <article key={request.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">{request.studentName}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{request.studentId} · {COURSE_LABELS[request.course ?? ""] ?? request.course ?? "Course not set"} · {request.yearLevel ?? "Year level not set"}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${request.status === "Approved" ? "bg-emerald-50 text-emerald-700" : request.status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${request.status === "Approved" ? "bg-emerald-500" : request.status === "Rejected" ? "bg-rose-500" : "bg-amber-500"}`} />
                          {request.status}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <p><span className="text-slate-500">Document: </span><span className="font-medium">{request.documentType}</span></p>
                        <p><span className="text-slate-500">Sent: </span>{formatDate(request.dateCreated)}</p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600">{request.purpose}</p>
                      <p className="mt-2 text-[11px] text-slate-400">Submitted by {request.requestedBy}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
