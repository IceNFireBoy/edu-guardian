import React from 'react';

interface NoteUploadProps {
  onUpload: () => void;
  onCancel: () => void;
}

const NoteUpload: React.FC<NoteUploadProps> = ({ onUpload, onCancel }) => {
  return (
    <form onSubmit={e => { e.preventDefault(); onUpload(); }}>
      <label htmlFor="title">Title</label>
      <input id="title" name="title" />
      <button type="submit">Upload</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default NoteUpload; 