import { getStudentDocuments } from "@/lib/users/storage/student-documents";

/** Shared reader for report and request views that summarize student uploads. */
export function loadStoredStudentDocuments() {
  return getStudentDocuments();
}
