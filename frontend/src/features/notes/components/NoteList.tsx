import React from 'react';
import { Note } from '../../../types/note';

interface NoteListProps {
  notes: Note[];
}

const NoteList: React.FC<NoteListProps> = ({ notes }) => {
  if (!notes.length) return <div>No notes found</div>;
  return (
    <ul>
      {notes.map(note => (
        <li key={note._id}>{note.title}</li>
      ))}
    </ul>
  );
};

export default NoteList; 