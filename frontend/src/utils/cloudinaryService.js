/**
 * Cloudinary Service for uploading and fetching notes
 */

// Cloudinary configuration
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a file to Cloudinary with metadata tags
 * 
 * @param {File} file - The file to upload
 * @param {Object} metadata - Metadata for the file, like grade, subject, etc.
 * @returns {Promise<Object>} Upload response from Cloudinary
 */
export const uploadNote = async (file, metadata) => {
  if (!file) {
    throw new Error('File is required');
  }
  
  if (!CLOUD_NAME || !API_KEY || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing. Check environment variables.');
  }
  
  try {
    // Create a FormData instance
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('api_key', API_KEY);
    
    // Add relevant tags for filtering
    const tags = [];
    
    if (metadata.grade) {
      tags.push(`grade_${metadata.grade}`);
    }
    
    if (metadata.semester) {
      tags.push(`sem_${metadata.semester}`);
    }
    
    if (metadata.quarter) {
      tags.push(`quarter_${metadata.quarter}`);
    }
    
    if (metadata.subject) {
      tags.push(`subject_${metadata.subject.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    if (metadata.topic) {
      tags.push(`topic_${metadata.topic.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    // Add custom public_id if specified
    if (metadata.title) {
      const safeTitle = metadata.title.toLowerCase().replace(/\s+/g, '_');
      formData.append('public_id', `notes/${safeTitle}`);
    }
    
    // Add tags as comma-separated string
    formData.append('tags', tags.join(','));
    
    // Add any additional context metadata
    const context = {
      caption: metadata.title || 'Untitled Note',
      alt: metadata.description || ''
    };
    
    formData.append('context', JSON.stringify(context));
    
    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed: ' + response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Fetches notes from Cloudinary based on context
 * 
 * @param {Object} context - Filter criteria like grade, semester, subject, etc.
 * @returns {Promise<Array>} Matching notes
 */
export const fetchNotesByContext = async (context = {}) => {
  if (!CLOUD_NAME || !API_KEY) {
    throw new Error('Cloudinary configuration missing. Check environment variables.');
  }
  
  try {
    // Construct tags for filtering
    const tags = [];
    
    if (context.grade) {
      tags.push(`grade_${context.grade}`);
    }
    
    if (context.semester) {
      tags.push(`sem_${context.semester}`);
    }
    
    if (context.quarter) {
      tags.push(`quarter_${context.quarter}`);
    }
    
    if (context.subject) {
      tags.push(`subject_${context.subject.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    if (context.topic) {
      tags.push(`topic_${context.topic.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    // Create a search expression
    const expression = tags.length > 0 
      ? `tags=${tags.join(' AND tags=')}`
      : 'resource_type=image';
    
    // Search URL
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search?expression=${encodeURIComponent(expression)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notes: ' + response.statusText);
    }
    
    const data = await response.json();
    return data.resources || [];
  } catch (error) {
    console.error('Error fetching notes from Cloudinary:', error);
    throw error;
  }
};

// Export default object with methods
export default {
  uploadNote,
  fetchNotesByContext
};