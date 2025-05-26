import React, { useState } from 'react';
import { useNote } from './useNote';
import { Note } from '../types/note';

interface UploadNoteProps {
  onUploadSuccess?: (note: Note) => void;
  onCancel?: () => void;
  className?: string;
}

const UploadNote: React.FC<UploadNoteProps> = ({ onUploadSuccess, onCancel, className = '' }) => {
  const [formData, setFormData] = useState<Partial<NoteUploadData>>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    semester: '',
    quarter: '',
    topic: '',
    isPublic: true,
    tags: []
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { uploadNote, loading, error } = useNote();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const completeFormData: NoteUploadData = {
      title: formData.title || '',
      description: formData.description || '',
      subject: formData.subject || '',
      grade: formData.grade || '',
      semester: formData.semester || '',
      quarter: formData.quarter || '',
      topic: formData.topic || '',
      isPublic: formData.isPublic !== undefined ? formData.isPublic : true,
      tags: formData.tags || [],
      file: file,
    };

    const uploadedNote = await uploadNote(completeFormData);
    if (uploadedNote && onUploadSuccess) {
      onUploadSuccess(uploadedNote);
      // Reset form
      setFormData({
        title: '',
        description: '',
        subject: '',
        grade: '',
        semester: '',
        quarter: '',
        topic: '',
        isPublic: true,
        tags: []
      });
      setFile(null);
      setPreview(null);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-6">Upload New Note</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              <option value="Biology">Biology</option>
              <option value="Business Mathematics">Business Mathematics</option>
              {/* Add other subjects from subjectColors in NoteCard.tsx */}
            </select>
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Grade</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Semester</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>

          <div>
            <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-1">
              Quarter
            </label>
            <select
              id="quarter"
              name="quarter"
              value={formData.quarter}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Quarter</option>
              <option value="Quarter 1">Quarter 1</option>
              <option value="Quarter 2">Quarter 2</option>
              <option value="Quarter 3">Quarter 3</option>
              <option value="Quarter 4">Quarter 4</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic
          </label>
          <input
            id="topic"
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            name="tags"
            value={formData.tags?.join(', ')}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
            Make this note public
          </label>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            File (PDF, DOC, DOCX, PNG, JPG)
          </label>
          <input
            id="file"
            type="file"
            name="file"
            onChange={handleFileChange}
            required
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          {preview && file && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">File selected: {file.name}</p>
              {file.type.startsWith('image/') && (
                <img src={preview} alt="Preview" className="mt-2 max-h-40 rounded" />
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded text-white font-medium ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Uploading...' : 'Upload Note'}
            </button>
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-2 px-4 rounded text-gray-700 font-medium bg-gray-200 hover:bg-gray-300"
                >
                    Cancel
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default UploadNote; 