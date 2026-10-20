export type DemoAccount = {
  fullName: string;
  username: string;
  email: string;
  role: string;
  department: string;
  password: string;
  address?: string;
  birthday?: string;
  gender?: string;
  profileImage?: string;
  status?: "pending" | "approved" | "rejected";
};

export type UserProfile = {
  fullName: string;
  username: string;
  email: string;
  role: string;
  department: string;
  address: string;
  birthday: string;
  gender: string;
  profileImage?: string;
  status?: "pending" | "approved" | "rejected";
};

export type SafeUser = Omit<DemoAccount, "password">;
