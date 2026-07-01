import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Strip Framer Motion animation timing so clicks/state are synchronous.
vi.mock('framer-motion', () => {
  const R = require('react');
  const passthrough =
    (tag: string) =>
    ({ children, initial, animate, exit, transition, whileHover, whileTap, layout, ...rest }: any) =>
      R.createElement(tag, rest, children);
  return {
    AnimatePresence: ({ children }: any) => R.createElement(R.Fragment, null, children),
    motion: new Proxy({}, { get: (_t, prop: string) => passthrough(prop) }),
  };
});

import { NoteFlashcards } from './NoteFlashcards';

const cards = [
  { question: 'What is 2+2?', answer: '4' },
  { question: 'What is 3x3?', answer: '9' },
];

describe('NoteFlashcards', () => {
  it('renders each card question', () => {
    render(<NoteFlashcards cards={cards} />);
    expect(screen.getByText('Flashcards')).toBeInTheDocument();
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('What is 3x3?')).toBeInTheDocument();
  });

  it('flips a card to reveal the answer, then back', () => {
    render(<NoteFlashcards cards={cards} />);
    const firstCard = screen.getByText('What is 2+2?');
    fireEvent.click(firstCard);
    expect(screen.getByText('4')).toBeInTheDocument();
    fireEvent.click(screen.getByText('4'));
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('shows an empty state when there are no cards', () => {
    render(<NoteFlashcards cards={[]} />);
    expect(screen.getByText('No flashcards available')).toBeInTheDocument();
  });
});
