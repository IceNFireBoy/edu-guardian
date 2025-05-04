// API client for notes
import { debug } from '../components/DebugPanel';

// Get API base from environment or use a relative URL
const API_BASE = import.meta.env.VITE_API_URL || '';
debug(`Using API base URL: ${API_BASE || '(none - using relative URL)'}`);

// Add a backup API endpoint for Netlify deployment if env variable is missing
const getApiUrl = () => {
  // If API_BASE is defined, use it
  if (API_BASE) return API_BASE;
  
  // In production on Netlify, use a relative URL
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    debug('[Frontend] Using relative API URL for production');
    return '';
  }
  
  // In development, fallback to localhost
  debug('[Frontend] Using localhost API URL for development');
  return 'http://localhost:5000';
};

// Fetch notes with optional filters
export async function fetchNotes(filters = {}) {
  const query = new URLSearchParams();
  
  // Add non-empty filters to query string
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  
  const queryString = query.toString();
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/api/v1/notes${queryString ? `?${queryString}` : ''}`;
  
  try {
    debug("[Frontend] Fetching notes from API: " + url);
    debug("[Frontend] Using filters:", filters);
    
    const res = await fetch(url);
    const contentType = res.headers.get("content-type");
    
    // Check if response is JSON
    if (!contentType || !contentType.includes("application/json")) {
      debug("[Frontend] Received non-JSON response:", await res.text());
      throw new Error("Server returned non-JSON response");
    }
    
    const data = await res.json();
    debug("[Frontend] Raw API response:", data);
    
    // Check for API-level success flag
    if (!data.success) {
      debug("[Frontend] API returned success: false");
      throw new Error(data.error || "API request failed");
    }
    
    // Validate response structure
    if (!Array.isArray(data.data)) {
      debug("[Frontend] API returned invalid data structure:", data);
      throw new Error("Invalid response format from server");
    }
    
    debug(`[Frontend] Successfully retrieved ${data.data.length} notes`);
    
    // Log a sample note for debugging
    if (data.data.length > 0) {
      debug("[Frontend] Sample note:", {
        _id: data.data[0]._id,
        title: data.data[0].title,
        subject: data.data[0].subject
      });
    }
    
    // Store notes in localStorage for offline use
    try {
      localStorage.setItem('notes', JSON.stringify(data.data));
      debug('[Frontend] Notes cached in localStorage');
    } catch (err) {
      debug('[Frontend] Failed to cache notes in localStorage', err);
    }
    
    return data;
  } catch (err) {
    debug("[Frontend] Error fetching notes:", err.message);
    
    // Enhanced error logging
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      debug("[Frontend] Network error - check if the backend is running and accessible");
      debug("[Frontend] API URL:", apiUrl);
      
      // Try to load from localStorage as fallback
      try {
        const cachedNotes = localStorage.getItem('notes');
        if (cachedNotes) {
          const parsedNotes = JSON.parse(cachedNotes);
          debug('[Frontend] Loaded notes from localStorage cache:', parsedNotes.length);
          return {
            success: true,
            data: parsedNotes,
            count: parsedNotes.length,
            fromCache: true
          };
        }
      } catch (cacheErr) {
        debug('[Frontend] Failed to load notes from cache', cacheErr);
      }
    }
    
    throw new Error(`Failed to fetch notes: ${err.message}`);
  }
}

// Upload a note to Cloudinary and save metadata to backend
export async function uploadNote(file, metadata) {
  try {
    // 1. Upload file to Cloudinary
    debug("[Frontend] Starting upload to Cloudinary...");
    const formData = new FormData();
    formData.append("file", file);
    
    // Check if upload preset is configured
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'edu_guardian';
    if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
      debug("[Frontend] WARNING: Using default upload preset. Set VITE_CLOUDINARY_UPLOAD_PRESET in your environment.");
    }
    
    formData.append("upload_preset", uploadPreset);
    
    // Check if cloud name is configured
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dbnk6q2k6';
    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
      debug("[Frontend] WARNING: Using default cloud name. Set VITE_CLOUDINARY_CLOUD_NAME in your environment.");
    }
    
    // FIX: Use /raw/upload for PDFs and other non-images
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
    debug("[Frontend] Uploading to Cloudinary URL: " + cloudinaryUrl);
    
    const cloudRes = await fetch(cloudinaryUrl, { 
      method: "POST", 
      body: formData 
    });
    
    if (!cloudRes.ok) {
      const errorText = await cloudRes.text();
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }
    
    const cloudData = await cloudRes.json();
    const fileUrl = cloudData.secure_url;
    debug("[Frontend] Uploaded to Cloudinary. Secure URL: " + fileUrl);
    
    // 2. Send note metadata to backend
    const noteData = {
      title: metadata.title,
      subject: metadata.subject,
      grade: metadata.grade,
      semester: metadata.semester,
      quarter: metadata.quarter,
      topic: metadata.topic,
      description: metadata.description,
      fileUrl: fileUrl,
      // Additional fields from Cloudinary response
      fileType: file.type.split('/')[1] || 'unknown',
      fileSize: file.size,
      publicId: cloudData.public_id,
      assetId: cloudData.asset_id,
      tags: cloudData.tags || []
    };
    
    debug("[Frontend] Sending note data to backend: " + JSON.stringify(noteData));
    
    // Use the getApiUrl function for consistency
    const apiUrl = getApiUrl();
    
    const backendRes = await fetch(`${apiUrl}/api/v1/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData)
    });
    
    let responseData;
    // Try to parse response as JSON, but handle text response as well
    const contentType = backendRes.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await backendRes.json();
    } else {
      const textResponse = await backendRes.text();
      debug("[Frontend] Received non-JSON response: " + textResponse);
      responseData = { success: false, error: textResponse };
    }
    
    if (!backendRes.ok) {
      throw new Error(`Backend save failed: ${responseData.error || responseData.message || "Unknown error"}`);
    }
    
    debug("[Frontend] Note successfully saved to backend with ID: " + 
          (responseData.data && responseData.data._id ? responseData.data._id : "unknown"));
    
    return responseData.data || responseData;
  } catch (err) {
    debug("[Frontend] Error in upload process: " + err.message);
    throw err; // Let caller handle showing error message
  }
} 