"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileText, Plus, Search, Send } from "lucide-react";

import RequesterSidebar from "@/components/users/layout/requester-sidebar";
import Topbar from "@/components/shared/layout/topbar";
import { COURSE_LABELS, DOCUMENT_TYPES, YEAR_LEVELS } from "@/lib/users/constants/student";
import {
  DOCUMENT_REQUESTS_UPDATED_EVENT,
  getDocumentRequests,
  saveDocumentRequest,
} from "@/lib/shared/storage/requests";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import { logActivity } from "@/lib/shared/storage/audit-logs";
import {
  getDocumentsByStudentId,
  getStudentDocuments,
  STUDENT_DOCUMENTS_UPDATED_EVENT,
} from "@/lib/users/storage/student-documents";
import { buildStudentSummaries } from "@/lib/users/services/students";
import type { StudentSummary, StudentDocument } from "@/lib/users/types/student";
import type { DocumentRequest } from "@/lib/shared/types/request";

type RequestForm = Pick<DocumentRequest, "studentId" | "studentName" | "course" | "yearLevel" | "documentType" | "purpose"> & { reason: string };

const REQUEST_ENCODER_ROLES = ["Document Request Encoder", "Document Request Officer", "Staff"];

const EMPTY_FORM: RequestForm = {
  studentId: "",
  studentName: "",
  course: "",
  yearLevel: "",
  documentType: "",
  reason: "",
  purpose: "",
};

