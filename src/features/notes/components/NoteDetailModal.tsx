import { Note, NoteRating } from 'types/note';
import { formatDate } from 'utils/dateUtils';

const averageRating = note.ratings && note.ratings.length > 0
  ? (note.ratings.reduce((sum: number, r: NoteRating) => sum + r.value, 0) / note.ratings.length).toFixed(1)
  : '0.0'; 