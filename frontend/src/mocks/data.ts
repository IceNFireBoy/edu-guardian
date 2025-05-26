import { Note, NoteRating, Flashcard } from '../types/note';

export const mockNotes = [
  {
    _id: 'note1',
    title: 'Introduction to Biology',
    slug: 'introduction-to-biology',
    description: 'Basic concepts of biology',
    fileUrl: 'https://example.com/biology.pdf',
    fileType: 'pdf',
    fileSize: 1024,
    subject: 'Biology',
    grade: '11',
    semester: '1',
    quarter: '1',
    topic: 'Cell Structure',
    tags: ['biology', 'cells'],
    viewCount: 100,
    downloadCount: 50,
    ratings: [
      {
        _id: 'rating1',
        value: 5,
        user: 'user1',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    averageRating: 5,
    flashcards: [
      {
        _id: 'flashcard1',
        question: 'What is a cell?',
        answer: 'The basic unit of life',
        difficulty: 'easy',
        noteId: 'note1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    user: 'user1',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: 'note2',
    title: 'Advanced Mathematics',
    slug: 'advanced-mathematics',
    description: 'Complex mathematical concepts',
    fileUrl: 'https://example.com/math.pdf',
    fileType: 'pdf',
    fileSize: 2048,
    subject: 'Mathematics',
    grade: '12',
    semester: '2',
    quarter: '3',
    topic: 'Calculus',
    tags: ['math', 'calculus'],
    viewCount: 200,
    downloadCount: 100,
    ratings: [
      {
        _id: 'rating2',
        value: 4,
        user: 'user2',
        createdAt: '2024-01-02T00:00:00.000Z'
      }
    ],
    averageRating: 4,
    flashcards: [
      {
        _id: 'flashcard2',
        question: 'What is a derivative?',
        answer: 'The rate of change of a function',
        difficulty: 'medium',
        noteId: 'note2',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      }
    ],
    user: 'user2',
    isPublic: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
];

export const mockUsers = [
  {
    _id: 'user1',
    username: 'john_doe',
    email: 'john@example.com',
    role: 'user',
    xp: 1000,
    level: 5,
    streak: {
      current: 3,
      max: 7,
      lastUsed: '2024-01-01T00:00:00.000Z'
    },
    aiUsage: {
      summaryUsed: 2,
      flashcardUsed: 3,
      lastReset: '2024-01-01T00:00:00.000Z'
    },
    badges: [
      {
        _id: 'badge1',
        name: 'Quick Learner',
        level: 'Bronze',
        xpReward: 100
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: 'user2',
    username: 'jane_smith',
    email: 'jane@example.com',
    role: 'user',
    xp: 2000,
    level: 8,
    streak: {
      current: 5,
      max: 10,
      lastUsed: '2024-01-02T00:00:00.000Z'
    },
    aiUsage: {
      summaryUsed: 4,
      flashcardUsed: 6,
      lastReset: '2024-01-01T00:00:00.000Z'
    },
    badges: [
      {
        _id: 'badge2',
        name: 'Knowledge Seeker',
        level: 'Silver',
        xpReward: 200
      }
    ],
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
];

export const mockBadges = [
  {
    _id: 'badge1',
    name: 'Quick Learner',
    description: 'Complete 5 study sessions in one day',
    level: 'Bronze',
    xpReward: 100,
    requirements: {
      studySessionsInDay: 5
    },
    icon: '🎯',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: 'badge2',
    name: 'Knowledge Seeker',
    description: 'View 50 different notes',
    level: 'Silver',
    xpReward: 200,
    requirements: {
      notesViewed: 50
    },
    icon: '📚',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
]; 