import { renderHook, act, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { server } from '../../../mocks/server';
import { useNote } from '../useNote';
import { Note, NoteFilter, PaginatedNotesResponse, AISummary, Flashcard, AIGenerationResult, NewlyAwardedBadgeInfo, NoteUploadData } from '../noteTypes';

const mockNotes: Note[] = [
  {
    id: 'note1',
    title: 'Note 1',
    content: 'Content 1',
    fileUrl: '',
    fileType: 'pdf',
    subject: 'Math',
    grade: '10',
    semester: '1',
    quarter: 'Q1',
    topic: 'Algebra',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    downloadCount: 0,
    averageRating: 0,
    ratings: [],
    flashcards: [],
    user: { id: 'user1', username: 'user1', email: 'user1@example.com' }
  },
  {
    id: 'note2',
    title: 'Note 2',
    content: 'Content 2',
    fileUrl: '',
    fileType: 'pdf',
    subject: 'Science',
    grade: '10',
    semester: '1',
    quarter: 'Q1',
    topic: 'Biology',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    downloadCount: 0,
    averageRating: 0,
    ratings: [],
    flashcards: [],
    user: { id: 'user1', username: 'user1', email: 'user1@example.com' }
  }
];

const mockPaginatedResponse: PaginatedNotesResponse = {
  data: mockNotes,
  count: mockNotes.length,
  totalPages: 1,
  currentPage: 1,
};

const mockSingleNote: Note = mockNotes[0];

const mockNewlyAwardedBadge: NewlyAwardedBadgeInfo = {
    id: 'badge123',
    name: 'AI Genius',
    icon: 'genius.svg',
    description: 'Generated AI content',
    xpReward: 50,
    level: 'gold',
    category: 'ai',
    rarity: 'epic',
};

const mockAIGenerationResult: AIGenerationResult<AISummary> = {
    data: { 
        id: mockSingleNote.id,
        aiSummary: { content: 'Mock AI Summary', keyPoints: ['KP1', 'KP2'], generatedAt: new Date().toISOString(), modelUsed: 'gpt-test' }
    },
    newlyAwardedBadges: [mockNewlyAwardedBadge],
    userXPUpdate: { currentXP: 150, xpGained: 50, currentLevel: 2, levelUp: false },
    userStreakUpdate: { currentStreak: 5, maxStreak: 5, lastUsedAI: new Date().toISOString() }
};

const mockAIFlashcardsResult: AIGenerationResult<Flashcard[]> = {
    data: [
        { id: 'fc1', question: 'Q1', answer: 'A1', difficulty: 'easy' }
    ],
    newlyAwardedBadges: [mockNewlyAwardedBadge],
    userXPUpdate: { currentXP: 200, xpGained: 50, currentLevel: 3, levelUp: true },
    userStreakUpdate: { currentStreak: 6, maxStreak: 6, lastUsedAI: new Date().toISOString() }
};

const mockFullNote: Note = {
  id: '1',
  title: 'Test Note',
  content: 'Test Content',
  fileUrl: 'test.pdf',
  fileType: 'pdf',
  subject: 'Math',
  grade: '10',
  semester: '1',
  quarter: 'Q1',
  topic: 'Algebra',
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  viewCount: 0,
  downloadCount: 0,
  averageRating: 0,
  ratings: [],
  flashcards: [],
  user: { id: '1', username: 'testuser', email: 'test@example.com' }
};

const mockNoteData: NoteUploadData = {
  file: new File([''], 'test.pdf', { type: 'application/pdf' }),
  title: 'Test Note',
  subject: 'Test Subject',
  grade: 'Test Grade',
  semester: 'Test Semester',
  isPublic: true,
  content: 'Test content',
  tags: ['test']
};

describe('useNote Hook', () => {
  beforeEach(() => {
    server.resetHandlers();
    localStorage.clear(); // Clear localStorage for cache tests
  });

  describe('fetchNotes', () => {
    it('should fetch notes successfully', async () => {
      server.use(
        rest.get('/api/v1/notes', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('subject')).toBe('Math'); // Example filter check
          return {
            status: 200,
            body: JSON.stringify({ success: true, data: mockPaginatedResponse })
          };
        })
      );
      const { result } = renderHook(() => useNote());
      let notesData: PaginatedNotesResponse | undefined;
      await act(async () => {
        notesData = await result.current.fetchNotes({ subject: 'Math' });
      });
      expect(result.current.loading).toBe(false);
      expect(notesData?.data).toEqual(mockNotes);
      expect(notesData?.count).toBe(mockNotes.length);
    });

    it('should use cached notes if available and not expired', async () => {
        // Prime the cache
        const filter: NoteFilter = { subject: 'Science' };
        const cacheKey = `notes_cache_subject=Science`;
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: mockPaginatedResponse }));

        const apiSpy = jest.fn();
        server.use(rest.get('/api/v1/notes', apiSpy)); // Spy on API calls

        const { result } = renderHook(() => useNote());
        let notesData: PaginatedNotesResponse | undefined;
        await act(async () => {
            notesData = await result.current.fetchNotes(filter);
        });
        expect(apiSpy).not.toHaveBeenCalled(); // API should not be called
        expect(notesData).toEqual(mockPaginatedResponse);
    });

    it('should fetch from API if cache is expired', async () => {
        const filter: NoteFilter = { subject: 'History' };
        const cacheKey = `notes_cache_subject=History`;
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now() - 20 * 60 * 1000, data: mockPaginatedResponse })); // 20 mins ago (expired)

        server.use(
            rest.get('/api/v1/notes', () => ({
                status: 200,
                body: JSON.stringify({ success: true, data: { ...mockPaginatedResponse, data: [{...mockNotes[0], title: 'Fetched Note'}] } })
            }))
        );
        const { result } = renderHook(() => useNote());
        let notesData: PaginatedNotesResponse | undefined;
        await act(async () => {
            notesData = await result.current.fetchNotes(filter);
        });
        expect(notesData?.data[0].title).toBe('Fetched Note'); // Ensure it came from API mock
    });

    // TODO: Test fetchNotes error handling
  });

  describe('fetchNote (single)', () => {
    it('should fetch a single note successfully', async () => {
      server.use(
        rest.get(`/api/v1/notes/${mockSingleNote.id}`, () => {
          return {
            status: 200,
            body: JSON.stringify(mockSingleNote)
          };
        })
      );
      const { result } = renderHook(() => useNote());
      let noteData: Note | null = null;
      await act(async () => {
        noteData = await result.current.fetchNote(mockSingleNote.id);
      });
      expect(result.current.loading).toBe(false);
      expect(noteData).toEqual(mockSingleNote);
    });
    // TODO: Test fetchNote error handling
  });

  describe('AI Generation', () => {
    it('generateAISummary should call API and return summary and badge info', async () => {
      server.use(
        rest.post(`/api/v1/notes/${mockSingleNote.id}/summarize`, () => {
          return {
            status: 200,
            body: JSON.stringify(mockAIGenerationResult)
          };
        })
      );
      const { result } = renderHook(() => useNote());
      let summaryResult: AIGenerationResult<AISummary> | null = null;
      await act(async () => {
        summaryResult = await result.current.generateAISummary(mockSingleNote.id);
      });
      expect(result.current.loading).toBe(false);
      expect(summaryResult?.data.aiSummary?.content).toBe('Mock AI Summary');
      expect(summaryResult?.newlyAwardedBadges).toEqual([mockNewlyAwardedBadge]);
      expect(summaryResult?.userXPUpdate?.xpGained).toBe(50);
    });

    it('generateAIFlashcards should call API and return flashcards and badge info', async () => {
        server.use(
          rest.post(`/api/v1/notes/${mockSingleNote.id}/generate-flashcards`, () => {
            return {
              status: 200,
              body: JSON.stringify(mockAIFlashcardsResult)
            };
          })
        );
        const { result } = renderHook(() => useNote());
        let flashcardsResult: AIGenerationResult<Flashcard[]> | null = null;
        await act(async () => {
          flashcardsResult = await result.current.generateAIFlashcards(mockSingleNote.id);
        });
        expect(result.current.loading).toBe(false);
        expect(flashcardsResult?.data.length).toBe(1);
        expect(flashcardsResult?.data[0].question).toBe('Q1');
        expect(flashcardsResult?.newlyAwardedBadges).toEqual([mockNewlyAwardedBadge]);
        expect(flashcardsResult?.userXPUpdate?.currentLevel).toBe(3);
      });

    // TODO: Test AI generation error handling
    // TODO: Test saveAIGeneratedFlashcards
  });
  
  describe('uploadNote', () => {
    const mockFileData = { name: 'test.pdf', type: 'application/pdf', size: 1024 };
    const mockFile = new File(['test content'], mockFileData.name, { type: mockFileData.type });
    const noteMetadata = { title: 'Uploaded Note', subject: 'Uploads', grade:'12', semester:'1',quarter:'1',topic:'Cloud',isPublic:true };

    // Store original fetch
    const originalFetch = global.fetch;

    beforeEach(() => {
        // Mock global fetch for Cloudinary
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    secure_url: 'http://cloudinary.com/test.pdf',
                    public_id: 'public_id_test',
                    asset_id: 'asset_id_test',
                    format: 'pdf',
                    bytes: mockFile.size,
                    resource_type: 'raw' // or 'image' if testing images
                }),
                text: () => Promise.resolve('Uploaded') // for !ok case
            })
        ) as jest.Mock;
    });

    afterEach(() => {
        global.fetch = originalFetch; // Restore original fetch
    });

    it('should upload to Cloudinary and then save note to backend', async () => {
        const backendNoteResponse = { ...noteMetadata, id: 'newNoteId', user: { id: 'user123' }, fileUrl: 'http://cloudinary.com/test.pdf', fileSize: mockFile.size, fileType: 'pdf' };
        server.use(
            rest.post('/api/v1/notes', async ({request}) => {
                const body = await request.json() as any;
                expect(body.fileUrl).toBe('http://cloudinary.com/test.pdf');
                expect(body.title).toBe(noteMetadata.title);
                return {
                    status: 200,
                    body: JSON.stringify(backendNoteResponse)
                };
            })
        );

        const { result } = renderHook(() => useNote());
        let uploadedNote: Note | null = null;
        await act(async () => {
            uploadedNote = await result.current.uploadNote({ ...noteMetadata, file: mockFile });
        });

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api.cloudinary.com'), expect.any(Object));
        expect(result.current.loading).toBe(false);
        expect(uploadedNote).toBeDefined();
        expect(uploadedNote?.title).toBe(noteMetadata.title);
        expect(uploadedNote?.fileUrl).toBe('http://cloudinary.com/test.pdf');
    });

    // TODO: Test Cloudinary upload failure
    // TODO: Test backend save failure after successful Cloudinary upload
  });

  // TODO: Test updateNote
  // TODO: Test deleteNote
  // TODO: Test rateNote
  // TODO: Test incrementDownloadCount
  // TODO: Test addManualFlashcard
}); 