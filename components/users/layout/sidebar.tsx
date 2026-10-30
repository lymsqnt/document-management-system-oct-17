"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import RequesterSidebar from "@/components/users/layout/requester-sidebar";
import StudentRecordsSidebar from "@/components/users/layout/student-records-sidebar";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const REQUESTER_ROLES = ["Document Request Encoder", "Document Request Officer", "Staff"];
const STUDENT_RECORDS_ROLES = ["Student Records Encoder", "Registrar"];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "Administrator") {
      router.replace("/admin");
      return;
    }
    setRole(user.role);
  }, [router]);

  const isRequester = role !== null && REQUESTER_ROLES.includes(role);
  const isStudentRecordsEncoder = role !== null && STUDENT_RECORDS_ROLES.includes(role);

  useEffect(() => {
    if (!role) return;

    const forbiddenPaths = isRequester
      ? ["/documents", "/student-list", "/student-profile-information", "/report", "/users", "/audit-logs"]
      : ["/request", "/request-processing", "/report", "/users", "/audit-logs"];

    if (!isRequester && !isStudentRecordsEncoder) {
      router.replace("/dashboard");
      return;
    }

    if (forbiddenPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      router.replace("/dashboard");
    }
  }, [isRequester, isStudentRecordsEncoder, pathname, role, router]);

  if (isRequester) return <RequesterSidebar isOpen={isOpen} onClose={onClose} />;
  if (!isStudentRecordsEncoder) return null;

  return <StudentRecordsSidebar isOpen={isOpen} onClose={onClose} />;
}
