export type StudentEncodingNotification = {
  id: string;
  recipientEmail: string;
  status: "approved" | "rejected";
  studentName: string;
  studentId: string;
  reviewedBy: string;
  createdAt: string;
  readAt?: string;
};
