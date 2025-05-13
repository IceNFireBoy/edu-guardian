import mongoose, { Document, Schema, Model } from 'mongoose';
import slugify from 'slugify';
import { IUser } from './User'; // Assuming User.ts is in the same directory

// Interface for individual rating entry
export interface INoteRating extends Document { // Sub-document
  value: number;
  user: mongoose.Types.ObjectId | IUser; // Can be populated
}

// Interface for individual flashcard entry
export interface INoteFlashcard extends Document { // Sub-document
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Main Note Interface
export interface INote extends Document {
  title: string;
  slug: string;
  description?: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'txt' | 'csv' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'svg' | 'unknown';
  fileSize: number;
  subject: string; // Consider making this an enum based on your list
  grade: '11' | '12';
  semester: '1' | '2';
  quarter: '1' | '2' | '3' | '4';
  topic: string;
  publicId?: string; // For Cloudinary or other asset management
  assetId?: string;  // For Cloudinary or other asset management
  tags: string[];
  viewCount: number;
  downloadCount: number;
  ratings: INoteRating[];
  averageRating: number;
  aiSummary?: string;
  aiSummaryGeneratedAt?: Date;
  aiSummaryKeyPoints?: string[];
  flashcards: INoteFlashcard[];
  user: mongoose.Types.ObjectId | IUser; // Can be populated
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date; // Added by timestamps: true

  // Instance Methods
  getAverageRating(): number | null;
}

const NoteRatingSchema = new Schema<INoteRating>({
  value: { type: Number, min: 1, max: 5, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const NoteFlashcardSchema = new Schema<INoteFlashcard>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: String,
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    fileUrl: { type: String, required: [true, 'Please add a file URL'] },
    fileType: {
      type: String,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'unknown'],
      required: [true, 'Please specify file type'],
      default: 'unknown'
    },
    fileSize: { type: Number, required: [true, 'Please specify file size'] },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
      trim: true,
      // Consider a more maintainable enum or separate collection for subjects
      enum: ["Biology", "Business Mathematics", "Calculus", "Chemistry", "Computer", "Creative Writing", "Disciplines in the Social Sciences", "Drafting", "English", "Filipino", "Fundamentals of Accounting", "General Mathematics", "Introduction to World Religion", "Organization and Management", "Photography", "Physics", "Religion", "Research", "Science", "Social Science", "Trends, Networks, and Critical Thinking"]
    },
    grade: { type: String, required: [true, 'Please add a grade'], enum: ['11', '12'] },
    semester: { type: String, required: [true, 'Please add a semester'], enum: ['1', '2'] },
    quarter: { type: String, required: [true, 'Please add a quarter'], enum: ['1', '2', '3', '4'] },
    topic: { type: String, required: [true, 'Please add a topic'], trim: true },
    publicId: String,
    assetId: String,
    tags: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    ratings: [NoteRatingSchema],
    averageRating: { type: Number, default: 0 }, // This will be calculated by a method/hook
    aiSummary: { type: String, maxlength: [2000, 'AI summary cannot be more than 2000 characters'] },
    aiSummaryGeneratedAt: { type: Date },
    aiSummaryKeyPoints: { type: [String] },
    flashcards: [NoteFlashcardSchema],
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Made user required for a note
    isPublic: { type: Boolean, default: true },
    // createdAt is handled by timestamps: true
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Create slug from title before saving
NoteSchema.pre<INote>('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Calculate average rating before saving
NoteSchema.pre<INote>('save', function(next) {
  if (this.isModified('ratings') || this.isNew) {
    this.getAverageRating(); // Call the method to update averageRating field
  }
  next();
});

// Calculate and set average rating
NoteSchema.methods.getAverageRating = function(this: INote): number | null {
  if (!this.ratings || this.ratings.length === 0) {
    this.averageRating = 0; // Default to 0 if no ratings
    return 0;
  }
  const sum = this.ratings.reduce((total, item) => total + item.value, 0);
  this.averageRating = parseFloat((sum / this.ratings.length).toFixed(1)); // Rounded to one decimal place
  return this.averageRating;
};

// Create indexes for better query performance
NoteSchema.index({ subject: 1, grade: 1, semester: 1, quarter: 1 });
NoteSchema.index({ title: 'text', description: 'text', topic: 'text', tags: 'text' }); // Added tags to text index
NoteSchema.index({ slug: 1 });
NoteSchema.index({ user: 1 });
NoteSchema.index({ title: 1, user: 1 }, { unique: true }); // Ensure title is unique per user
NoteSchema.index({ averageRating: -1 });
NoteSchema.index({ createdAt: -1 });

// Static model type
export interface INoteModel extends Model<INote> {
  // Define static methods here if any
}

const Note = mongoose.model<INote, INoteModel>('Note', NoteSchema);
export default Note; 