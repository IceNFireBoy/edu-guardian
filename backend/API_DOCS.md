# EDUguardian API Documentation

## Base URL
```
http://localhost:5001/api/v1
```

## Authentication

### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "user"
  }
}
```

### Login User
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "user"
  }
}
```

### Get Current User
```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "user"
  }
}
```

### Logout User
```
GET /auth/logout
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

## Notes API

### Get All Notes
```
GET /notes
```

**Query Parameters:**
- `grade` - Filter by grade
- `subject` - Filter by subject
- `semester` - Filter by semester
- `quarter` - Filter by quarter
- `topic` - Filter by topic

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "note_id_1",
      "title": "Math Notes",
      "subject": "Mathematics",
      "grade": "12th",
      "fileUrl": "http://example.com/notes/math.pdf",
      "viewCount": 10,
      "downloadCount": 5,
      "averageRating": 4.5
    },
    {
      "_id": "note_id_2",
      "title": "History Notes",
      "subject": "History",
      "grade": "11th",
      "fileUrl": "http://example.com/notes/history.pdf",
      "viewCount": 8,
      "downloadCount": 3,
      "averageRating": 4.0
    }
  ]
}
```

### Get Single Note
```
GET /notes/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "note_id_1",
    "title": "Math Notes",
    "subject": "Mathematics",
    "grade": "12th",
    "semester": "Fall",
    "quarter": "Q1",
    "topic": "Calculus",
    "fileUrl": "http://example.com/notes/math.pdf",
    "description": "Comprehensive calculus notes",
    "fileType": "pdf",
    "fileSize": 2048,
    "tags": ["calculus", "math", "derivatives"],
    "viewCount": 10,
    "downloadCount": 5,
    "ratings": [
      {
        "user": "user_id_1",
        "value": 5
      },
      {
        "user": "user_id_2",
        "value": 4
      }
    ],
    "averageRating": 4.5,
    "flashcards": [
      {
        "question": "What is a derivative?",
        "answer": "The derivative of a function represents its rate of change."
      }
    ],
    "user": "user_id",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Create Note (requires authentication)
```
POST /notes
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "title": "Biology Notes",
  "subject": "Biology",
  "grade": "10th",
  "semester": "Spring",
  "quarter": "Q3",
  "topic": "Cell Biology",
  "fileUrl": "http://example.com/notes/biology.pdf",
  "description": "Notes on cell structure and function",
  "fileType": "pdf",
  "fileSize": 1536,
  "tags": ["biology", "cells", "organelles"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_note_id",
    "title": "Biology Notes",
    "subject": "Biology",
    "grade": "10th",
    "semester": "Spring",
    "quarter": "Q3",
    "topic": "Cell Biology",
    "fileUrl": "http://example.com/notes/biology.pdf",
    "description": "Notes on cell structure and function",
    "fileType": "pdf",
    "fileSize": 1536,
    "tags": ["biology", "cells", "organelles"],
    "viewCount": 0,
    "downloadCount": 0,
    "ratings": [],
    "averageRating": 0,
    "flashcards": [],
    "user": "user_id",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update Note (requires authentication)
```
PUT /notes/:id
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "title": "Updated Biology Notes",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "note_id",
    "title": "Updated Biology Notes",
    "description": "Updated description",
    "subject": "Biology",
    "grade": "10th",
    "semester": "Spring",
    "quarter": "Q3",
    "topic": "Cell Biology",
    "fileUrl": "http://example.com/notes/biology.pdf"
  }
}
```

### Delete Note (requires authentication)
```
DELETE /notes/:id
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Upload Note File (requires authentication)
```
POST /notes/upload
```

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [FILE]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileName": "note_user_id_1234567890.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024,
    "fileUrl": "http://localhost:5001/uploads/note_user_id_1234567890.pdf"
  }
}
```

### Rate Note (requires authentication)
```
POST /notes/:id/ratings
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "note_id",
    "title": "Biology Notes",
    "averageRating": 5,
    "ratings": [
      {
        "user": "user_id",
        "value": 5
      }
    ]
  }
}
```

### Download Note (requires authentication)
```
PUT /notes/:id/download
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "note_id",
    "title": "Biology Notes",
    "downloadCount": 6
  }
}
```

### Add Flashcards (requires authentication)
```
POST /notes/:id/flashcards
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "flashcards": [
    {
      "question": "What is a mitochondrion?",
      "answer": "The powerhouse of the cell."
    },
    {
      "question": "What is the nucleus?",
      "answer": "The control center of the cell that contains DNA."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "note_id",
    "title": "Biology Notes",
    "flashcards": [
      {
        "question": "What is a mitochondrion?",
        "answer": "The powerhouse of the cell."
      },
      {
        "question": "What is the nucleus?",
        "answer": "The control center of the cell that contains DNA."
      }
    ]
  }
}
```

### Get My Notes (requires authentication)
```
GET /notes/my-notes
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "note_id",
      "title": "Biology Notes",
      "subject": "Biology",
      "grade": "10th",
      "fileUrl": "http://example.com/notes/biology.pdf",
      "viewCount": 10,
      "downloadCount": 6,
      "averageRating": 4.5
    }
  ]
}
```

## User API

### Get User Profile (requires authentication)
```
GET /users/profile
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "profileImage": "no-photo.jpg",
    "biography": "Computer science student",
    "preferences": {
      "darkMode": true,
      "emailNotifications": true
    },
    "xp": 120,
    "level": 2,
    "currentStreak": 3,
    "longestStreak": 5,
    "stats": {
      "notesCount": 5
    }
  }
}
```

### Update User Profile (requires authentication)
```
PUT /users/profile
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "name": "John Smith",
  "biography": "Updated biography",
  "preferences": {
    "darkMode": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Smith",
    "email": "john@example.com",
    "username": "johndoe",
    "biography": "Updated biography",
    "preferences": {
      "darkMode": false,
      "emailNotifications": true
    }
  }
}
```

### Get User Badges (requires authentication)
```
GET /users/badges
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "badge": {
        "_id": "badge_id_1",
        "name": "First Upload",
        "description": "Upload your first note",
        "icon": "📚",
        "rarity": "common"
      },
      "earnedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "badge": {
        "_id": "badge_id_2",
        "name": "Super Contributor",
        "description": "Upload 10 notes",
        "icon": "🌟",
        "rarity": "rare"
      },
      "earnedAt": "2023-01-15T00:00:00.000Z"
    }
  ]
}
```

### Get Streak (requires authentication)
```
GET /users/streak
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStreak": 3,
    "longestStreak": 5,
    "lastActive": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update Streak (requires authentication)
```
PUT /users/streak
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStreak": 4,
    "longestStreak": 5,
    "lastActive": "2023-01-02T00:00:00.000Z"
  }
}
```

### Get Leaderboard
```
GET /users/leaderboard
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "user_id_1",
      "name": "John Doe",
      "username": "johndoe",
      "profileImage": "profile1.jpg",
      "xp": 500,
      "level": 6,
      "badgeCount": 8,
      "streak": 7
    },
    {
      "_id": "user_id_2",
      "name": "Jane Smith",
      "username": "janesmith",
      "profileImage": "profile2.jpg",
      "xp": 450,
      "level": 5,
      "badgeCount": 6,
      "streak": 3
    },
    {
      "_id": "user_id_3",
      "name": "Bob Johnson",
      "username": "bjohnson",
      "profileImage": "profile3.jpg",
      "xp": 380,
      "level": 4,
      "badgeCount": 5,
      "streak": 2
    }
  ]
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error 