"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/shared/storage/accounts";
import { isProfileComplete } from "@/lib/users/validations/profile-completion";

export default function ProfileCompletionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(false);
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "Administrator") {
      router.replace("/admin");
      return;
    }

    if (!isProfileComplete(user) && pathname !== "/profile") {
      router.replace("/profile");
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  return allowed ? children : <div className="min-h-screen bg-[#f2f6fc]" aria-label="Checking profile access" />;
}
