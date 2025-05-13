export const subjectsArray = [
  'Biology', 'Business Mathematics', 'Calculus', 'Chemistry', 'Computer', 'Creative Writing',
  'Disciplines in the Social Sciences', 'Drafting', 'English', 'Filipino', 'Fundamentals of Accounting',
  'General Mathematics', 'Introduction to World Religion', 'Organization and Management', 'Photography',
  'Physics', 'Religion', 'Research', 'Science', 'Social Science', 'Trends, Networks, and Critical Thinking'
];

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);

// Add other constants here as needed, e.g., grade levels, semesters if they become dynamic
export const gradeLevels = [
    { value: "Grade 11", label: "Grade 11" },
    { value: "Grade 12", label: "Grade 12" },
];

export const semesters = [
    { value: "Semester 1", label: "1st Semester" },
    { value: "Semester 2", label: "2nd Semester" },
];

export const quarters = [
    { value: "Quarter 1", label: "Q1" },
    { value: "Quarter 2", label: "Q2" },
    { value: "Quarter 3", label: "Q3" },
    { value: "Quarter 4", label: "Q4" },
];

export const AI_FEATURE_TYPES = {
  SUMMARY: 'summary',
  FLASHCARD: 'flashcard',
} as const;

export const FLASHCARD_DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export type FlashcardDifficulty = typeof FLASHCARD_DIFFICULTY_LEVELS[number];

// Could also define allowed file types for uploader if needed globally
export const ALLOWED_UPLOAD_FILE_TYPES = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  // Add more as supported by backend & Cloudinary
};

export const FILE_TYPE_EXTENSIONS = {
  [ALLOWED_UPLOAD_FILE_TYPES.PDF]: ['.pdf'],
  [ALLOWED_UPLOAD_FILE_TYPES.JPEG]: ['.jpg', '.jpeg'],
  [ALLOWED_UPLOAD_FILE_TYPES.PNG]: ['.png'],
}; 