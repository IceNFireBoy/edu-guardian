import React from 'react';
import { Note } from '../../../types/note';

interface ProgressProps {
  note: Note;
}

const Progress: React.FC<ProgressProps> = ({ note }) => {
  return (
    <div>
      <div>Progress</div>
      <div>{note.viewCount} views</div>
      <div>{note.downloadCount} downloads</div>
      <div>{note.averageRating} average rating</div>
      <div>{note.ratingCount} ratings</div>
    </div>
  );
};

export default Progress; 