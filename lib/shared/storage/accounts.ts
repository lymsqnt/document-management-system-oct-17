import type { DemoAccount, SafeUser, UserProfile } from "@/lib/shared/types/account";

export const ACCOUNTS_KEY = "demoAccounts";
const CURRENT_USER_KEY = "currentUser";
const REMEMBERED_USERNAME_KEY = "rememberedUsername";

const DEFAULT_ADMIN = {
  fullName: "Administrator",
  username: "admin",
  email: "admin@qeci.edu.ph",
  role: "Administrator",
  department: "Administration",
  password: "Admin123!",
  status: "approved",
} satisfies DemoAccount;

export function getAccounts(): DemoAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);

    if (!storedAccounts) {
      saveAccounts([DEFAULT_ADMIN]);
      return [DEFAULT_ADMIN];
    }

    const parsedAccounts: unknown = JSON.parse(storedAccounts);

    if (!Array.isArray(parsedAccounts)) return [DEFAULT_ADMIN];

    const accounts = (parsedAccounts as DemoAccount[]).map((account) => ({
      ...account,
      ...(account.email.toLowerCase() === DEFAULT_ADMIN.email && account.role === "Administrator"
        ? { fullName: "Administrator" }
        : {}),
      status: account.status ?? "approved",
    }));
    // Always keep the default admin login available in this local demo.
    const hasDefaultAdmin = accounts.some(
      (account) => account.username.toLowerCase() === DEFAULT_ADMIN.username,
    );

    if (!hasDefaultAdmin) accounts.unshift(DEFAULT_ADMIN);
    saveAccounts(accounts);
    return accounts;
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: DemoAccount[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = sessionStorage.getItem(CURRENT_USER_KEY);

    if (!storedUser) return null;

    const user = JSON.parse(storedUser) as Partial<UserProfile>;

    return {
      fullName: user.email?.toLowerCase() === DEFAULT_ADMIN.email && user.role === "Administrator"
        ? "Administrator"
        : user.fullName ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      role: user.role ?? "",
      department: user.department ?? "",
      address: user.address ?? "",
      birthday: user.birthday ?? "",
      gender: user.gender ?? "",
      profileImage: user.profileImage ?? "",
      status: user.status ?? "approved",
    };
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: SafeUser): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(CURRENT_USER_KEY);
}

export function getRememberedUsername(): string | null {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem(REMEMBERED_USERNAME_KEY);
}

/** Pass null to forget the remembered username. */
export function saveRememberedUsername(username: string | null): void {
  if (typeof window === "undefined") return;

  if (username) {
    sessionStorage.setItem(REMEMBERED_USERNAME_KEY, username);
  } else {
    sessionStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }
}
