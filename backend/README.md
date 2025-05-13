# EDUguardian Backend

Backend API for the EDUguardian academic note-sharing platform, built with Node.js, Express, MongoDB, and TypeScript.

## Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Language:** TypeScript
- **Authentication:** JWT (JSON Web Tokens)
- **File Handling:** Cloudinary (via frontend direct uploads, backend cleanup script)

## Project Structure

```
backend/
├── config/                 # Configuration files (db.ts, environment specific .env files)
├── coverage/               # Test coverage reports
├── dist/                   # Compiled TypeScript output (usually .gitignore'd)
├── node_modules/           # Project dependencies
├── public/                 # Static assets served by Express
├── src/
│   ├── __tests__/          # Unit and integration tests
│   ├── controllers/        # Request handlers, interact with services
│   ├── middleware/         # Express middleware (auth, error handling, logging)
│   ├── models/             # Mongoose schemas and models
│   ├── routes/             # API route definitions
│   ├── scripts/            # Utility scripts (e.g., cleanup, one-off tasks)
│   ├── seeder/             # Database seeding scripts and data
│   ├── services/           # Business logic, interact with models and external services
│   ├── types/              # Custom TypeScript type definitions
│   ├── utils/              # Utility functions (e.g., errorResponse, sendEmail)
│   ├── index.ts            # Main entry point, connects DB, starts server via server.ts
│   └── server.ts           # Express app configuration and server listen logic
├── .env.example            # Example environment variables (should be in root or config/)
├── .eslintignore
├── .eslintrc.js
├── .gitignore
├── .prettierrc.json
├── nodemon.json
├── package-lock.json
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1.  **Environment Variables:**
    Create a `.env` file in the `config/` directory (e.g., `config/config.env` for production/default, `config/config.dev.env` for development). You can copy from `.env.example` if one exists in the root or `config/` folder.

    Example for `config/config.dev.env`:
    ```env
    NODE_ENV=development
    PORT=5001

    # MongoDB Atlas connection string or local MongoDB URI
    MONGO_URI=mongodb://127.0.0.1:27017/eduguardian_dev

    # JWT settings
    JWT_SECRET=your_super_secret_jwt_key_for_dev
    JWT_EXPIRE=30d
    JWT_COOKIE_EXPIRE=30 # in days

    # Cloudinary Configuration (Primarily for backend scripts like cleanup)
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    # Email Configuration (Nodemailer with Mailtrap/SMTP)
    SMTP_HOST=your_smtp_host
    SMTP_PORT=your_smtp_port
    SMTP_USER=your_smtp_user
    SMTP_PASS=your_smtp_password
    FROM_EMAIL=Your App Name <noreply@yourapp.com>
    FROM_NAME=Your App Name
    ```
    *Ensure `MONGO_URI` points to your MongoDB instance.*
    *The `index.ts` file determines which .env file to load based on `NODE_ENV`.*

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Server:**
    ```bash
    # Development mode with nodemon (uses config.dev.env by default if NODE_ENV is not set otherwise)
    npm run dev

    # Production mode (uses config.env by default if NODE_ENV=production)
    npm start

    # Build TypeScript (compiles to dist/ folder)
    npm run build
    ```

## Database Schema

For a detailed outline of the database collections, fields, types, and relationships, please refer to the [docs/schema.md](docs/schema.md) file.

Key collections include: `User`, `Note`, `Badge`.

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Authentication (`/auth`)
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user 
- `GET /api/v1/auth/profile` - Get authenticated user profile (protected)

### Users (`/users`)
- `GET /api/v1/users` - Get all users (admin)
- `GET /api/v1/users/:id` - Get single user (admin)
- `POST /api/v1/users` - Create user (admin)
- `PUT /api/v1/users/:id` - Update user (admin)
- `DELETE /api/v1/users/:id` - Delete user (admin)
- `GET /api/v1/users/me` - Get profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/me/progress` - Get user progress
- `PUT /api/v1/users/me/subjects` - Update subject progress
- `GET /api/v1/users/me/badges` - Get user badges
- `POST /api/v1/users/me/badges` - Add badge to user
- `GET /api/v1/users/me/activity` - Get user activity
- `GET /api/v1/users/leaderboard` - Get user leaderboard

