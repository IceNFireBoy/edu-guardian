# Frontend API Migration Guide

## Important API Endpoint Change

We've standardized our backend API routes to use the `/api/v1/` prefix to follow RESTful API best practices.

## Required Updates

### 1. Update All API URLs

You need to update all fetch calls in the frontend code:

```javascript
// ❌ OLD ENDPOINTS (no longer working):
fetch('/api/notes')
fetch('/api/notes/filter')
fetch('/api/upload')
fetch('/api/logActivity')
fetch('/api/login')
fetch('/api/signup')

// ✅ NEW ENDPOINTS:
fetch('/api/v1/notes')
fetch('/api/v1/notes') // with query parameters for filtering
fetch('/api/v1/notes') // POST for upload
fetch('/api/v1/users/me/activity') // for logging activity
fetch('/api/v1/auth/login')
fetch('/api/v1/auth/register')
```

### 2. Common API Endpoints

Here are the most commonly used endpoints and their new paths:

| Feature | Old Endpoint | New Endpoint |
|---------|-------------|--------------|
| Get all notes | `/api/notes` | `/api/v1/notes` |
| Filter notes | `/api/notes/filter` | `/api/v1/notes` with query params |
| Get single note | `/api/notes/:id` | `/api/v1/notes/:id` |
| Create note | `/api/notes` (POST) | `/api/v1/notes` (POST) |
| Rate note | `/api/notes/:id/rate` | `/api/v1/notes/:id/ratings` |
| Login | `/api/login` | `/api/v1/auth/login` |
| Signup | `/api/signup` | `/api/v1/auth/register` |
| Upload file | `/api/upload` | Use Cloudinary direct upload |
| Log activity | `/api/logActivity` | `/api/v1/users/me/activity` |

### 3. Example Code Updates

#### Before:
```javascript
// Old way to fetch notes
const fetchNotes = async () => {
  try {
    const response = await fetch('/api/notes');
    const data = await response.json();
    setNotes(data);
  } catch (error) {
    console.error('Error fetching notes:', error);
  }
};

// Old way to filter notes
const filterNotes = async (filters) => {
  try {
    const response = await fetch(`/api/notes/filter?${new URLSearchParams(filters)}`);
    const data = await response.json();
    setNotes(data.notes);
  } catch (error) {
    console.error('Error filtering notes:', error);
  }
};
```

#### After:
```javascript
// New way to fetch notes
const fetchNotes = async () => {
  try {
    const response = await fetch('/api/v1/notes');
    const data = await response.json();
    setNotes(data.data); // Note: data is now nested under data.data
  } catch (error) {
    console.error('Error fetching notes:', error);
  }
};

// New way to filter notes
const filterNotes = async (filters) => {
  try {
    const response = await fetch(`/api/v1/notes?${new URLSearchParams(filters)}`);
    const data = await response.json();
    setNotes(data.data); // Note: data is now nested under data.data
  } catch (error) {
    console.error('Error filtering notes:', error);
  }
};
```

### 4. Authentication Changes

The new API includes JWT authentication. For protected routes, you need to include the token in the request headers:

```javascript
const fetchMyNotes = async () => {
  try {
    const response = await fetch('/api/v1/notes/my-notes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setMyNotes(data.data);
  } catch (error) {
    console.error('Error fetching my notes:', error);
  }
};
```

### 5. Response Format Changes

The new API returns data in a standardized format:

```javascript
// Old response format
{
  notes: [...]
}

// New response format
{
  success: true,
  count: 5,
  pagination: { ... },
  data: [...]
}
```

Make sure to update how you access the data in your components.

## Need Help?

If you encounter any issues during migration, please refer to the API documentation in the backend README.md file or contact the development team. 