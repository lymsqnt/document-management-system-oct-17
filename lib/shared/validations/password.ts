const STRONG_PASSWORD_REQUIREMENTS = [
  { test: (password: string) => password.length >= 8, label: "at least 8 characters" },
  { test: (password: string) => /[a-z]/.test(password), label: "a lowercase letter" },
  { test: (password: string) => /[A-Z]/.test(password), label: "an uppercase letter" },
  { test: (password: string) => /\d/.test(password), label: "a number" },
  { test: (password: string) => /[^A-Za-z0-9\s]/.test(password), label: "a special character" },
];

export function validateStrongPassword(password: string): string | null {
  const missing = STRONG_PASSWORD_REQUIREMENTS
    .filter(({ test }) => !test(password))
    .map(({ label }) => label);

  return missing.length
    ? `Password must include ${missing.join(", ").replace(/, ([^,]*)$/, ", and $1")}.`
    : null;
}
