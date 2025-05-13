# EduGuardian 🎓✨

[![Test Coverage](https://codecov.io/gh/yourusername/edu-guardian/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/edu-guardian)
[![CI Status](https://github.com/IceNFireBoy/edu-guardian/workflows/Test%20%26%20Coverage/badge.svg)](https://github.com/IceNFireBoy/edu-guardian/actions)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=yourusername_edu-guardian&metric=alert_status)](https://sonarcloud.io/dashboard?id=yourusername_edu-guardian)

A full-stack, modular academic dashboard for students. EduGuardian provides a gamified, secure, and filterable educational web app for uploading, managing, and discovering academic notes.

## Features

- **Smart Note Filtering**: Filter notes by grade, semester, quarter, subject, and topic
- **File Uploads via Cloudinary**: Upload PDF documents and images as study materials
- **Anti-Cheating System**: Detect suspicious activities like tab switching and inspect tools
- **Productivity Gamification**: Earn XP and build streaks for consistent usage
- **Beautiful Responsive UI**: Clean, modern interface with light/dark mode

## Tech Stack

- **Frontend**: React.js (Vite) + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express
- **Storage**: Cloudinary
- **State Management**: localStorage + React state
- **Deployment**: GitHub → Netlify (frontend), Render (backend)

## Getting Started

### Prerequisites

- Node.js >= 14.x
- npm or yarn
- Cloudinary account (free tier works)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/edu-guardian.git
cd edu-guardian
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Create a `.env` file in the frontend directory based on `.env.example`:

```
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

4. Start the development server:

```bash
npm run dev
```

5. Setup Cloudinary:
   - Create a Cloudinary account at https://cloudinary.com
   - Create an upload preset in your Cloudinary dashboard (Settings > Upload)
   - Add the Cloud name, API Key, and Upload Preset to your `.env` file

## Project Structure

- `/components/` → Shared reusable UI components
- `/features/` → Feature-specific modules (notes, streaks, filters, upload)
- `/hooks/` → Custom React hooks like `useAntiCheating()`, `useStreak()`
- `/utils/` → External services like `cloudinaryService.js`, `streak.js`
- `/pages/` → Route-based screens

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Cloudinary](https://cloudinary.com/)
- [Vite](https://vitejs.dev/)