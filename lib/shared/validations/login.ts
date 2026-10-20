export type LoginData = {
  usernameOrEmail: string;
  password: string;
};

export type LoginErrors = {
  usernameOrEmail?: string;
  password?: string;
};

export function validateLogin(data: LoginData): LoginErrors {
  const errors: LoginErrors = {};

  if (!data.usernameOrEmail.trim()) {
    errors.usernameOrEmail = "Username or email is required.";
  }

  if (!data.password.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
}