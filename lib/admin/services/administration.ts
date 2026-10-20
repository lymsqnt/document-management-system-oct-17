import { getCurrentUser, getAccounts, saveAccounts } from "@/lib/shared/storage/accounts";
import { getRoles, saveRoles } from "@/lib/shared/storage/roles";
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

export function approveAccount(email: string): AdminActionResult {
  const actor = getCurrentUser();
  if (!actor || actor.role !== "Administrator") {
    return { success: false, message: "Administrator access is required." };
  }
  const accounts = getAccounts();
  const account = accounts.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!account || account.status !== "pending") {
    return { success: false, message: "This account is no longer pending." };
  }

  account.status = "approved";
  saveAccounts(accounts);
  recordAuditLog(
    { fullName: actor.fullName, email: actor.email, role: actor.role },
    {
      action: "Account Approved",
      resourceType: "Approval",
      resource: account.email,
      details: `Approved account registration with the requested ${account.role} role.`,
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

export function createRole(name: string): AdminActionResult {
  const actor = getCurrentUser();
  if (!actor || actor.role !== "Administrator") {
    return { success: false, message: "Administrator access is required." };
  }

  const role = name.trim().replace(/\s+/g, " ");
  if (role.length < 2 || role.length > 32) {
    return { success: false, message: "Role names must be 2–32 characters." };
  }

  const roles = getRoles();
  if (roles.some((item) => item.toLowerCase() === role.toLowerCase())) {
    return { success: false, message: "That role already exists." };
  }

  saveRoles([...roles, role]);
  recordAuditLog(
    { fullName: actor.fullName, email: actor.email, role: actor.role },
    {
      action: "Role Created",
      resourceType: "Role",
      resource: role,
      details: `Created the ${role} role.`,
    },
  );
  return { success: true };
}

export function renameRole(oldName: string, newName: string): AdminActionResult {
  const actor = getCurrentUser();
  if (!actor || actor.role !== "Administrator") {
    return { success: false, message: "Administrator access is required." };
  }
  if (oldName === "Administrator") {
    return { success: false, message: "The Administrator role cannot be renamed." };
  }

  const role = newName.trim().replace(/\s+/g, " ");
  if (role.length < 2 || role.length > 32) {
    return { success: false, message: "Role names must be 2–32 characters." };
  }

  const roles = getRoles();
  if (!roles.includes(oldName)) return { success: false, message: "Role not found." };
  if (roles.some((item) => item.toLowerCase() === role.toLowerCase())) {
    return { success: false, message: "That role already exists." };
  }

  saveRoles(roles.map((item) => item === oldName ? role : item));
  const accounts = getAccounts();
  let updatedAccounts = false;
  for (const account of accounts) {
    if (account.role === oldName) {
      account.role = role;
      updatedAccounts = true;
    }
  }
  if (updatedAccounts) saveAccounts(accounts);

  recordAuditLog(
    { fullName: actor.fullName, email: actor.email, role: actor.role },
    {
      action: "Role Updated",
      resourceType: "Role",
      resource: role,
      details: "Renamed the " + oldName + " role to " + role + ".",
    },
  );
  return { success: true };
}

export function deleteRole(name: string): AdminActionResult {
  const actor = getCurrentUser();
  if (!actor || actor.role !== "Administrator") {
    return { success: false, message: "Administrator access is required." };
  }
  if (name === "Administrator") {
    return { success: false, message: "The Administrator role cannot be removed." };
  }

  const accounts = getAccounts();
  if (accounts.some((account) => account.role === name)) {
    return {
      success: false,
      message: "This role is assigned to an account and cannot be removed.",
    };
  }

  const roles = getRoles();
  if (!roles.includes(name)) return { success: false, message: "Role not found." };
  saveRoles(roles.filter((role) => role !== name));
  recordAuditLog(
    { fullName: actor.fullName, email: actor.email, role: actor.role },
    {
      action: "Role Deleted",
      resourceType: "Role",
      resource: name,
      details: `Removed the ${name} role.`,
    },
  );
  return { success: true };
}