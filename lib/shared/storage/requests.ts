import type { DocumentRequest } from "@/lib/shared/types/request";

export const DOCUMENT_REQUESTS_KEY = "demo-document-requests";
export const DOCUMENT_REQUESTS_UPDATED_EVENT = "document-requests-updated";

export function getDocumentRequests(): DocumentRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(DOCUMENT_REQUESTS_KEY) || "[]"
    );
    if (!Array.isArray(value)) return [];

    return value.filter((entry): entry is DocumentRequest => {
      if (typeof entry !== "object" || entry === null) return false;

      const request = entry as Partial<DocumentRequest>;
      return (
        typeof request.id === "string" &&
        typeof request.studentId === "string" &&
        typeof request.studentName === "string" &&
        typeof request.documentType === "string" &&
        ["Pending Admin Review", "Approved", "Rejected"].includes(
          request.status ?? ""
        )
      );
    });
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

export function reviewDocumentRequest(
  id: string,
  status: Extract<DocumentRequest["status"], "Approved" | "Rejected">,
  reviewedBy: string
): boolean {
  const requests = getDocumentRequests();
  const requestIndex = requests.findIndex((request) => request.id === id);
  if (requestIndex === -1 || requests[requestIndex].status !== "Pending Admin Review") {
    return false;
  }

  requests[requestIndex] = {
    ...requests[requestIndex],
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  localStorage.setItem(DOCUMENT_REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event(DOCUMENT_REQUESTS_UPDATED_EVENT));
  return true;
}
