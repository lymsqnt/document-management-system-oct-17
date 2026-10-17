export const COURSE_MAJORS: Record<string, string[]> = {
  BSBA: [
    "Marketing Management",
    "Human Resource Management",
    "Financial Management",
  ],
  BSED: ["Filipino", "Mathematics", "English"],
  BSCS: [],
  BEED: [],
  "BS Criminology": [],
};

/** Official college/course combinations. */
export const COLLEGE_COURSES: Record<string, string[]> = {
  "College of Education": ["BSED", "BEED"],
  "College of Information Technology": ["BSCS"],
  "College of Business Administration": ["BSBA"],
  "College of Criminology": ["BS Criminology"],
};

export const COURSE_LABELS: Record<string, string> = {
  BSCS: "Bachelor of Science in Computer Science",
  BSIT: "Bachelor of Science in Information Technology",
  BSBA: "Bachelor of Science in Business Administration",
  BSED: "Bachelor of Secondary Education",
  BEED: "Bachelor of Elementary Education",
  "BS Criminology": "BS Criminology",
};

/**
 * Groups programs by college for the GroupedSelect component.
 * The code and label properties match document-list.tsx.
 */
export const PROGRAMS_BY_COLLEGE: Record<
  string,
  { code: string; label: string }[]
> = Object.fromEntries(
  Object.entries(COLLEGE_COURSES).map(([college, courses]) => [
    college,
    courses.map((code) => ({
      code,
      label: COURSE_LABELS[code] ?? code,
    })),
  ])
);

export const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];

export const DOCUMENT_TYPES = [
  "Form 137",
  "Diploma Copy",
  "Report Card",
  "Birth Certificate",
  "Good Moral Certificate",
];