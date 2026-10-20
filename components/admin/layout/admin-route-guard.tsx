"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
export default function AdminRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) router.replace("/login");
    else if (user.role !== "Administrator") router.replace("/dashboard");
    else setAllowed(true);
  }, [router]);
  return allowed ? children : <div className="min-h-screen bg-[#f2f6fc]" aria-label="Checking administrator access" />;
}
