import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { callAuthenticatedApi, ApiResponse } from '../api/notes';
import toast from 'react-hot-toast';

// --- Interfaces & Types ---

interface Flashcard {
  _id: string; // Ensure unique ID for each card
  question: string;
  answer: string;
  // Add any other relevant fields like difficulty, tags etc.
}

interface CardResponse {
  status: 'correct' | 'incorrect';
  lastReviewed: number; // Timestamp
  interval?: number; // Spaced repetition interval in days (optional)
}

interface FlashcardState {
  flashcards: Flashcard[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  showGenerationButton: boolean;
  cardResponses: { [cardId: string]: CardResponse };
  isShuffled: boolean;
  originalOrder: Flashcard[];
}

interface GenerateFlashcardsResponse extends ApiResponse {
    flashcards?: { question: string; answer: string }[]; // Type from API before processing
    message?: string;
}

// Action Types Enum (more type-safe)
enum ActionType {
  FETCH_START = 'FETCH_START',
  FETCH_SUCCESS = 'FETCH_SUCCESS',
  FETCH_ERROR = 'FETCH_ERROR',
  NO_CARDS_GENERATED = 'NO_CARDS_GENERATED',
  SET_CURRENT_CARD_INDEX = 'SET_CURRENT_CARD_INDEX',
  RECORD_RESPONSE = 'RECORD_RESPONSE',
  SHUFFLE_CARDS = 'SHUFFLE_CARDS',
  UNSHUFFLE_CARDS = 'UNSHUFFLE_CARDS',
  RESET_STATE = 'RESET_STATE',
  HIDE_GENERATION_BUTTON = 'HIDE_GENERATION_BUTTON',
  SHOW_GENERATION_BUTTON = 'SHOW_GENERATION_BUTTON',
}

// Type for reducer actions
type Action = 
  | { type: ActionType.FETCH_START }
  | { type: ActionType.FETCH_SUCCESS; payload: Flashcard[] }
  | { type: ActionType.FETCH_ERROR; payload: string }
  | { type: ActionType.NO_CARDS_GENERATED }
  | { type: ActionType.SET_CURRENT_CARD_INDEX; payload: number }
  | { type: ActionType.RECORD_RESPONSE; payload: { status: 'correct' | 'incorrect' } }
  | { type: ActionType.SHUFFLE_CARDS }
  | { type: ActionType.UNSHUFFLE_CARDS }
  | { type: ActionType.RESET_STATE }
  | { type: ActionType.HIDE_GENERATION_BUTTON }
  | { type: ActionType.SHOW_GENERATION_BUTTON };

// Context Value Type
interface FlashcardContextValue {
  flashcards: Flashcard[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  showGenerationButton: boolean;
  generateFlashcards: (noteId: string) => Promise<void>;
  saveFlashcards: () => Promise<void>;
  nextCard: () => void;
  previousCard: () => void;
  shuffleCards: () => void;
  isShuffled: boolean;
  toggleShowGenerationButton: () => void;
}

// --- Initial State & Reducer ---

const initialState: FlashcardState = {
  flashcards: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  showGenerationButton: true,
  cardResponses: {},
  isShuffled: false,
  originalOrder: [],
};

const FlashcardContext = createContext<FlashcardContextValue | undefined>(undefined);

function flashcardReducer(state: FlashcardState, action: Action): FlashcardState {
  switch (action.type) {
    case ActionType.FETCH_START:
      return { ...state, isLoading: true, error: null, showGenerationButton: false };
    case ActionType.FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        flashcards: action.payload,
        originalOrder: action.payload,
        currentIndex: 0,
        cardResponses: {}, 
        isShuffled: false,
        showGenerationButton: action.payload.length === 0, 
      };
    case ActionType.NO_CARDS_GENERATED:
        return {
            ...state,
            isLoading: false,
            flashcards: [],
            originalOrder: [],
            currentIndex: 0,
            cardResponses: {},
            isShuffled: false,
            showGenerationButton: true, 
        };
    case ActionType.FETCH_ERROR:
      return { ...state, isLoading: false, error: action.payload, showGenerationButton: true };
    case ActionType.SET_CURRENT_CARD_INDEX:
      // Ensure index stays within bounds
      const newIndex = Math.max(0, Math.min(action.payload, state.flashcards.length - 1));
      return { ...state, currentIndex: newIndex };
    case ActionType.RECORD_RESPONSE:
      const currentCard = state.flashcards[state.currentIndex];
      if (!currentCard) return state; // Should not happen if index is valid
      const cardId = currentCard._id; 
      return {
        ...state,
        cardResponses: {
          ...state.cardResponses,
          [cardId]: { 
            status: action.payload.status,
            lastReviewed: Date.now(), 
          },
        },
      };
    case ActionType.SHUFFLE_CARDS:
      if (state.originalOrder.length <= 1) return state; // No need to shuffle 0 or 1 card
      const shuffled = [...state.originalOrder].sort(() => Math.random() - 0.5);
      return {
        ...state,
        flashcards: shuffled,
        currentIndex: 0,
        isShuffled: true,
      };
    case ActionType.UNSHUFFLE_CARDS:
      return {
        ...state,
        flashcards: state.originalOrder,
        currentIndex: 0,
        isShuffled: false,
      };
    case ActionType.HIDE_GENERATION_BUTTON:
      return { ...state, showGenerationButton: false };
    case ActionType.SHOW_GENERATION_BUTTON:
      return { ...state, showGenerationButton: true };
    case ActionType.RESET_STATE:
        return initialState;
    default:
      // Ensure exhaustive check with `never` type if needed
      // const _: never = action;
      return state;
  }
}

// --- Provider Component ---

interface FlashcardProviderProps {
  children: ReactNode;
  noteId: string; // Make noteId required
}

export const FlashcardProvider: React.FC<FlashcardProviderProps> = ({ children, noteId }) => {
  const [state, dispatch] = useReducer(flashcardReducer, initialState);

  const generateFlashcards = useCallback(async () => {
    if (!noteId) {
        dispatch({ type: ActionType.FETCH_ERROR, payload: 'Note ID is missing.' });
        toast('Cannot generate flashcards without a Note ID.');
        return;
    }
    dispatch({ type: ActionType.FETCH_START });
    try {
      const data = await callAuthenticatedApi<GenerateFlashcardsResponse>(
        `/api/v1/notes/${noteId}/generate-flashcards`, 
        'POST'
      );

      if (data.success && data.flashcards) {
        if (data.flashcards.length > 0) {
           // Add a unique _id to each card for keying and response tracking
          const processedFlashcards: Flashcard[] = data.flashcards.map((card: Flashcard, index: number) => ({
             ...card,
             _id: `card-${noteId}-${index}-${Date.now()}` // Generate a more robust unique ID
            }));
          dispatch({ type: ActionType.FETCH_SUCCESS, payload: processedFlashcards });
          toast(data.message || 'Flashcards generated successfully!');
        } else {
            // Success true, but flashcards array is empty
            dispatch({ type: ActionType.NO_CARDS_GENERATED });
            toast(data.message || 'No flashcards generated. The content might not be suitable.');
        }
      } else {
        // Handle API error or unexpected success response format
        throw new Error(data.error || data.message || 'Flashcard data not found or API error.');
      }
    } catch (err: any) {
      console.error("Error generating flashcards:", err);
      const errorMessage = err.message || 'Failed to generate flashcards.';
      dispatch({ type: ActionType.FETCH_ERROR, payload: errorMessage });
      toast(errorMessage);
    }
  }, [noteId]);

  const nextCard = () => {
    if (state.flashcards.length === 0) return;
    dispatch({ type: ActionType.SET_CURRENT_CARD_INDEX, payload: (state.currentIndex + 1) % state.flashcards.length });
  };

  const previousCard = () => {
    if (state.flashcards.length === 0) return;
    dispatch({ 
        type: ActionType.SET_CURRENT_CARD_INDEX, 
        payload: (state.currentIndex - 1 + state.flashcards.length) % state.flashcards.length 
    });
  };

  const recordResponse = (status: 'correct' | 'incorrect') => {
    dispatch({ type: ActionType.RECORD_RESPONSE, payload: { status } });
  };

  const shuffleCards = () => {
    if (state.flashcards.length > 1) {
        dispatch({ type: ActionType.SHUFFLE_CARDS });
        toast('Flashcards shuffled!');
    } else {
        toast('Not enough cards to shuffle.');
    }
  };
  
  const unshuffleCards = () => {
    if (state.isShuffled) {
        dispatch({ type: ActionType.UNSHUFFLE_CARDS });
        toast('Flashcards returned to original order.');
    } else {
        toast('Flashcards are already in order.');
    }
  };

  const resetFlashcardState = useCallback(() => {
    dispatch({ type: ActionType.RESET_STATE });
    toast('Flashcard state reset.');
  }, []);

  const value: FlashcardContextValue = {
    flashcards: state.flashcards,
    currentIndex: state.currentIndex,
    isLoading: state.isLoading,
    error: state.error,
    showGenerationButton: state.showGenerationButton,
    generateFlashcards,
    saveFlashcards: () => Promise.resolve(),
    nextCard,
    previousCard,
    shuffleCards,
    isShuffled: state.isShuffled,
    toggleShowGenerationButton: () => dispatch({ type: ActionType.SHOW_GENERATION_BUTTON }),
  };

  return <FlashcardContext.Provider value={value}>{children}</FlashcardContext.Provider>;
};

// --- Custom Hook ---

export const useFlashcards = (): FlashcardContextValue => {
  const context = useContext(FlashcardContext);
  if (context === undefined) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
}; 