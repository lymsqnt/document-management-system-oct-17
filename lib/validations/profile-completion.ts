import type { UserProfile } from "@/lib/types/account";

export function isAtLeast18(birthday: string, today = new Date()): boolean {
  const match = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const birthDate = new Date(year, month - 1, day);

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day ||
    birthDate > today
  ) {
    return false;
  }

  return birthday <= getLatestEligibleBirthday(today);
}

export function getLatestEligibleBirthday(today = new Date()): string {
  const year = today.getFullYear() - 18;
  const month = today.getMonth();
  const day = today.getDate();
  const date = new Date(year, month, day);

  // Keep the cutoff on the last day of the month for leap-day birthdays.
  if (date.getMonth() !== month) {
    date.setDate(0);
  }

  const monthText = String(date.getMonth() + 1).padStart(2, "0");
  const dayText = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${monthText}-${dayText}`;
}

/** Fields a user must provide before the dashboard is available. */
export function isProfileComplete(
  profile: Partial<UserProfile> | null | undefined
): boolean {
  return Boolean(
    profile?.fullName?.trim() &&
      profile.username?.trim() &&
      profile.email?.trim() &&
      profile.role?.trim() &&
      profile.department?.trim() &&
      profile.address?.trim() &&
      profile.birthday?.trim() &&
      isAtLeast18(profile.birthday) &&
      profile.gender?.trim()
  );
}
