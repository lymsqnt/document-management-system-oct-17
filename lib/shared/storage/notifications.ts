import type { StudentEncodingNotification } from "@/lib/shared/types/notification";

const NOTIFICATIONS_KEY = "demoNotifications";
export const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated";

function getAllNotifications(): StudentEncodingNotification[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StudentEncodingNotification =>
      typeof item === "object" && item !== null &&
      typeof (item as StudentEncodingNotification).id === "string" &&
      typeof (item as StudentEncodingNotification).recipientEmail === "string" &&
      ["approved", "rejected"].includes((item as StudentEncodingNotification).status) &&
      typeof (item as StudentEncodingNotification).studentName === "string" &&
      typeof (item as StudentEncodingNotification).studentId === "string" &&
      typeof (item as StudentEncodingNotification).reviewedBy === "string" &&
      typeof (item as StudentEncodingNotification).createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function getNotificationsForUser(email: string): StudentEncodingNotification[] {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return [];
  return getAllNotifications()
    .filter((notification) => notification.recipientEmail === normalizedEmail)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function notifyStudentEncodingReviewed(
  recipientEmail: string,
  result: Pick<StudentEncodingNotification, "status" | "studentName" | "studentId" | "reviewedBy">,
): void {
  if (typeof window === "undefined" || !recipientEmail.trim()) return;

  const notification: StudentEncodingNotification = {
    id: crypto.randomUUID(),
    recipientEmail: recipientEmail.trim().toLowerCase(),
    ...result,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([notification, ...getAllNotifications()].slice(0, 500)));
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

export function markNotificationRead(id: string): void {
  const notifications = getAllNotifications();
  const index = notifications.findIndex((notification) => notification.id === id);
  if (index === -1 || notifications[index].readAt) return;
  notifications[index] = { ...notifications[index], readAt: new Date().toISOString() };
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}
