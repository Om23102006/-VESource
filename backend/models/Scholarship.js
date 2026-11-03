// Sample scholarship catalog data for VESource (VESIT Student Portal)
// NOTE: Clearly labelled as sample academic schemes for demonstration and testing.

export const SAMPLE_SCHOLARSHIPS = [
  {
    id: "mahadbt-ebc",
    name: "Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)",
    category: "Economically Backward Class (EBC)",
    provider: "Directorate of Technical Education, Maharashtra (Sample)",
    benefit: "50% Tuition fee and Exam fee concession",
    deadline: "2026-12-31",
    eligibility: [
      "Admitted through CAP round in Engineering/Technology.",
      "Annual family income up to ₹8,00,000.",
      "Maharashtra State Domicile.",
      "Maximum 2 beneficiaries per family.",
    ],
    requiredDocuments: [
      "Income Certificate issued by Tehsildar",
      "CAP Allotment Letter",
      "Previous Year Marksheet (HSC / Diploma / Semester)",
      "Domicile Certificate",
      "Ration Card copy",
    ],
  },
  {
    id: "mahadbt-obc",
    name: "Post Matric Scholarship to OBC Students",
    category: "Other Backward Classes (OBC)",
    provider: "VJNT, OBC and SBC Welfare Department (Sample)",
    benefit: "50% to 100% Tuition & Examination fees waiver based on income tier",
    deadline: "2026-12-15",
    eligibility: [
      "Candidate belongs to OBC category in Maharashtra.",
      "Family annual income up to ₹1,50,000 (Scholarship) or up to ₹8,00,000 (Freeship).",
      "Enrolled in recognized degree engineering program.",
    ],
    requiredDocuments: [
      "Caste Certificate & Caste Validity Certificate",
      "Current Financial Year Income Certificate",
      "HSC / Diploma Marksheet",
      "College Admission Fee Receipt",
      "Aadhar linked Bank Account Proof",
    ],
  },
  {
    id: "state-minority",
    name: "State Government Minority Scholarship",
    category: "Religious Minority (Muslim, Buddhist, Christian, Jain, Sikh, Parsi)",
    provider: "Minority Development Department, Maharashtra (Sample)",
    benefit: "Up to ₹50,000 per academic year towards maintenance and fees",
    deadline: "2026-11-30",
    eligibility: [
      "Student belongs to notified religious minority community.",
      "Minimum 50% marks in previous annual qualifying examination.",
      "Annual family income not exceeding ₹8,00,000.",
    ],
    requiredDocuments: [
      "Self-Declaration of Minority Community",
      "Income Certificate",
      "Previous Year Marksheets",
      "College Identity Card",
      "Domicile Certificate",
    ],
  },
  {
    id: "punjabrao-deshmukh",
    name: "Dr. Panjabrao Deshmukh Vasatigruh Nirvah Bhatta Yojna",
    category: "Hostel Maintenance Allowance",
    provider: "Higher & Technical Education Department (Sample)",
    benefit: "Hostel maintenance allowance up to ₹30,000 / year (MMRDA / Metro)",
    deadline: "2026-12-31",
    eligibility: [
      "Child of registered labourer or marginal farmer.",
      "Admitted in approved technical institute and residing in hostel/paying guest.",
      "Family annual income up to ₹8,00,000.",
    ],
    requiredDocuments: [
      "Registered Labour / Marginal Landholder Certificate",
      "Hostel / PG Stay Certificate & Rent Agreement",
      "CAP Admission Letter",
      "Income & Domicile Certificates",
    ],
  },
  {
    id: "vesit-alumni-merit",
    name: "VESIT Alumni Merit-cum-Means Assistance Scheme",
    category: "Institutional / Alumni Endowment (Sample)",
    provider: "VESIT Alumni Association & Trust (Sample)",
    benefit: "Merit grant of ₹25,000 towards academic project and textbook expenses",
    deadline: "2026-11-20",
    eligibility: [
      "Enrolled full-time student at VESIT (FE / SE / TE / BE).",
      "Minimum 8.0 CGPA with no active backlogs.",
      "Family income less than ₹5,00,000 per annum.",
    ],
    requiredDocuments: [
      "College ID & Bonafide Certificate",
      "All engineering semester marksheets to date",
      "Income proof / ITR of parents",
      "Brief Statement of Purpose / Academic Need",
    ],
  },
];
