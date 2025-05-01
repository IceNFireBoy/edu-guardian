// API client for notes
import { debug } from '../components/DebugPanel';

const API_BASE = import.meta.env.VITE_API_URL || '';
debug(`Using API base URL: ${API_BASE || '(none - using relative URL)'}`);

// Fetch notes with optional filters
export async function fetchNotes(filters = {}) {
  const query = new URLSearchParams();
  
  // Add non-empty filters to query string
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  
  const queryString = query.toString();
  const url = `${API_BASE}/api/v1/notes${queryString ? `?${queryString}` : ''}`;
  
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
    
    return data;
  } catch (err) {
    debug("[Frontend] Error fetching notes:", err.message);
    
    // Enhanced error logging
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      debug("[Frontend] Network error - check if the backend is running and accessible");
      debug("[Frontend] API_BASE:", API_BASE);
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
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!uploadPreset) {
      debug("[Frontend] WARNING: Cloudinary upload preset not configured!");
    }
    
    formData.append("upload_preset", uploadPreset);
    
    // Check if cloud name is configured
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      debug("[Frontend] WARNING: Cloudinary cloud name not configured!");
      throw new Error("Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME in .env");
    }
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
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
      fileUrl: fileUrl,
      // Additional fields from Cloudinary response
      fileType: file.type.split('/')[1] || 'unknown',
      fileSize: file.size,
      publicId: cloudData.public_id,
      assetId: cloudData.asset_id,
      tags: cloudData.tags || []
    };
    
    debug("[Frontend] Sending note data to backend: " + JSON.stringify(noteData));
    
    // Make sure API_BASE is defined
    if (!API_BASE) {
      debug("[Frontend] WARNING: API_BASE URL is not defined. Check your .env file!");
    }
    
    const backendRes = await fetch(`${API_BASE}/api/v1/notes`, {
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