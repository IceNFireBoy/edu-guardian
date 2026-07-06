import { describe, it, expect } from 'vitest';
import { parseFlashcards } from './parseFlashcards';

describe('parseFlashcards', () => {
  it('parses an Anki "Notes in Plain Text" export (tabs, # headers, HTML, cloze)', () => {
    const anki = [
      '#separator:tab',
      '#html:true',
      '#deck:Biology',
      'What is a <b>cell</b>?\tThe basic unit of life<br>Discovered by Hooke',
      'The powerhouse of the cell is {{c1::the mitochondrion}}\tSee chapter 3 [sound:mito.mp3]',
    ].join('\n');

    const cards = parseFlashcards(anki);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toEqual({
      question: 'What is a cell?',
      answer: 'The basic unit of life Discovered by Hooke',
    });
    expect(cards[1].question).toBe('The powerhouse of the cell is the mitochondrion');
    expect(cards[1].answer).toBe('See chapter 3');
  });

  it('parses quoted CSV as produced by AI chatbots, skipping a header row', () => {
    const csv = [
      'Front,Back',
      '"What is DNA?","The molecule carrying genetic instructions"',
      '"Who proposed evolution, by natural selection?","Charles Darwin"',
    ].join('\n');

    const cards = parseFlashcards(csv);
    expect(cards).toHaveLength(2);
    expect(cards[1]).toEqual({
      question: 'Who proposed evolution, by natural selection?',
      answer: 'Charles Darwin',
    });
  });

  it('parses pipe lines and Q/A blocks', () => {
    expect(parseFlashcards('What is 2+2? | 4\nWhat is 3x3? | 9')).toHaveLength(2);

    const qa = 'Q: What is gravity?\nA: A force of attraction between masses.\nQ: Unit of force?\nA: The newton.';
    const cards = parseFlashcards(qa);
    expect(cards).toHaveLength(2);
    expect(cards[0].question).toBe('What is gravity?');
    expect(cards[1].answer).toBe('The newton.');
  });

  it('parses markdown tables and ignores the separator row', () => {
    const md = ['| Question | Answer |', '| --- | --- |', '| What is H2O? | Water |'].join('\n');
    const cards = parseFlashcards(md);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual({ question: 'What is H2O?', answer: 'Water' });
  });

  it('returns empty for junk input instead of throwing', () => {
    expect(parseFlashcards('')).toEqual([]);
    expect(parseFlashcards('just a plain sentence with no structure')).toEqual([]);
  });
});
