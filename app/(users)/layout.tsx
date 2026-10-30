import type { ReactNode } from "react";
import ProfileCompletionGuard from "@/components/users/layout/profile-completion-guard";

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <ProfileCompletionGuard>{children}</ProfileCompletionGuard>;
}
