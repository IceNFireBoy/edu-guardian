# EduGuardian Frontend

## Overview
This is the frontend for the EduGuardian project, built with React, TypeScript, Tailwind CSS, Vite, and Framer Motion.

## Stack
- **Framework/Library:** React 18+
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **API Communication:** Axios (via `apiClient.ts`)
- **State Management:** React Context API (potentially with custom hooks for feature-specific state)

## Features
- **Authentication**: Login and registration with JWT token management
- **Notes Management**: Upload, view, and study notes
- **Progress Tracking**: Track study progress and achievements
- **Badges**: Earn badges for completing tasks
- **Dark Mode**: Toggle between light and dark themes

## Project Structure

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── api/                    # API client setup (apiClient.ts)
│   ├── app/                    # Global app setup (App.tsx, main.tsx, routing)
│   ├── assets/                 # Images, fonts, etc.
│   ├── components/             # Shared UI components (e.g., Button, Modal, Layout)
│   │   └── common/             # General-purpose components
│   │   └── layout/             # Layout components (Navbar, Footer, Sidebar)
│   ├── config/                 # Application-level configuration (e.g., theme, constants)
│   ├── contexts/               # React context providers (e.g., AuthContext, ThemeContext)
│   ├── features/               # Feature-based modules (preferred structure)
│   │   ├── auth/               # Authentication related files
│   │   │   ├── components/     # Login, Register forms
│   │   │   ├── useAuth.ts      # Auth hook
│   │   │   └── authTypes.ts    # TypeScript types for auth
│   │   ├── notes/              # Notes related files
│   │   │   ├── components/     # Components for displaying/managing notes
│   │   │   ├── useNote.ts      # Notes hook
│   │   │   └── noteTypes.ts    # TypeScript types for notes
│   │   └── user/               # User profile, settings related files
│   │       ├── components/
│   │       ├── useUser.ts
│   │       └── userTypes.ts
│   ├── hooks/                  # Common reusable hooks (e.g., useDebounce, useLocalStorage)
│   ├── pages/                  # Top-level page components (routed components)
│   ├── services/               # External service integrations (if any, beyond apiClient)
│   ├── styles/                 # Global styles, Tailwind base, theme overrides
│   ├── types/                  # Global TypeScript types/interfaces
│   └── utils/                  # Utility functions
├── .env.example                # Example environment variables
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Environment Variables

Create a `.env` file in the `frontend/` root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your specific configurations:

- `VITE_API_BASE_URL`: The base URL for the backend API (e.g., `http://localhost:5001/api/v1` or your production API URL).
- `VITE_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name for file uploads.
- `VITE_CLOUDINARY_UPLOAD_PRESET`: Your Cloudinary upload preset.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Authentication
The authentication feature is implemented using TypeScript and React Context. It includes:
- Login and registration forms
- JWT token management
- Protected routes
- User state management

## TypeScript
The project is gradually migrating to TypeScript. The authentication feature is fully typed, with interfaces for User, LoginCredentials, RegisterCredentials, and TokenPayload.

## Contributing
Please follow the coding standards and commit guidelines in the project documentation. 