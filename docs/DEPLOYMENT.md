# EduGuardian Deployment Guide

This guide provides instructions for deploying the EduGuardian application on Render (backend) and Netlify (frontend).

## Prerequisites

Before deploying, ensure you have:

1. A GitHub repository with your EduGuardian code
2. Accounts on [Render](https://render.com/) and [Netlify](https://www.netlify.com/)
3. A MongoDB Atlas database (or other MongoDB provider)
4. Cloudinary account for media storage
5. (Optional) OpenAI API key for AI features

## Backend Deployment (Render)

### Option 1: Using the render.yaml Blueprint

1. In your Render dashboard, click "New" and select "Blueprint"
2. Connect your GitHub repository
3. Render will automatically detect the `render.yaml` file and configure the service

### Option 2: Manual Setup

1. In your Render dashboard, click "New" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: edu-guardian-backend
   - **Environment**: Node
   - **Region**: Choose the closest to your target users
   - **Branch**: main (or your production branch)
   - **Root Directory**: backend
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or select according to your needs)

4. Add environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000 (Render will use its own PORT, but this is a fallback)
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `JWT_EXPIRE`: 30d
   - `JWT_COOKIE_EXPIRE`: 30
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `OPENAI_API_KEY`: (Optional) Your OpenAI API key

5. Click "Create Web Service"

## Frontend Deployment (Netlify)

1. In your Netlify dashboard, click "New site from Git"
2. Connect your GitHub repository
3. Configure the build settings:
   - **Base directory**: frontend
   - **Build command**: `npm run build`
   - **Publish directory**: frontend/dist
   
4. Add environment variables:
   - `VITE_API_URL`: Your Render backend URL (e.g., https://edu-guardian-backend.onrender.com)

5. Configure build settings in a netlify.toml file inside the frontend directory:
   ```toml
   [build]
     base = "frontend"
     publish = "dist"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

6. Click "Deploy site"

## Post-Deployment Steps

### Configure CORS on Backend

Ensure the backend's CORS configuration allows requests from your Netlify domain.

```typescript
// In backend/src/server.ts or app.ts
app.use(cors({
  origin: ['https://your-netlify-domain.netlify.app', 'http://localhost:5173'],
  credentials: true
}));
```

### Update Frontend API URL

Make sure the frontend is pointing to your deployed backend:

```typescript
// In frontend/src/config/api.ts or similar
export const API_URL = import.meta.env.VITE_API_URL || 'https://edu-guardian-backend.onrender.com';
```

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Verify the MongoDB URI and ensure IP access is allowed from Render
- **Module Import Errors**: Check that all dependencies are properly installed and imported
- **Controller Class Export Issues**: Ensure controllers are properly exported as classes, not instances:
  ```typescript
  // Correct way to export controllers
  export default class NoteController {
    // methods
  }
  
  // Incorrect way 
  class NoteController {
    // methods
  }
  export default new NoteController();
  ```
- **Missing Middleware**: If you encounter errors about missing middleware like `asyncHandler`, ensure the file exists and is correctly exported.

### Frontend Issues

- **API Connectivity**: Verify the API URL environment variable is set correctly
- **Asset Loading**: Ensure all assets have proper paths (consider using import for assets)
- **Build Errors**: Look at the Netlify build logs for detailed error information
- **JSX in .ts Files**: Ensure files containing JSX have the `.tsx` extension, not `.ts`
- **Missing Hooks**: If you encounter errors about missing hooks like `useAuth` or `usePDFNote`, ensure these files exist and are correctly exported.

## CI/CD Integration

For continuous deployment:

1. Set up GitHub Actions for automated testing
2. Configure Render and Netlify for auto-deployment on commits to main branch
3. Use environment-specific variables for staging and production environments 