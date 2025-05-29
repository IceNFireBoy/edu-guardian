import { useNote } from 'hooks/useNote';
import { useAuth } from 'hooks/useAuth';
import { Note, NoteRating } from 'types/note';

interface NoteDetailsProps {
  note: Note;
}

export const NoteDetails: React.FC<NoteDetailsProps> = ({ note }) => {
  const { user } = useAuth();
  const { updateNoteRating } = useNote();

  // Fix the ratings property access
  if (note.rating && user?._id) {
    const userRating = note.rating;
    // ... existing code ...
  }

  // Fix the aiSummary property access
  const hasSummary = note.aiSummary?.content && note.aiSummary.content.trim() !== '';
  const hasKeyPoints = note.aiSummary?.keyPoints && note.aiSummary.keyPoints.length > 0;

  return (
    <div>
      {/* Fix the user property access */}
      {user && (user._id === note.user || user.role === 'admin') && (
        // ... existing code ...
      )}

      {/* Fix the aiSummary rendering */}
      {note.aiSummary?.content && (
        <p>{note.aiSummary.content}</p>
      )}

      {/* Fix the aiSummaryKeyPoints rendering */}
      {note.aiSummary?.keyPoints && note.aiSummary.keyPoints.map((point: string, index: number) => (
        <li key={index}>{point}</li>
      ))}
    </div>
  );
}; 