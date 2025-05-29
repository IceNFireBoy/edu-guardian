import React, { useState, ChangeEvent, FormEvent } from 'react';
import type { NoteUploadData } from '../../types/note';

interface SimpleUploadNoteProps {
  onSubmit: (data: NoteUploadData) => void;
}

export const SimpleUploadNote: React.FC<SimpleUploadNoteProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<NoteUploadData>>({
    title: '',
    description: '',
    content: '',
    tags: [],
    isPublic: false
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<NoteUploadData>) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: Partial<NoteUploadData>) => ({
      ...prev,
      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
    }));
  };

  const handlePublicChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: Partial<NoteUploadData>) => ({ ...prev, isPublic: e.target.checked }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.content) {
      const completeFormData: NoteUploadData = {
        title: formData.title,
        description: formData.description || '',
        content: formData.content,
        fileUrl: '', // This will be set by the backend
        isPublic: formData.isPublic || false,
        tags: formData.tags || []
      };
      onSubmit(completeFormData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={6}
          required
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          value={formData.tags?.join(', ')}
          onChange={handleTagsChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={handlePublicChange}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
          Make this note public
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Upload Note
      </button>
    </form>
  );
}; 