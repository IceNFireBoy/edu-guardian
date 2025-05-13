
# EduGuardian_Project_Context.md

**Vision:** EduGuardian is an education-tech platform built with React, Node.js/Express, MongoDB, and Cloudinary. Its mission is to help students by providing personalized learning resources, AI-driven tutoring features, and progress analytics. The codebase follows a full-stack JavaScript stack: the frontend is a SPA in React (using custom components and hooks), and the backend is a RESTful API with Express and MongoDB as the database. Cloudinary is used for media (profile photos, etc.). 

**Stack & Structure:** The project is organized by feature modules. Key frontend modules include Auth, Dashboard, Courses, Profiles, etc., each containing React components, styles, and tests. The backend is structured with separate directories: controllers/ (handling HTTP requests), services/ (business logic), models/ (Mongoose schemas), routes/, middleware/, and utils/. Environment-specific settings (DB URI, API keys) are stored in .env files (not committed). The app uses JWT for authentication, with protected routes requiring valid tokens. 

**Main Features:**
User Authentication: Sign-up/login with JWT tokens. Passwords hashed.
Course Management: Create and manage courses. Students can enroll in courses.
AI Tutoring (Future): The system will incorporate AI to offer quiz generation and personalized study tips (see AI Features doc).
Media Upload: Users can upload avatars or course images; files are stored via Cloudinary.
Analytics Dashboard: Students and teachers see progress charts and reports.

**Roadmap:** Future work includes migrating to TypeScript, improving the component library, and adding new AI-driven features like chatbot assistance and content recommendations (detailed in EduGuardian_Todo_AI_Features.md). We also plan to optimize performance (e.g. caching hot resources) and strengthen security (rate limiting, penetration testing). This context helps all team members and new hires understand the project’s goals and architecture.

