import mongoose, { Document, Schema } from 'mongoose';

/**
 * A single spaced-repetition review card belonging to a user (typically created
 * from an AI-generated flashcard or quiz question). Scheduling state follows the
 * SM-2 algorithm — see services/SrsService.ts.
 */
export interface ISrsCard extends Document {
  user: mongoose.Types.ObjectId;
  note?: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  repetitions: number;
  easeFactor: number;
  interval: number; // days until next review
  dueDate: Date;
  lapses: number;
  createdAt: Date;
  updatedAt: Date;
}

const SrsCardSchema = new Schema<ISrsCard>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    note: { type: Schema.Types.ObjectId, ref: 'Note' },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    repetitions: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    dueDate: { type: Date, default: Date.now },
    lapses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Primary access pattern: "which of this user's cards are due now?"
SrsCardSchema.index({ user: 1, dueDate: 1 });

const SrsCard = mongoose.model<ISrsCard>('SrsCard', SrsCardSchema);
export default SrsCard;
