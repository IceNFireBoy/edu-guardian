import React from 'react';
import { Note } from '../../../types/note';

interface NoteRatingProps {
  note: Note;
  onRate: (rating: number) => void;
}

const NoteRating: React.FC<NoteRatingProps> = ({ note, onRate }) => {
  return (
    <div>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} data-testid="star" onClick={() => onRate(star)}>
          {star <= (note.rating || 0) ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
};

export default NoteRating; 