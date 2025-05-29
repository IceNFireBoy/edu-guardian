import mongoose, { Document, Schema } from 'mongoose';
import { Note as INote, NoteRating, AISummary, Flashcard } from 'types/note';

export interface NoteDocument extends INote, Document {}

const NoteRatingSchema = new Schema<NoteRating>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

const AISummarySchema = new Schema<AISummary>({
  content: { type: String, required: true },
  keyPoints: [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
  modelUsed: { type: String, required: true }
});

const FlashcardSchema = new Schema<Flashcard>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  lastReviewed: { type: Date },
  reviewCount: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 }
});

const NoteSchema = new Schema<NoteDocument>({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String, required: true },
  fileUrl: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: false },
  tags: [{ type: String }],
  rating: { type: Number, default: 0 },
  ratings: [NoteRatingSchema],
  aiSummary: AISummarySchema,
  aiSummaryKeyPoints: [{ type: String }],
  flashcards: [FlashcardSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Note = mongoose.model<NoteDocument>('Note', NoteSchema); 