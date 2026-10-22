"use client";

import {
  ChangeEvent,
  DragEvent as ReactDragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  Layers3,
  Mail,
  MessageSquare,
  UploadCloud,
  UserRound,
  Plus,
  Trash2,
} from "lucide-react";

import Sidebar from "@/components/users/layout/sidebar";
import Topbar from "@/components/shared/layout/topbar";
import WelcomeBanner from "@/components/shared/layout/welcome-banner";
import GroupedSelect from "@/components/shared/ui/grouped-select";
import Select from "@/components/shared/ui/select";

import {
  COURSE_MAJORS,
  DOCUMENT_TYPES,
  PROGRAMS_BY_COLLEGE,
  YEAR_LEVELS,
} from "@/lib/users/constants/student";
import { logActivity } from "@/lib/shared/storage/audit-logs";
import {
  addStudentDocuments,
  getStudentDocuments,
} from "@/lib/users/storage/student-documents";
import type { StudentDocument } from "@/lib/users/types/student";
import { validateDocumentFile } from "@/lib/shared/validations/files";
import { validateStudentDocumentForm } from "@/lib/users/validations/student-documents";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

type CredentialDraft = {
  id: string;
  documentType: string;
  selectedFile: File | null;
  filePreview: string;
};

const createCredentialDraft = (): CredentialDraft => ({
  id: crypto.randomUUID(),
  documentType: "",
  selectedFile: null,
  filePreview: "",
});

