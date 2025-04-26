// API client for notes
import { debug } from '../components/DebugPanel';

const API_BASE = import.meta.env.VITE_API_URL || '';
debug(`Using API base URL: ${API_BASE ? API_BASE : '(none - using relative URL)'}`);

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
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server responded with ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    debug(`[Frontend] Successfully retrieved ${Array.isArray(data) ? data.length : 0} notes`);
    return data;
  } catch (err) {
    debug("[Frontend] Error fetching notes: " + err.message);
    throw err; // Let caller handle showing error message
  }
}

// Upload a note to Cloudinary and save metadata to backend
export async function uploadNote(file, metadata) {
  try {
    // 1. Upload file to Cloudinary
    debug("[Frontend] Starting upload to Cloudinary...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    
    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
      { method: "POST", body: formData }
    );
    
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
      fileUrl: fileUrl
    };
    
    debug("[Frontend] Sending note data to backend: " + JSON.stringify(noteData));
    const backendRes = await fetch(`${API_BASE}/api/v1/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData)
    });
    
    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      throw new Error(`Backend save failed: ${errorText}`);
    }
    
    const savedNote = await backendRes.json();
    debug("[Frontend] Note successfully saved to backend with ID: " + (savedNote._id || "unknown"));
    return savedNote;
  } catch (err) {
    debug("[Frontend] Error in upload process: " + err.message);
    throw err; // Let caller handle showing error message
  }
} 