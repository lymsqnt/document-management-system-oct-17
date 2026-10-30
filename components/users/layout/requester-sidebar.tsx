"use client";

import { ClipboardCheck, ClipboardList, LayoutDashboard, UserRound } from "lucide-react";
import SidebarShell, { type SidebarGroup } from "@/components/users/layout/sidebar-shell";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const requesterGroups: SidebarGroup[] = [
  {
    label: "Main",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Requests",
    items: [
      { label: "Create Request", href: "/request", icon: ClipboardList },
      { label: "Approved Requests", href: "/request-processing", icon: ClipboardCheck },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Profile", href: "/profile", icon: UserRound }],
  },
];

export default function RequesterSidebar({ isOpen, onClose }: SidebarProps) {
  return <SidebarShell isOpen={isOpen} onClose={onClose} groups={requesterGroups} />;
}
