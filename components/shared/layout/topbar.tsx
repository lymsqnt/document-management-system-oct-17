"use client";

import { ChevronDown, LogOut, Menu, UserRoundPen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import { logout } from "@/lib/shared/services/auth";
import type { UserProfile } from "@/lib/shared/types/account";

type TopbarProps = {
  title: string;
  onToggleSidebar: () => void;
};

export default function Topbar({
  title,
  onToggleSidebar,
}: TopbarProps) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setProfileMenuOpen(false);
    router.replace("/login");
    router.refresh();
  };

  const initials =
    currentUser?.fullName
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-5 lg:px-6">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="rounded-md p-2 text-[#0B4FB3] transition-colors duration-200 hover:bg-blue-50 active:scale-95"
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <h1 className="text-xl font-bold text-[#102F68]">
          {title}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center">
        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            aria-label="Open account actions"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:px-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-semibold text-white">
              {currentUser?.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.fullName || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </span>

            <span className="hidden min-w-0 text-left sm:block">
              <span className="block max-w-[150px] truncate text-xs font-semibold text-[#102F68]">
                {currentUser?.fullName || "User"}
              </span>
              <span className="block text-[10px] text-slate-500">
                {currentUser?.role || "Administrator"}
              </span>
            </span>
            <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {profileMenuOpen && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-800">{currentUser?.fullName || "User"}</p>
                <p className="truncate text-xs text-slate-500">{currentUser?.email || ""}</p>
                <p className="mt-1 text-[11px] text-blue-700">{currentUser?.role || "Administrator"}</p>
              </div>
              {currentUser?.role !== "Administrator" && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50"
                >
                  <UserRoundPen size={16} className="text-slate-500" />
                  My Profile
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
