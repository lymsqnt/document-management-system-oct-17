import type { StudentApprovalStatus, StudentDocument } from "@/lib/users/types/student";

export const STUDENT_DOCUMENTS_KEY = "demo-student-documents";

/** Fired on window whenever student documents change in this tab. */
export const STUDENT_DOCUMENTS_UPDATED_EVENT = "student-documents-updated";

function normalizeStudentId(studentId: string | undefined): string {
  return studentId?.trim().toUpperCase() ?? "";
}

export function getStudentDocuments(): StudentDocument[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STUDENT_DOCUMENTS_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as StudentDocument[]) : [];
  } catch {
    return [];
  }
}

/** Throws if the browser storage is full (e.g. the file is too large). */
export function saveStudentDocuments(documents: StudentDocument[]): void {
  localStorage.setItem(STUDENT_DOCUMENTS_KEY, JSON.stringify(documents));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STUDENT_DOCUMENTS_UPDATED_EVENT));
  }
}

export function getDocumentsByStudentId(studentId: string): StudentDocument[] {
  const id = normalizeStudentId(studentId);

  return getStudentDocuments().filter(
    (document) => normalizeStudentId(document.studentId) === id
      && (document.approvalStatus === undefined || document.approvalStatus === "approved")
  );
}

/** Updates the approval decision for every credential belonging to a student. */
export function reviewStudentEncoding(
  studentId: string,
  status: Extract<StudentApprovalStatus, "approved" | "rejected">,
  reviewedBy: string,
): boolean {
  const id = normalizeStudentId(studentId);
  const documents = getStudentDocuments();
  let foundPending = false;
  const reviewedAt = new Date().toISOString();
  const updated = documents.map((document) => {
    if (normalizeStudentId(document.studentId) !== id || document.approvalStatus !== "pending") {
      return document;
    }
    foundPending = true;
    return { ...document, approvalStatus: status, approvalReviewedAt: reviewedAt, approvalReviewedBy: reviewedBy };
  });
  if (!foundPending) return false;
  saveStudentDocuments(updated);
  return true;
}

export function addStudentDocument(document: StudentDocument): void {
  saveStudentDocuments([...getStudentDocuments(), document]);
}

/** Adds multiple credentials for one student in a single storage update. */
export function addStudentDocuments(documents: StudentDocument[]): void {
  const pendingDocuments = documents.map((document) => ({
    ...document,
    approvalStatus: "pending" as const,
    approvalReviewedAt: undefined,
    approvalReviewedBy: undefined,
  }));
  const resubmittedIds = new Set(pendingDocuments.map((document) => normalizeStudentId(document.studentId)));
  const existing = getStudentDocuments().filter((document) =>
    !(document.approvalStatus === "rejected" && resubmittedIds.has(normalizeStudentId(document.studentId)))
  );
  saveStudentDocuments([...existing, ...pendingDocuments]);
}

/** Replaces documents with the same id and adds the ones that are new. */
export function upsertStudentDocuments(documents: StudentDocument[]): void {
  const all = getStudentDocuments().map(
    (existing) =>
      documents.find((document) => document.id === existing.id) ?? existing
  );

  documents.forEach((document) => {
    if (!all.some((existing) => existing.id === document.id)) {
      all.push(document);
    }
  });

  saveStudentDocuments(all);
}

export function deleteStudentDocument(documentId: string): void {
  saveStudentDocuments(
    getStudentDocuments().filter((document) => document.id !== documentId)
  );
}

/** Deletes every document of a student. Returns how many were removed. */
export function deleteStudent(studentId: string): number {
  const id = normalizeStudentId(studentId);
  const documents = getStudentDocuments();
  const remaining = documents.filter(
    (document) => normalizeStudentId(document.studentId) !== id
  );

  saveStudentDocuments(remaining);

  return documents.length - remaining.length;
}
