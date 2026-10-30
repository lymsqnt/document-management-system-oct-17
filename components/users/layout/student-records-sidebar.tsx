"use client";

import { FileText, LayoutDashboard, UserRound, Users } from "lucide-react";
import SidebarShell, { type SidebarGroup } from "@/components/users/layout/sidebar-shell";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const studentRecordsGroups: SidebarGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "Student List", href: "/student-list", icon: Users },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Profile", href: "/profile", icon: UserRound }],
  },
];

export default function StudentRecordsSidebar({ isOpen, onClose }: SidebarProps) {
  return <SidebarShell isOpen={isOpen} onClose={onClose} groups={studentRecordsGroups} />;
}
