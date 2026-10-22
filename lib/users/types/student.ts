export type EnrollmentStatus = "Enrolled" | "Graduated" | "Transferred";
export type StudentApprovalStatus = "pending" | "approved" | "rejected";

/**
 * One submitted document. A student is the group of documents that share a
 * studentId. Older saved records may be missing the optional fields.
 */
export type StudentDocument = {
  id: string;
  studentId: string;
  studentName: string;
  college?: string;
  classification?: string;
  course?: string;
  major?: string;
  yearLevel?: string;
  schoolYear?: string;
  enrollmentStatus?: EnrollmentStatus;
  documentType: string;
  dateSubmitted: string;
  /** Exact time this record was encoded, separate from the user-entered submission date. */
  encodedAt?: string;
  approvalStatus?: StudentApprovalStatus;
  approvalReviewedAt?: string;
  approvalReviewedBy?: string;
  email: string;
  remarks?: string;
  fileName: string;
  fileData?: string;
  profileImage?: string;
};

export type StudentProgress =
  | "Completed"
  | "Incomplete"
  | "No Documents Submitted";

/** One student, built from all of their submitted documents. */
export type StudentSummary = {
  studentName: string;
  studentId: string;
  course: string;
  major: string;
  yearLevel: string;
  college: string;
  email: string;
  enrollmentStatus: EnrollmentStatus | "Not set";
  submittedTypes: string[];
  submittedCount: number;
  requiredCount: number;
  progress: StudentProgress;
};
