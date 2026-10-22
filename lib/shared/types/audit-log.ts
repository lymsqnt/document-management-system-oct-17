export type AuditAction =
  | "Sign In"
  | "Sign Out"
  | "Account Created"
  | "Profile Updated"
  | "Password Changed"
  | "Password Reset"
  | "Document Uploaded"
  | "Document Updated"
  | "Student Deleted"
  | "Account Approved"
  | "Account Rejected"
  | "Student Encoding Approved"
  | "Student Encoding Rejected"
  | "Role Created"
  | "Role Updated"
  | "Role Deleted";

export type AuditResourceType = "Account" | "Profile" | "Security" | "Document" | "Student" | "Approval" | "Role";

export type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  email: string;
  role: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resource: string;
  details: string;
};
