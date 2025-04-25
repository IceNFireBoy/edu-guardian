# EduGuardian Backend API

> Backend API for EduGuardian, an academic dashboard with note sharing, gamification, and learning progress tracking features

## Features

- Authentication with JWT
- User profiles with gamification features (XP, levels, streaks)
- Badge system for achievements 
- Note uploads and sharing
- Note ratings and reviews
- Flashcard creation for uploaded notes
- User progress tracking
- Activity logging
- Full CRUD functionality for all resources
- Advanced filtering, sorting, and pagination
- Security features (encryption, sanitization, rate limiting, etc.)

## API Documentation

Extensive API documentation with examples available at `/api-docs` when running the server.

## Setup

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Rename `config/config.env.example` to `config/config.env` and update the values/settings to your own.

### Database Setup

This project uses MongoDB. Set your MongoDB URI in the config.env file.

### Run Application

```bash
# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Frontend Integration

### API Endpoint Updates

⚠️ **Important:** All frontend API calls must use the `/api/v1/` prefix:

```javascript
// INCORRECT - Old endpoint format
fetch('/api/notes')

// CORRECT - New endpoint format
fetch('/api/v1/notes')
```

Example of a correct API call:
```javascript
// Example: Fetching notes with filter
fetch('/api/v1/notes?subject=mathematics&grade=undergraduate')
  .then(response => response.json())
  .then(data => console.log(data));

// Example: Creating a note (with authentication)
fetch('/api/v1/notes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(noteData)
})
```

## Database Seeding

To seed the database with sample users, notes, and badges:

```bash
# Import all data
npm run seed

# Destroy all data
npm run seed:delete
```

## API Routes Overview

### Authentication
- POST /api/v1/auth/register - Register user
- POST /api/v1/auth/login - Login user & get token
- GET /api/v1/auth/logout - Logout user
- GET /api/v1/auth/me - Get current user
- PUT /api/v1/auth/updatedetails - Update user details
- PUT /api/v1/auth/updatepassword - Update password
- POST /api/v1/auth/forgotpassword - Request password reset
- PUT /api/v1/auth/resetpassword/:resettoken - Reset password
- GET /api/v1/auth/verify-email/:verificationtoken - Verify email

### Users
- GET /api/v1/users - Get all users (admin)
- GET /api/v1/users/:id - Get single user (admin)
- POST /api/v1/users - Create user (admin)
- PUT /api/v1/users/:id - Update user (admin)
- DELETE /api/v1/users/:id - Delete user (admin)
- GET /api/v1/users/me - Get profile
- PUT /api/v1/users/me - Update profile
- GET /api/v1/users/me/progress - Get user progress
- PUT /api/v1/users/me/subjects - Update subject progress
- GET /api/v1/users/me/badges - Get user badges
- POST /api/v1/users/me/badges - Add badge to user
- GET /api/v1/users/me/activity - Get user activity
- GET /api/v1/users/leaderboard - Get user leaderboard

### Notes
- GET /api/v1/notes - Get all notes
- GET /api/v1/notes/:id - Get single note
- POST /api/v1/notes - Create new note
- PUT /api/v1/notes/:id - Update note
- DELETE /api/v1/notes/:id - Delete note
- GET /api/v1/notes/my-notes - Get user's notes
- GET /api/v1/notes/user/:userId - Get notes by user
- GET /api/v1/notes/top-rated - Get top rated notes
- GET /api/v1/notes/subject/:subject - Get notes by subject
- GET /api/v1/notes/search - Search notes
- POST /api/v1/notes/:id/ratings - Rate note
- PUT /api/v1/notes/:id/download - Increment download count
- POST /api/v1/notes/:id/flashcards - Add flashcards to note

### Badges
- GET /api/v1/badges - Get all badges
- GET /api/v1/badges/:id - Get single badge
- POST /api/v1/badges - Create new badge (admin)
- PUT /api/v1/badges/:id - Update badge (admin)
- DELETE /api/v1/badges/:id - Delete badge (admin)
- GET /api/v1/badges/category/:category - Get badges by category
- GET /api/v1/badges/rarity/:rarity - Get badges by rarity 