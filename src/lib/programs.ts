export type Program = {
  code: string;
  name: string;
};

export const PROGRAMS: Program[] = [
  // Undergraduate
  { code: "ASSOCIATE", name: "Associate Degree" },
  { code: "BACHELORS", name: "Bachelor’s Degree" },
  { code: "INTEGRATED_BACHELORS", name: "Integrated Bachelor’s Program" },
  { code: "UNDERGRAD_CERT", name: "Undergraduate Certificate" },
  { code: "MINOR", name: "Academic Minor" },

  // Graduate
  { code: "MASTERS", name: "Master’s Degree" },
  { code: "INTEGRATED_MASTERS", name: "Integrated Master’s Program" },
  { code: "POSTGRAD_CERT", name: "Postgraduate Certificate" },
  { code: "POSTGRAD_DIPLOMA", name: "Postgraduate Diploma" },

  // Doctoral & Professional
  { code: "PHD", name: "Doctor of Philosophy (PhD)" },
  { code: "PROFESSIONAL_DOCTORATE", name: "Professional Doctorate" },

  // Professional Degrees (common globally)
  { code: "MBA", name: "Master of Business Administration (MBA)" },
  { code: "JD", name: "Juris Doctor (Law)" },
  { code: "MD", name: "Doctor of Medicine (MD)" },
  { code: "DDS", name: "Doctor of Dental Surgery (DDS)" },
  { code: "DVM", name: "Doctor of Veterinary Medicine (DVM)" },

  // Research / Academic Tracks
  { code: "RESEARCH_MASTERS", name: "Research Master’s" },
  { code: "RESEARCH_FELLOWSHIP", name: "Research Fellowship" },
  { code: "POSTDOC", name: "Postdoctoral Program" },

  // Continuing / Non-degree
  { code: "CERTIFICATE", name: "Certificate Program" },
  { code: "DIPLOMA", name: "Diploma Program" },
  { code: "CONTINUING_ED", name: "Continuing Education" },
  { code: "NON_DEGREE", name: "Non-Degree Program" },
];