export default function DocumentList() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [course, setCourse] = useState("");
  const [major, setMajor] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [dateSubmitted, setDateSubmitted] =
    useState(getTodayDate());
  const [email, setEmail] = useState("");
  const [remarks, setRemarks] = useState("");

  const [credentials, setCredentials] = useState<CredentialDraft[]>([
    { id: "credential-initial", documentType: "", selectedFile: null, filePreview: "" },
  ]);
  const [draggingCredentialId, setDraggingCredentialId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const dateInputRef =
    useRef<HTMLInputElement | null>(null);

  const availableMajors = COURSE_MAJORS[course] ?? [];

  // Course choices grouped under their college, spelled out in full.
  const courseGroups = useMemo(
    () =>
      Object.entries(PROGRAMS_BY_COLLEGE).map(
        ([college, programs]) => ({
          group: college,
          options: programs.map((program) => ({
            value: program.code,
            label: program.label,
            description: program.code,
          })),
        })
      ),
    []
  );



  useEffect(() => {
    const updateSidebar = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    updateSidebar();

    window.addEventListener("resize", updateSidebar);

    return () => {
      window.removeEventListener("resize", updateSidebar);
    };
  }, []);

  const handleCredentialFile = (credentialId: string, file: File) => {
    setError("");
    setMessage("");

    const fileError = validateDocumentFile(file);

    if (fileError) {
      setError(fileError);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setCredentials((current) => current.map((credential) =>
        credential.id === credentialId
          ? { ...credential, selectedFile: file, filePreview: String(reader.result) }
          : credential
      ));
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (
    credentialId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) handleCredentialFile(credentialId, file);
  };

  const handleFileDrop = (credentialId: string, event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingCredentialId(null);
    const file = event.dataTransfer.files?.[0];
    if (file) handleCredentialFile(credentialId, file);
  };

  const handleRemoveFile = (credentialId: string) => {
    setCredentials((current) => current.map((credential) =>
      credential.id === credentialId
        ? { ...credential, selectedFile: null, filePreview: "" }
        : credential
    ));
    const input = document.getElementById(`credential-file-${credentialId}`) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleRemoveCredential = (credentialId: string) => {
    const input = document.getElementById(`credential-file-${credentialId}`) as HTMLInputElement | null;
    if (input) input.value = "";

    setCredentials((current) => current.length > 1
      ? current.filter((credential) => credential.id !== credentialId)
      : current.map((credential) => credential.id === credentialId
        ? { ...credential, documentType: "", selectedFile: null, filePreview: "" }
        : credential
      )
    );
  };

  const updateCredentialType = (credentialId: string, documentType: string) => {
    setCredentials((current) => current.map((credential) =>
      credential.id === credentialId ? { ...credential, documentType } : credential
    ));
  };

  const handleCourseChange = (
    selectedCourse: string
  ) => {
    setCourse(selectedCourse);

    const courseMajors =
      COURSE_MAJORS[selectedCourse] ?? [];

    if (courseMajors.length > 0) {
      setMajor("");
    } else if (selectedCourse) {
      setMajor("N/A");
    } else {
      setMajor("");
    }
  };

  const openDatePicker = () => {
    if (!dateInputRef.current) return;

    const input = dateInputRef.current;

    if ("showPicker" in HTMLInputElement.prototype) {
      input.showPicker();
    } else {
      input.focus();
    }
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError = validateStudentDocumentForm(
      {
        studentId,
        studentName,
        email,
        course,
        major,
        yearLevel,
        schoolYear,
        documentType: credentials[0]?.documentType || DOCUMENT_TYPES[0],
        dateSubmitted,
        hasFile: true,
      },
      getStudentDocuments()
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    if (credentials.some((credential) => !credential.documentType || !credential.selectedFile || !credential.filePreview)) {
      setError("Choose a document type and upload a file for every credential.");
      return;
    }

    const selectedTypes = credentials.map((credential) => credential.documentType);
    if (new Set(selectedTypes).size !== selectedTypes.length) {
      setError("Each credential must have a different document type.");
      return;
    }

    try {
      const normalizedStudentName = studentName.trim().replace(/\s+/g, " ");
      const normalizedStudentId = studentId.trim().toUpperCase();
      const encodedAt = new Date().toISOString();
      const newDocuments: StudentDocument[] = credentials.map((credential) => ({
        id: crypto.randomUUID(),
        studentId: normalizedStudentId,
        studentName: normalizedStudentName,
        course: course.trim(),
        major: major.trim(),
        yearLevel: yearLevel.trim(),
        schoolYear: schoolYear.trim(),
        documentType: credential.documentType,
        dateSubmitted,
        encodedAt,
        approvalStatus: "pending",
        email: email.trim().toLowerCase(),
        remarks: remarks.trim(),
        fileName: credential.selectedFile!.name,
        fileData: credential.filePreview,
      }));

      addStudentDocuments(newDocuments);

      newDocuments.forEach((document) => logActivity({
        action: "Document Uploaded",
        resourceType: "Document",
        resource: `${document.documentType} - ${document.studentName}`,
        details: `Added student ${document.studentName} (${document.studentId}) with ${document.documentType}.`,
      }));

      const uploadedCount = newDocuments.length;
      setStudentId("");
      setStudentName("");
      setCourse("");
      setMajor("");
      setYearLevel("");
      setSchoolYear("");
      setDateSubmitted(getTodayDate());
      setEmail("");
      setRemarks("");
      setCredentials([createCredentialDraft()]);

      setMessage(
        `${uploadedCount} credential${uploadedCount === 1 ? "" : "s"} submitted for admin approval for ${normalizedStudentName}.`
      );
    } catch {
      setError(
        "Unable to save the demo document. The file may be too large."
      );
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f1f3fc] text-slate-800">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main
        className={`min-h-screen w-full transition-[margin] duration-300 ${sidebarOpen
            ? "lg:ml-[275px] lg:w-[calc(100%-275px)]"
            : "ml-0 w-full"
          }`}
      >
        {/* HEADER */}

        <Topbar
          title="Documents"
          onToggleSidebar={() =>
            setSidebarOpen((current) => !current)
          }
        />
        {/* PAGE CONTENT */}
        <div className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-5 lg:p-6">
          <WelcomeBanner />

          {/* DOCUMENT FORM */}
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start gap-2">
              <FileText
                size={22}
                className="mt-0.5 text-blue-600"
              />

              <div>
                <h2 className="text-base font-semibold text-blue-700">
                  DOCUMENTS
                </h2>

                <p className="text-[10px] text-slate-500">
                  Upload student admission requirements and
                  institutional documents
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 sm:gap-6">
                {/* STUDENT INFORMATION — fields retained as-is */}
                <div className="space-y-3">
                  {/* STUDENT ID + NAME */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* STUDENT ID */}
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium">
                        Student ID{" "}
                        <span className="text-red-500">*</span>
                      </span>

                      <div className="flex h-9 items-center rounded-md border border-slate-300 bg-white px-2 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                        <UserRound
                          size={16}
                          className="mr-2 shrink-0 text-slate-400"
                        />

                        <input
                          value={studentId}
                          onChange={(e) =>
                            setStudentId(
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="e.g. CS-23-033"
                          maxLength={9}
                          className="w-full bg-transparent font-sans text-xs outline-none"
                        />
                      </div>
                    </label>

                    {/* STUDENT NAME */}
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium">
                        Student Name{" "}
                        <span className="text-red-500">*</span>
                      </span>

                      <div className="flex h-9 items-center rounded-md border border-slate-300 bg-white px-2 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                        <UserRound
                          size={16}
                          className="mr-2 shrink-0 text-slate-400"
                        />

                        <input
                          value={studentName}
                          onChange={(e) =>
                            setStudentName(e.target.value)
                          }
                          placeholder="Enter student name"
                          className="w-full bg-transparent font-sans text-xs outline-none"
                        />
                      </div>
                    </label>
                  </div>

                  {/* COURSE */}
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium">
                      Course{" "}
                      <span className="text-red-500">*</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <GraduationCap
                        size={16}
                        className="shrink-0 text-slate-400"
                      />

                      <GroupedSelect
                        value={course}
                        onChange={handleCourseChange}
                        placeholder="Select course"
                        groups={courseGroups}
                        className="flex-1"
                      />
                    </div>
                  </label>

                  {/* MAJOR */}
                  <div
                    aria-hidden={
                      availableMajors.length === 0
                    }
                    className={`grid transition-all duration-300 ease-in-out ${availableMajors.length > 0
                        ? "grid-rows-[1fr] opacity-100"
                        : "pointer-events-none grid-rows-[0fr] opacity-0"
                      }`}
                  >
                    <div className="min-h-0">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium">
                          Major{" "}
                          <span className="text-red-500">*</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <BookOpen
                            size={16}
                            className="shrink-0 text-slate-400"
                          />

                          <Select
                            value={major}
                            onChange={setMajor}
                            placeholder="Select major"
                            disabled={
                              availableMajors.length === 0
                            }
                            options={availableMajors.map(
                              (majorOption) => ({
                                label: majorOption,
                                value: majorOption,
                              })
                            )}
                            className="flex-1"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* YEAR LEVEL */}
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium">
                      Year Level{" "}
                      <span className="text-red-500">*</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <Layers3
                        size={16}
                        className="shrink-0 text-slate-400"
                      />

                      <Select
                        value={yearLevel}
                        onChange={setYearLevel}
                        placeholder="Select year level"
                        options={YEAR_LEVELS.map(
                          (level) => ({
                            label: level,
                            value: level,
                          })
                        )}
                        className="flex-1"
                      />
                    </div>
                  </label>

                  {/* SCHOOL YEAR */}
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium">
                      School Year <span className="text-red-500">*</span>
                    </span>
                    <div className="flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                      <input
                        value={schoolYear}
                        onChange={(event) => setSchoolYear(event.target.value)}
                        placeholder="e.g. 2025-2026"
                        inputMode="numeric"
                        maxLength={9}
                        className="w-full bg-transparent font-sans text-xs outline-none"
                      />
                    </div>
                  </label>

                  {/* DATE SUBMITTED */}
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium">
                      Date Submitted{" "}
                      <span className="text-red-500">*</span>
                    </span>

                    <div
                      onClick={openDatePicker}
                      className="flex h-9 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 transition-all duration-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
                    >
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={dateSubmitted}
                        onChange={(e) =>
                          setDateSubmitted(
                            e.target.value
                          )
                        }
                        className="w-full cursor-pointer bg-transparent font-sans text-xs outline-none"
                      />

                      <CalendarDays
                        size={16}
                        className="ml-2 shrink-0 text-slate-400"
                      />
                    </div>
                  </label>

                  {/* EMAIL */}
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium">
                      Email{" "}
                      <span className="text-red-500">*</span>
                    </span>

                    <div className="flex h-9 items-center rounded-md border border-slate-300 bg-white px-2 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                      <Mail
                        size={16}
                        className="mr-2 shrink-0 text-slate-400"
                      />

                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="Enter email address"
                        className="w-full bg-transparent font-sans text-xs outline-none"
                      />
                    </div>
                  </label>

                  {/* REMARKS */}
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium">
                      Remarks{" "}
                      <span className="text-slate-400">
                        (Optional)
                      </span>
                    </span>

                    <div className="flex items-start rounded-md border border-slate-300 bg-white px-2 py-2 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                      <MessageSquare
                        size={16}
                        className="mr-2 mt-0.5 shrink-0 text-slate-400"
                      />

                      <textarea
                        value={remarks}
                        onChange={(e) =>
                          setRemarks(e.target.value)
                        }
                        placeholder="Enter remarks"
                        rows={3}
                        className="w-full resize-none bg-transparent font-sans text-xs outline-none"
                      />
                    </div>
                  </label>
                </div>

              </div>

              <section className="mt-6 border-t border-slate-200 pt-5" aria-labelledby="credentials-heading">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 id="credentials-heading" className="text-sm font-semibold text-slate-800">Credentials to Upload</h3>
                    <p className="mt-1 text-[10px] text-slate-500">Choose a document type and upload its file. Add a row for each credential.</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-700">
                    {credentials.length} credential{credentials.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {credentials.map((credential, index) => (
                    <div key={credential.id} className="grid items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[36px_minmax(0,0.85fr)_minmax(0,1.15fr)_36px] sm:gap-4 sm:p-4">
                      <span className="pb-2 text-[10px] font-semibold text-slate-500">{String(index + 1).padStart(2, "0")}</span>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium">Document Type <span className="text-red-500">*</span></span>
                        <Select
                          value={credential.documentType}
                          onChange={(value) => updateCredentialType(credential.id, value)}
                          placeholder="Select document type"
                          options={DOCUMENT_TYPES.map((type) => ({ label: type, value: type }))}
                          className="w-full"
                        />
                      </label>

                      <div className="min-w-0">
                        <span className="mb-1 block text-xs font-medium">Upload File <span className="text-red-500">*</span></span>
                        <div
                          onDragEnter={(event) => { event.preventDefault(); setDraggingCredentialId(credential.id); }}
                          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
                          onDragLeave={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingCredentialId(null);
                          }}
                          onDrop={(event) => handleFileDrop(credential.id, event)}
                          className={`flex min-h-14 flex-wrap items-center gap-2 rounded-md border border-dashed px-2 py-2 transition ${draggingCredentialId === credential.id ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
                        >
                          <button
                            type="button"
                            onClick={() => document.getElementById(`credential-file-${credential.id}`)?.click()}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            <UploadCloud size={15} />
                            {credential.selectedFile ? "Change file" : "Upload file"}
                          </button>
                          <input
                            id={`credential-file-${credential.id}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(event) => handleFileChange(credential.id, event)}
                            className="hidden"
                          />
                          {credential.selectedFile ? (
                            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                              <FileText size={15} className="shrink-0" />
                              <span className="min-w-0 flex-1 truncate text-[10px] font-medium" title={credential.selectedFile.name}>{credential.selectedFile.name}</span>
                              <button type="button" onClick={() => handleRemoveFile(credential.id)} className="shrink-0 text-[10px] text-red-600 hover:underline">Remove</button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">or drag a file here · PDF, JPG, PNG, DOC, DOCX · Max 5MB</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCredential(credential.id)}
                        aria-label={`Remove credential ${index + 1}`}
                        className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCredentials((current) => [...current, createCredentialDraft()])}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-dashed border-blue-300 px-3 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <Plus size={15} /> Add another credential
                </button>
                <p className="mt-3 text-[10px] text-slate-500">Each credential is saved separately and linked to the same Student ID.</p>
              </section>

              {/* MESSAGE */}
              {error && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-600">
                  {message}
                </div>
              )}

              {/* SUBMIT */}
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm min-w-32"
                >
                  Submit Document
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
