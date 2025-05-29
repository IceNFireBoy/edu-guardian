import { Note } from 'types/note';
import { formatDate } from 'utils/dateUtils';

// ... existing code ... 

// Fix the PDFThumbnail props
<PDFThumbnail
  fileUrl={note.fileUrl || ''}
  onError={() => {}}
/>

// ... existing code ... 