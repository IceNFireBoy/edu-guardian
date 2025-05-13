
# EduGuardian_Todo_AI_Features.md

**Pending AI Features:**

- **Adaptive Quiz Generator:** Automatically generate quiz questions from course content using NLP. Expected behavior: The user selects a topic, and the system creates multiple-choice questions. Cursor Tasks: Develop a service that calls an AI API (e.g. OpenAI) with course material. Ensure safe prompts to produce valid JSON of questions and answers. Add endpoints like POST /ai/generate-quiz which returns questions.
- **Personalized Study Tips Bot:** Chat interface where students ask questions about their learning. Behavior: The assistant reviews the student’s progress and suggests next steps. Cursor Tasks: Implement a chatbot UI component and backend route (/ai/chatbot). Integrate a language model API, passing user context (e.g. performance data from DB) to generate responses. Train prompts to use educational tone.
- **Content Summarization:** Summarize long lectures or notes. Behavior: Given a long text (or URL), return a concise summary. Cursor Tasks: Add a feature in the UI to submit text for summary. Build a backend utility to call an LLM summarization endpoint. Ensure summarization includes key points and uses a consistent style.
- **Image Analysis for Diagrams:** Analyze uploaded diagrams for coursework. Behavior: Extract text from images using OCR or describe diagrams. Cursor Tasks: Use Cloudinary for uploads; after upload, send image to an OCR/AI service. Return extracted text or descriptions to the frontend.
- **Planned Integration Tasks:** Each feature needs AI prompt management. Document prompts and refine them over time: track them in TODO: comments or a dedicated prompt library. Cursor should be used to refactor code related to these features as they are developed.

These AI features will extend EduGuardian’s capabilities. As they evolve, developers should continually update this list and the codebase, ensuring prompts and instructions are clear. 

Expected Behavior: All AI endpoints should fail gracefully on errors and validate inputs. Maintain consistency: use the same REST conventions and error format as the rest of the API. AI tasks should log usage for auditing. When prompts are updated, commit them alongside code changes with clear notes.