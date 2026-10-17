import type { DocumentRequest } from "@/lib/types/request";

export const DOCUMENT_REQUESTS_KEY = "demo-document-requests";
export const DOCUMENT_REQUESTS_UPDATED_EVENT = "document-requests-updated";

export function getDocumentRequests(): DocumentRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(DOCUMENT_REQUESTS_KEY) || "[]"
    );
    if (!Array.isArray(value)) return [];

    return value.filter(
      (entry): entry is DocumentRequest =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.id === "string" &&
        typeof entry.studentId === "string" &&
        typeof entry.studentName === "string" &&
        typeof entry.documentType === "string" &&
        entry.status === "Pending Admin Review"
    );
  } catch {
    return [];
  }
}

export function saveDocumentRequest(request: DocumentRequest): void {
  const requests = getDocumentRequests();
  localStorage.setItem(
    DOCUMENT_REQUESTS_KEY,
    JSON.stringify([request, ...requests])
  );
  window.dispatchEvent(new Event(DOCUMENT_REQUESTS_UPDATED_EVENT));
}
