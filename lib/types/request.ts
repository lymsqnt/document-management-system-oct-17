export type DocumentRequest = {
  id: string;
  studentId: string;
  studentName: string;
  email?: string;
  course?: string;
  major?: string;
  yearLevel?: string;
  documentType: string;
  purpose: string;
  status: "Pending Admin Review";
  dateCreated: string;
  requestedBy: string;
};
