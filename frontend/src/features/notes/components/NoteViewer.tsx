import React from 'react';
import { Note } from '../../../types/note';

interface NoteViewerProps {
  note: Note | null;
}

const NoteViewer: React.FC<NoteViewerProps> = ({ note }) => {
  if (!note) return <div>Note not found</div>;
  return (
    <div>
      <h2>{note.title}</h2>
      <p>{note.content}</p>
    </div>
  );
};

export default NoteViewer; 