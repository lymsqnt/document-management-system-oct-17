"use client";

import { Bell, Check, CircleCheck, CircleX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import {
  getNotificationsForUser,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/shared/storage/notifications";
import type { StudentEncodingNotification } from "@/lib/shared/types/notification";

const ENCODER_ROLES = ["Student Records Encoder", "Registrar"];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export default function ReviewNotificationBell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState<StudentEncodingNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && ENCODER_ROLES.includes(user.role)) setEmail(user.email.trim().toLowerCase());
  }, []);

  useEffect(() => {
    if (!email) return;
    const refresh = () => setNotifications(getNotificationsForUser(email));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    };
  }, [email]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (!email) return null;

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const openNotification = (id: string) => {
    markNotificationRead(id);
    setNotifications(getNotificationsForUser(email));
  };

  return (
    <div ref={containerRef} className="relative mr-2">
      <button
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <section aria-label="Student encoding review notifications" className="absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Notifications</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Student encoding review updates</p>
            </div>
            {unreadCount > 0 && <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{unreadCount} new</span>}
          </div>
          <div className="max-h-[min(65vh,28rem)] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">No review notifications yet.</p>
            ) : notifications.map((notification) => {
              const approved = notification.status === "approved";
              const StatusIcon = approved ? CircleCheck : CircleX;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification.id)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${notification.readAt ? "bg-white" : "bg-blue-50/60"}`}
                >
                  <StatusIcon size={18} className={`mt-0.5 shrink-0 ${approved ? "text-emerald-600" : "text-rose-600"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">Student encoding {approved ? "approved" : "rejected"}</span>
                      {!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
                    </span>
                    <span className="mt-1 block text-xs text-slate-600">{notification.studentName} ({notification.studentId})</span>
                    <span className="mt-1 block text-[10px] text-slate-500">Reviewed by {notification.reviewedBy} · {formatDate(notification.createdAt)}</span>
                  </span>
                  {notification.readAt && <Check size={14} className="mt-0.5 shrink-0 text-slate-400" aria-label="Read" />}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
