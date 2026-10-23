"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Users, BarChart3, History, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout";
import Topbar from "@/components/shared/layout/topbar";
import { getAccounts } from "@/lib/shared/storage/accounts";
import { getAuditLogs } from "@/lib/shared/storage/audit-logs";
import { OPERATIONAL_ROLES } from "@/lib/shared/constants/account";
import StudentDistribution from "@/components/users/dashboard/student-distribution";
import ActivityChart from "@/components/users/dashboard/activitychart";
import RecentStudents from "@/components/users/dashboard/recent-students";
import { YEAR_LEVELS } from "@/lib/users/constants/student";
import { getStudentDocuments, STUDENT_DOCUMENTS_UPDATED_EVENT } from "@/lib/users/storage/student-documents";
import type { StudentDocument } from "@/lib/users/types/student";

type RecentStudent = {
  studentId: string;
  studentName: string;
  course: string;
  major: string;
  yearLevel: string;
  email: string;
  dateSubmitted: string;
  encodedAt: string;
  profileImage?: string;
};

function getEncodedTimestamp(document: Pick<StudentDocument, "encodedAt" | "dateSubmitted">) {
  return document.encodedAt || document.dateSubmitted || "";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ pending: 0, pendingStudents: 0, users: 0, roles: 0, auditLogs: 0 });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [yearLevelData, setYearLevelData] = useState(YEAR_LEVELS.map((label) => ({ label, value: 0 })));
  const [activityData, setActivityData] = useState<{ date: string; uploaded: number }[]>([]);
  useEffect(() => {
    const updateSidebar = () => setSidebarOpen(window.innerWidth >= 1024);
    const load = () => {
      const accounts = getAccounts();
      const allDocuments = getStudentDocuments();
      const documents = allDocuments.filter(
        (document) => document.approvalStatus === undefined || document.approvalStatus === "approved"
      );
      const pendingStudentIds = new Set(allDocuments
        .filter((document) => document.approvalStatus === "pending")
        .map((document) => document.studentId.trim().toUpperCase()));
      setStats({
        pending: accounts.filter((account) => account.status === "pending").length,
        pendingStudents: pendingStudentIds.size,
        users: accounts.filter((account) => account.role !== "Administrator").length,
        roles: OPERATIONAL_ROLES.length,
        auditLogs: getAuditLogs().length,
      });

      const byStudent = new Map<string, RecentStudent>();
      documents.forEach((document) => {
        const id = document.studentId?.trim().toUpperCase();
        if (!id) return;
        const existing = byStudent.get(id);
        if (!existing) {
          byStudent.set(id, {
            studentId: document.studentId,
            studentName: document.studentName,
            course: document.course || "—",
            major: document.major || "N/A",
            yearLevel: document.yearLevel || "—",
            email: document.email || "",
            dateSubmitted: document.dateSubmitted || "",
            encodedAt: document.encodedAt || "",
            profileImage: document.profileImage,
          });
          return;
        }
        const existingTime = new Date(getEncodedTimestamp(existing)).getTime();
        const currentTime = new Date(getEncodedTimestamp(document)).getTime();
        if (!Number.isNaN(currentTime) && (Number.isNaN(existingTime) || currentTime > existingTime)) {
          existing.dateSubmitted = document.dateSubmitted || existing.dateSubmitted;
          existing.encodedAt = document.encodedAt || "";
          existing.profileImage = document.profileImage || existing.profileImage;
        }
      });
      const students = Array.from(byStudent.values()).sort((a, b) =>
        new Date(getEncodedTimestamp(b)).getTime() - new Date(getEncodedTimestamp(a)).getTime()
      );
      setRecentStudents(students);
      setYearLevelData(YEAR_LEVELS.map((label) => ({
        label,
        value: students.filter((student) => student.yearLevel === label).length,
      })));

      const getLocalDayKey = (date: Date) => [
        date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0"),
      ].join("-");
      const today = new Date();
      setActivityData(Array.from({ length: 7 }, (_, index) => {
        const day = new Date(today);
        day.setHours(0, 0, 0, 0);
        day.setDate(today.getDate() - (6 - index));
        const key = getLocalDayKey(day);
        const uploaded = documents.filter((document) => {
          const timestamp = getEncodedTimestamp(document);
          if (!timestamp) return false;
          if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) return timestamp === key;
          const parsed = new Date(timestamp);
          return !Number.isNaN(parsed.getTime()) && getLocalDayKey(parsed) === key;
        }).length;
        return { date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }), uploaded };
      }));
    };
    updateSidebar();
    load();
    window.addEventListener("resize", updateSidebar);
    window.addEventListener("focus", load);
    window.addEventListener("storage", load);
    window.addEventListener(STUDENT_DOCUMENTS_UPDATED_EVENT, load);
    return () => {
      window.removeEventListener("resize", updateSidebar);
      window.removeEventListener("focus", load);
      window.removeEventListener("storage", load);
      window.removeEventListener(STUDENT_DOCUMENTS_UPDATED_EVENT, load);
    };
  }, []);

  const cards = [
    { label: "Pending registrations", value: stats.pending, href: "/admin/account-registration-approval", icon: ClipboardCheck, tone: "text-amber-700 bg-amber-50" },
    { label: "Student encodings to review", value: stats.pendingStudents, href: "/admin/student-approvals", icon: ClipboardCheck, tone: "text-orange-700 bg-orange-50" },
    { label: "Users", value: stats.users, href: "/admin/users", icon: Users, tone: "text-blue-700 bg-blue-50" },
    { label: "Available roles", value: stats.roles, href: "/admin/roles", icon: ShieldCheck, tone: "text-indigo-700 bg-indigo-50" },
    { label: "Audit records", value: stats.auditLogs, href: "/admin/audit-logs", icon: History, tone: "text-emerald-700 bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fc] text-slate-800">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={"min-h-screen w-full transition-[margin] duration-300 " + (sidebarOpen ? "lg:ml-[275px] lg:w-[calc(100%-275px)]" : "ml-0 w-full")}>
        <Topbar title="Admin Dashboard" onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:p-6">
          <section className="rounded-2xl bg-gradient-to-r from-[#102c79] to-[#1b4db5] p-6 text-white shadow-sm">
            <h1 className="text-xl font-semibold">Administration Overview</h1>
            <p className="mt-1 text-sm text-blue-100">Manage registrations, users, reports, roles, and system activity.</p>
          </section>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => { const Icon = card.icon; return <Link key={card.label} href={card.href} className="rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{card.label}</p><p className="mt-2 text-3xl font-semibold text-[#163b83]">{card.value}</p></div><span className={"rounded-xl p-3 " + card.tone}><Icon size={22} /></span></div></Link>; })}
          </section>
          <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(420px,1fr)]">
            <div className="min-w-0 space-y-5">
              <StudentDistribution data={yearLevelData} />
              <ActivityChart data={activityData} />
            </div>
            <div className="min-w-0">
              <RecentStudents
                students={recentStudents.slice(0, 8)}
                onViewStudent={(studentId) => router.push(`/admin/students/profile?id=${encodeURIComponent(studentId)}`)}
                onViewAll={() => router.push("/admin/students")}
              />
            </div>
          </section>
          <Link href="/admin/reports" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><BarChart3 size={22} /></span><span><span className="block font-semibold text-slate-800">View reports</span><span className="mt-1 block text-sm text-slate-500">Review document compliance and submission summaries.</span></span></Link>
        </div>
      </main>
    </div>
  );
}