const REQUEST_REASONS = [
  "Employment requirement",
  "School transfer or further studies",
  "Scholarship application",
  "Government or agency requirement",
  "Personal copy",
  "Other",
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function getRequestedFile(request: DocumentRequest): StudentDocument | null {
  const matchingDocuments = getDocumentsByStudentId(request.studentId)
    .filter((document) =>
      document.documentType.trim().toLowerCase() === request.documentType.trim().toLowerCase() &&
      Boolean(document.fileData)
    );

  if (request.releasedDocumentId) {
    return matchingDocuments.find((document) => document.id === request.releasedDocumentId) ?? null;
  }

  return matchingDocuments
    .sort((a, b) =>
      new Date(b.encodedAt || b.dateSubmitted).getTime() -
      new Date(a.encodedAt || a.dateSubmitted).getTime()
    )[0] ?? null;
}

function RequestFileActions({ request }: { request: DocumentRequest }) {
  const file = getRequestedFile(request);
  if (!file?.fileData) {
    return <p role="alert" className="mt-3 text-xs text-amber-700">The approved file is currently unavailable. Contact the Request Encoder.</p>;
  }

  const downloadFile = () => {
    logActivity({
      action: "Document Downloaded",
      resourceType: "Document",
      resource: `${request.documentType} · ${request.studentName} (${request.studentId})`,
      details: `Downloaded ${file.fileName || file.documentType} from an approved document request.`,
    });
    const link = window.document.createElement("a");
    link.href = file.fileData!;
    link.download = file.fileName || file.documentType;
    link.click();
  };
  const viewFile = () => {
    logActivity({
      action: "Document Viewed",
      resourceType: "Document",
      resource: `${request.documentType} · ${request.studentName} (${request.studentId})`,
      details: `Viewed ${file.fileName || file.documentType} from an approved document request.`,
    });
    window.open(file.fileData, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
      <span className="mr-auto text-xs font-medium text-emerald-800">{file.fileName || file.documentType} is ready</span>
      <button type="button" onClick={viewFile} className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">View</button>
      <button type="button" onClick={downloadFile} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"><FileText size={13} />Download</button>
    </div>
  );
}

export default function RequestPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentResults, setShowStudentResults] = useState(false);
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
    if (!currentUser) {
      router.replace("/login");
    } else if (!REQUEST_ENCODER_ROLES.includes(currentUser.role)) {
      router.replace(currentUser.role === "Administrator" ? "/admin" : "/dashboard");
    } else {
      setAccessChecked(true);
    }
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
  }, [router]);

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
        request.reason,
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
  const matchingStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return [];
    return students
      .filter((student) => `${student.studentName} ${student.studentId}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [students, studentSearch]);

  const handleStudentSearchChange = (value: string) => {
    setStudentSearch(value);
    setShowStudentResults(true);
    setForm((current) => ({
      ...current,
      studentId: "",
      studentName: "",
      course: "",
      yearLevel: "",
      documentType: "",
    }));
    setError("");
    setMessage("");
  };

  const handleSelectStudent = (student: StudentSummary) => {
    setForm((current) => ({
      ...current,
      studentId: student.studentId,
      studentName: student.studentName,
      course: student.course,
      yearLevel: student.yearLevel,
      documentType: "",
    }));
    setStudentSearch(`${student.studentName} (${student.studentId})`);
    setShowStudentResults(false);
    setError("");
    setMessage("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const studentId = form.studentId.trim().toUpperCase();
    const studentName = form.studentName.trim();
    const reason = form.reason.trim();
    const purpose = form.purpose.trim();

    if (!studentId || !studentName || !form.course || !form.yearLevel || !form.documentType || !reason || (reason === "Other" && !purpose)) {
      setError("Complete the required fields and select a reason for the request.");
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
    if (!staff || !REQUEST_ENCODER_ROLES.includes(staff.role)) {
      router.replace(staff?.role === "Administrator" ? "/admin" : "/login");
      return;
    }
    const request: DocumentRequest = {
      id: crypto.randomUUID(),
      studentId,
      studentName,
      course: form.course,
      yearLevel: form.yearLevel,
      documentType: form.documentType,
      reason,
      purpose,
      status: "Pending Admin Review",
      dateCreated: new Date().toISOString(),
      requestedBy: staff?.fullName || staff?.username || "Staff",
      requestedByEmail: staff?.email,
    };

    saveDocumentRequest(request);
    setRequests(getDocumentRequests());
    setForm(EMPTY_FORM);
    setStudentSearch("");
    setShowStudentResults(false);
    setMessage("Request submitted. It is now pending admin approval.");
  };

  if (!accessChecked) {
    return <div className="min-h-screen bg-[#f1f3fc]" aria-label="Checking request access" />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f1f3fc] text-slate-800">
      <RequesterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-20 xl:self-start">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Plus size={18} /></div>
                <div>
                  <h2 className="text-sm font-semibold">Create a request</h2>
                  <p className="text-xs text-slate-500">Enter the student and document you need.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="relative">
                  <label htmlFor="student-search" className="mb-1 block text-xs font-medium">Find student by name or ID</label>
                  <input
                    id="student-search"
                    value={studentSearch}
                    onChange={(event) => handleStudentSearchChange(event.target.value)}
                    onFocus={() => setShowStudentResults(true)}
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Search student name or ID"
                    autoComplete="off"
                  />
                  {showStudentResults && studentSearch.trim() && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {matchingStudents.length ? matchingStudents.map((student) => (
                        <button
                          key={student.studentId}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="block w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50"
                        >
                          <span className="block text-xs font-semibold text-slate-800">{student.studentName}</span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">{student.studentId} · {COURSE_LABELS[student.course] ?? student.course} · {student.yearLevel}</span>
                        </button>
                      )) : (
                        <p className="px-3 py-3 text-xs text-slate-500">Student not found. Ask the Student Records Encoder to add the student record first.</p>
                      )}
                    </div>
                  )}
                </div>
                {selectedStudent && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{selectedStudent.studentName}</p>
                      <p className="mt-1 text-[11px] text-slate-600">{selectedStudent.studentId} · {COURSE_LABELS[selectedStudent.course] ?? selectedStudent.course} · {selectedStudent.yearLevel}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{selectedStudent.submittedCount}/{selectedStudent.requiredCount} required documents on file</p>
                    </div>
                    <button type="button" onClick={() => handleStudentSearchChange("")} className="shrink-0 text-xs font-medium text-blue-700 hover:underline">Change</button>
                  </div>
                )}
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
                  <span className="mb-1 block text-xs font-medium">Reason for request</span>
                  <select
                    value={form.reason}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, reason: event.target.value, purpose: "" }));
                      setError("");
                      setMessage("");
                    }}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Select a reason</option>
                    {REQUEST_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium">{form.reason === "Other" ? "Specify reason" : "Additional remarks (optional)"}</span>
                  <textarea
                    value={form.purpose}
                    onChange={(event) => updateField("purpose", event.target.value)}
                    className="min-h-20 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder={form.reason === "Other" ? "Explain the reason for the request" : "Add any helpful details"}
                    required={form.reason === "Other"}
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

            <section className="min-w-0 rounded-xl bg-white shadow-sm xl:flex xl:max-h-[70vh] xl:flex-col">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
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
                <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
                  <div className="rounded-full bg-slate-100 p-3 text-slate-500"><FileText size={22} /></div>
                  <p className="mt-3 text-sm font-medium">{search ? "No matching requests" : "No requests yet"}</p>
                  <p className="mt-1 text-xs text-slate-500">Your requests and their admin approval status will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
                  {filteredRequests.map((request) => (
                    <article key={request.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">{request.studentName}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{request.studentId} · {COURSE_LABELS[request.course ?? ""] ?? request.course ?? "Course not set"} · {request.yearLevel ?? "Year level not set"}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${(request.status === "Approved" || request.status === "Ready for Download") ? "bg-emerald-50 text-emerald-700" : request.status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${(request.status === "Approved" || request.status === "Ready for Download") ? "bg-emerald-500" : request.status === "Rejected" ? "bg-rose-500" : "bg-amber-500"}`} />
                          {request.status}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <p><span className="text-slate-500">Document: </span><span className="font-medium">{request.documentType}</span></p>
                        <p><span className="text-slate-500">Sent: </span>{formatDate(request.dateCreated)}</p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600"><span className="font-medium">Reason: </span>{request.reason || request.purpose}</p>{request.reason && request.purpose && <p className="mt-1 text-xs leading-5 text-slate-500"><span className="font-medium">{request.reason === "Other" ? "Details: " : "Remarks: "}</span>{request.purpose}</p>}
                      <p className="mt-2 text-[11px] text-slate-400">Submitted by {request.requestedBy}</p>
                      {request.status === "Ready for Download" && <RequestFileActions request={request} />}
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
