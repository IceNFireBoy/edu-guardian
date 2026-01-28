# EduGuardian - Educational Platform

[![Test Coverage](https://codecov.io/gh/yourusername/edu-guardian/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/edu-guardian)
[![CI Status](https://github.com/yourusername/edu-guardian/workflows/Test%20%26%20Coverage/badge.svg)](https://github.com/yourusername/edu-guardian/actions)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=yourusername_edu-guardian&metric=alert_status)](https://sonarcloud.io/dashboard?id=yourusername_edu-guardian)

EduGuardian is a comprehensive educational platform that provides a modern and interactive learning experience. The platform is built using a full-stack architecture with a React frontend and a Node.js/Express backend.

## Features

- **User Authentication**
  - Secure login and registration system
  - Role-based access control (Students, Teachers, Administrators)
  - JWT-based authentication

- **Course Management**
  - Create and manage courses
  - Upload and organize course materials
  - Track student progress
  - Interactive learning modules

- **Interactive Learning**
  - Real-time progress tracking
  - Interactive quizzes and assessments
  - Discussion forums
  - File sharing capabilities

- **Modern UI/UX**
  - Responsive design
  - Dark/Light mode support
  - Intuitive navigation
  - Real-time updates

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- React Router
- Axios for API calls
- React Query for state management

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Socket.IO for real-time features

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

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

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     PORT=5000
     MONGODB_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     ```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
edu-guardian/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
│
└── backend/              # Node.js backend application
    ├── src/
    │   ├── controllers/  # Route controllers
    │   ├── models/      # Database models
    │   ├── routes/      # API routes
    │   └── utils/       # Utility functions
    └── config/          # Configuration files
```

## API Documentation

The backend API provides the following main endpoints:

- `/api/auth` - Authentication endpoints
- `/api/courses` - Course management
- `/api/users` - User management
- `/api/progress` - Learning progress tracking

For detailed API documentation, refer to the API documentation in the backend directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@eduguardian.com or open an issue in the repository.

## 🔒 Security Features

- Helmet for security headers
- XSS protection
- Rate limiting
- MongoDB sanitization
- Input validation

## 🏗️ Project Structure

```
edu_guardian_full_stack_REBUILT/
├── frontend/           # React frontend application
│   ├── src/           # Source files
│   ├── public/        # Static assets
│   └── tests/         # Frontend tests
├── backend/           # Express backend application
│   ├── src/          # Source files
│   └── tests/        # Backend tests
├── scripts/          # Utility scripts
└── docs/            # Project documentation
```
