import { getCurrentUser, getAccounts, saveAccounts } from "@/lib/shared/storage/accounts";
import { OPERATIONAL_ROLES } from "@/lib/shared/constants/account";
import { recordAuditLog } from "@/lib/shared/storage/audit-logs";
import type { DemoAccount, SafeUser } from "@/lib/shared/types/account";

export type AdminActionResult =
  | { success: true }
  | { success: false; message: string };

function isAdministrator(): boolean {
  return getCurrentUser()?.role === "Administrator";
}

function toSafeUser(account: DemoAccount): SafeUser {
  const { password: _password, ...user } = account;
  return user;
}

export function getPendingAccounts(): SafeUser[] {
  if (!isAdministrator()) return [];
  return getAccounts()
    .filter((account) => account.status === "pending")
    .map(toSafeUser);
}

export function approveAccount(email: string, assignedRole: string): AdminActionResult {
  const actor = getCurrentUser();
  if (!actor || actor.role !== "Administrator") {
    return { success: false, message: "Administrator access is required." };
  }
  const accounts = getAccounts();
  const account = accounts.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!account || account.status !== "pending") {
    return { success: false, message: "This account is no longer pending." };
  }
  if (!(OPERATIONAL_ROLES as readonly string[]).includes(assignedRole)) {
    return { success: false, message: "Assign one of the supported account roles before approving." };
  }

  account.role = assignedRole;
  account.status = "approved";
  saveAccounts(accounts);
  recordAuditLog(
    { fullName: actor.fullName, email: actor.email, role: actor.role },
    {
      action: "Account Approved",
      resourceType: "Approval",
      resource: account.email,
      details: `Approved account registration and assigned the ${account.role} role.`,
    },
  );
  return { success: true };
}

export function rejectAccount(email: string): AdminActionResult {
  const actor = getCurrentUser();
  if (!actor || actor.role !== "Administrator") {
    return { success: false, message: "Administrator access is required." };
  }

  const accounts = getAccounts();
  const account = accounts.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!account || account.status !== "pending") {
    return { success: false, message: "This account is no longer pending." };
  }

  account.status = "rejected";
  saveAccounts(accounts);
  recordAuditLog(
    { fullName: actor.fullName, email: actor.email, role: actor.role },
    {
      action: "Account Rejected",
      resourceType: "Approval",
      resource: account.email,
      details: "Rejected account registration request.",
    },
  );
  return { success: true };
}