### Notes (`/notes`)
- `GET /api/v1/notes` - Get all notes
- `GET /api/v1/notes/:id` - Get single note
- `POST /api/v1/notes` - Create new note
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note
- `GET /api/v1/notes/my-notes` - Get user's notes
- `GET /api/v1/notes/user/:userId` - Get notes by user
- `GET /api/v1/notes/top-rated` - Get top rated notes
- `GET /api/v1/notes/subject/:subject` - Get notes by subject
- `GET /api/v1/notes/search` - Search notes
- `POST /api/v1/notes/:id/ratings` - Rate note
- `PUT /api/v1/notes/:id/download` - Increment download count
- `POST /api/v1/notes/:id/flashcards` - Add flashcards to note

### Badges (`/badges`)
- `GET /api/v1/badges` - Get all badges
- `GET /api/v1/badges/:id` - Get single badge
- `POST /api/v1/badges` - Create new badge (admin)
- `PUT /api/v1/badges/:id` - Update badge (admin)
- `DELETE /api/v1/badges/:id` - Delete badge (admin)
- `GET /api/v1/badges/category/:category` - Get badges by category
- `GET /api/v1/badges/rarity/:rarity` - Get badges by rarity

### Admin (`/admin`)
*Details for admin routes to be added here.*

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

If Swagger/OpenAPI documentation is integrated (e.g., via `swagger-ui-express` and `swagger-jsdoc`), it might be available at an endpoint like `/api-docs` when running the server. (This setup is not confirmed in the current README).

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
# Make sure your .env file (e.g., config/config.dev.env) is configured

# Import all data (uses logic in src/seeder.ts)
npm run seed -- --import

# Destroy all data (uses logic in src/seeder.ts)
npm run seed -- --delete

# Seed specific models (Example, if seeder.ts supports it)
# npm run seed -- --import --model=users
# npm run seed -- --delete --model=notes
```
*Note: The exact commands for the seeder might vary based on `package.json` scripts and `seeder.ts` implementation. The `-- --import` syntax passes arguments to the script.*

## API Routes Overview (Detailed)

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user & get token
- `GET /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/updatedetails` - Update user details
- `PUT /api/v1/auth/updatepassword` - Update password
- `POST /api/v1/auth/forgotpassword` - Request password reset
- `PUT /api/v1/auth/resetpassword/:resettoken` - Reset password
- `GET /api/v1/auth/verify-email/:verificationtoken` - Verify email

### Users
- `GET /api/v1/users` - Get all users (admin)
- `GET /api/v1/users/:id` - Get single user (admin)
- `POST /api/v1/users` - Create user (admin)
- `PUT /api/v1/users/:id` - Update user (admin)
- `DELETE /api/v1/users/:id` - Delete user (admin)
- `GET /api/v1/users/me` - Get profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/me/progress` - Get user progress
- `PUT /api/v1/users/me/subjects` - Update subject progress
- `GET /api/v1/users/me/badges` - Get user badges
- `POST /api/v1/users/me/badges` - Add badge to user
- `GET /api/v1/users/me/activity` - Get user activity
- `GET /api/v1/users/leaderboard` - Get user leaderboard

### Notes
- `GET /api/v1/notes` - Get all notes
- `GET /api/v1/notes/:id` - Get single note
- `POST /api/v1/notes` - Create new note
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note
- `GET /api/v1/notes/my-notes` - Get user's notes
- `GET /api/v1/notes/user/:userId` - Get notes by user
- `GET /api/v1/notes/top-rated` - Get top rated notes
- `GET /api/v1/notes/subject/:subject` - Get notes by subject
- `GET /api/v1/notes/search` - Search notes
- `POST /api/v1/notes/:id/ratings` - Rate note
- `PUT /api/v1/notes/:id/download` - Increment download count
- `POST /api/v1/notes/:id/flashcards` - Add flashcards to note

### Badges
- `GET /api/v1/badges` - Get all badges
- `GET /api/v1/badges/:id` - Get single badge
- `POST /api/v1/badges` - Create new badge (admin)
- `PUT /api/v1/badges/:id` - Update badge (admin)
- `DELETE /api/v1/badges/:id` - Delete badge (admin)
- `GET /api/v1/badges/category/:category` - Get badges by category
- `GET /api/v1/badges/rarity/:rarity` - Get badges by rarity 