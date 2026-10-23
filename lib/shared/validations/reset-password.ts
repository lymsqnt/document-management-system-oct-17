import { validateStrongPassword } from "@/lib/shared/validations/password";

export type ResetPasswordData = {
  password: string;
  confirmPassword: string;
};

export type ResetPasswordErrors = Partial<Record<keyof ResetPasswordData, string>>;

export function validateResetPassword(data: ResetPasswordData): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {};

  if (!data.password) {
    errors.password = "Password is required.";
  } else {
    const passwordError = validateStrongPassword(data.password);
    if (passwordError) errors.password = passwordError;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
