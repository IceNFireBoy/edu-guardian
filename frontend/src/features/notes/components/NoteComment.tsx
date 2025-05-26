import React from 'react';
import { Note } from '../../../types/note';

interface NoteCommentProps {
  notes: Note[];
}

const NoteComment: React.FC<NoteCommentProps> = ({ notes }) => {
  return (
    <ul>
      {notes.map(note => (
        <li key={note._id}>{note.title}</li>
      ))}
    </ul>
  );
};

export default NoteComment; 