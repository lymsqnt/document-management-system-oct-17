import { ROLES } from "@/lib/shared/constants/account";

const ROLES_KEY = "demoRoles";

/** Roles are browser-local for the demo. Administrator is always retained. */
export function getRoles(): string[] {
  if (typeof window === "undefined") return [...ROLES];

  try {
    const stored = localStorage.getItem(ROLES_KEY);
    if (!stored) {
      saveRoles([...ROLES]);
      return [...ROLES];
    }

    const parsed: unknown = JSON.parse(stored);
    const roles = Array.isArray(parsed)
      ? parsed.filter(
          (role): role is string =>
            typeof role === "string" && role.trim().length > 0,
        )
      : [...ROLES];

    if (!roles.includes("Administrator")) roles.unshift("Administrator");
    return [...new Set(roles.map((role) => role.trim()))];
  } catch {
    return [...ROLES];
  }
}

export function saveRoles(roles: string[]): void {
  if (typeof window === "undefined") return;
  const cleanRoles = [...new Set(roles.map((role) => role.trim()).filter(Boolean))];
  if (!cleanRoles.includes("Administrator")) cleanRoles.unshift("Administrator");
  localStorage.setItem(ROLES_KEY, JSON.stringify(cleanRoles));
}
