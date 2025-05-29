import React from 'react';
import { Note } from '../../types/note';
import { formatDate } from '../../utils/dateUtils';
import { PDFThumbnail } from './PDFThumbnail';

interface NoteCardProps {
  note: Note;
  onView: (noteId: string) => void;
  onEdit?: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  onFavorite?: (noteId: string) => void;
  isFavorite?: boolean;
  className?: string;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onView,
  onEdit,
  onDelete,
  onFavorite,
  isFavorite = false,
  className = ''
}) => {
  const handleError = () => {
    console.error('Error loading PDF thumbnail');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="relative h-48">
        <PDFThumbnail
          fileUrl={note.fileUrl}
          onError={handleError}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{note.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{note.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatDate(note.createdAt)}</span>
          <div className="flex items-center space-x-2">
            <span>{note.viewCount} views</span>
            <span>{note.downloadCount} downloads</span>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => onView(note._id)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              View
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(note._id)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(note._id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>
          {onFavorite && (
            <button
              onClick={() => onFavorite(note._id)}
              className={`p-2 rounded-full ${
                isFavorite ? 'text-yellow-500' : 'text-gray-400'
              }`}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard; 