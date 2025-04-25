import { debug } from '../components/DebugPanel';

/**
 * Cloudinary Service for uploading and fetching notes
 */

// Cloudinary configuration
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Uploads a file to Cloudinary with metadata tags and then saves to backend
 * 
 * @param {File} file - The file to upload
 * @param {Object} metadata - Metadata for the file, like grade, subject, etc.
 * @returns {Promise<Object>} Upload response from Cloudinary
 */
export const uploadNote = async (file, metadata) => {
  if (!file) {
    throw new Error('File is required');
  }
  
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    debug('[Frontend] Cloudinary configuration missing. Check environment variables.');
    throw new Error('Cloudinary configuration missing. Check environment variables.');
  }
  
  try {
    // Step 1: Upload to Cloudinary
    debug('[Frontend] Starting Cloudinary upload process for file: ' + file.name);
    
    // Create a FormData instance for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
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
    debug('[Frontend] Sending file to Cloudinary API...');
    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!cloudinaryResponse.ok) {
      debug('[Frontend] Cloudinary upload failed: ' + cloudinaryResponse.statusText);
      throw new Error('Cloudinary upload failed: ' + cloudinaryResponse.statusText);
    }
    
    const cloudinaryData = await cloudinaryResponse.json();
    debug('[Frontend] Cloudinary upload successful. Secure URL: ' + cloudinaryData.secure_url);
    
    // Step 2: Save to backend
    if (BACKEND_URL) {
      debug('[Frontend] Sending note metadata to backend API...');
      try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/v1/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: metadata.title,
            description: metadata.description || '',
            subject: metadata.subject,
            grade: metadata.grade,
            semester: metadata.semester,
            quarter: metadata.quarter,
            topic: metadata.topic,
            fileUrl: cloudinaryData.secure_url,
            fileType: file.type.split('/')[1] || 'unknown',
            publicId: cloudinaryData.public_id,
            assetId: cloudinaryData.asset_id,
            tags: tags
          })
        });
        
        if (!backendResponse.ok) {
          debug('[Frontend] Backend save failed: ' + backendResponse.statusText);
          console.error('Backend save failed but Cloudinary upload was successful');
          // We'll still return the Cloudinary data even if backend save fails
          return cloudinaryData;
        }
        
        const backendData = await backendResponse.json();
        debug('[Frontend] Backend save successful with ID: ' + backendData._id);
        
        // Return combined data
        return {
          ...cloudinaryData,
          _id: backendData._id // Add MongoDB ID
        };
      } catch (backendError) {
        debug('[Frontend] Backend save error: ' + backendError.message);
        console.error('Backend save error:', backendError);
        // Still return Cloudinary data even if backend fails
        return cloudinaryData;
      }
    } else {
      debug('[Frontend] No backend URL configured. Skipping backend save.');
      // No backend URL configured, just return Cloudinary data
      return cloudinaryData;
    }
  } catch (error) {
    debug('[Frontend] Error in upload process: ' + error.message);
    console.error('Error in upload process:', error);
    throw error;
  }
};

/**
 * Fetches notes from backend with filters or falls back to Cloudinary
 * 
 * @param {Object} context - Filter criteria like grade, semester, subject, etc.
 * @returns {Promise<Array>} Matching notes
 */
export const fetchNotesByContext = async (context = {}) => {
  try {
    // Log filter context
    debug('[Frontend] Fetching notes with filters: ' + JSON.stringify(context));
    
    // Try to fetch from backend first if available
    if (BACKEND_URL) {
      try {
        // Build query string from context object
        const queryParams = new URLSearchParams();
        Object.entries(context).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        
        const url = `${BACKEND_URL}/api/v1/notes?${queryParams.toString()}`;
        debug('[Frontend] Fetching notes from backend: ' + url);
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const notes = Array.isArray(data) ? data : (data.data || []);
          debug(`[Frontend] Successfully fetched ${notes.length} notes from backend`);
          return notes;
        }
        
        debug('[Frontend] Backend request failed, falling back to Cloudinary');
      } catch (backendError) {
        debug('[Frontend] Backend fetch error: ' + backendError.message);
        console.error('Backend fetch error, falling back to Cloudinary:', backendError);
        // Continue to Cloudinary fallback below
      }
    }
    
    // Fallback to Cloudinary if backend fetch fails or is not configured
    if (!CLOUD_NAME || !API_KEY) {
      debug('[Frontend] Cloudinary configuration missing, using dummy data');
      console.warn('Cloudinary configuration missing, using dummy data');
      return getDummyNotes();
    }
    
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
      const sanitizedTopic = context.topic.toLowerCase().replace(/\s+/g, '_');
      tags.push(`topic_${sanitizedTopic}`);
    }
    
    // Create a search expression - if no tags, return all resources
    let expression;
    
    // Handle case with no filters - return all resources
    if (tags.length === 0) {
      expression = 'resource_type:image OR resource_type:raw';
    } else {
      // Join tags with AND operator for precise filtering
      expression = tags.map(tag => `tags:${tag}`).join(' AND ');
    }
    
    // Search URL with proper encoding
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search?expression=${encodeURIComponent(expression)}&max_results=100`;
    
    debug('[Frontend] Fetching notes from Cloudinary: ' + url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      debug('[Frontend] Failed to fetch notes from Cloudinary: ' + errorText);
      throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    const data = await response.json();
    const resources = data.resources || [];
    debug(`[Frontend] Successfully fetched ${resources.length} notes from Cloudinary`);
    
    // Process the response to ensure consistent results
    return resources;
  } catch (error) {
    debug('[Frontend] Error fetching notes: ' + error.message);
    console.error('Error fetching notes:', error);
    
    // Return empty array instead of throwing error for more graceful UI handling
    return [];
  }
};

/**
 * Mock function to get dummy notes when Cloudinary is not configured
 * This is useful for development and testing purposes
 */
export const getDummyNotes = () => {
  return [
    {
      asset_id: "dummy1",
      public_id: "notes/algebra_basics",
      format: "pdf",
      resource_type: "raw",
      secure_url: "https://via.placeholder.com/400x300?text=Algebra+Notes",
      tags: ["grade_11", "sem_1", "subject_mathematics", "topic_algebra"],
      context: {
        caption: "Algebra Fundamentals - Chapter 1",
        alt: "Complete notes covering basic algebraic operations and equations"
      }
    },
    {
      asset_id: "dummy2",
      public_id: "notes/cellular_biology",
      format: "jpg",
      resource_type: "image",
      secure_url: "https://via.placeholder.com/400x300?text=Biology+Notes",
      tags: ["grade_11", "sem_1", "subject_biology", "topic_cells"],
      context: {
        caption: "Cell Structure and Function",
        alt: "Detailed notes on cell organelles and their functions"
      }
    },
    {
      asset_id: "dummy3",
      public_id: "notes/world_war_2",
      format: "pdf",
      resource_type: "raw", 
      secure_url: "https://via.placeholder.com/400x300?text=History+Notes",
      tags: ["grade_12", "sem_2", "subject_history", "topic_world_war_2"],
      context: {
        caption: "World War II: Causes and Effects",
        alt: "Comprehensive study notes on WWII with timelines and key events"
      }
    }
  ];
};

// Export default object with methods
export default {
  uploadNote,
  fetchNotesByContext,
  getDummyNotes
};