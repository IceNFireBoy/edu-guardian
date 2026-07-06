/**
 * Parse flashcards out of the text formats people actually have:
 *
 * - Anki "Notes in Plain Text" (.txt) export: tab-separated, `#key:value`
 *   header lines, optional HTML in fields, cloze markup, [sound:...] tags.
 * - CSV (quoted or bare) — what ChatGPT / Claude / Gemini produce when asked
 *   for "flashcards as CSV" ("Front,Back" style), and Quizlet exports.
 * - `question | answer` lines (this app's original quick format).
 * - `Q: ... / A: ...` blocks (common AI chat output).
 * - Markdown tables (`| question | answer |`).
 *
 * Returns clean {question, answer} pairs; unparseable lines are skipped.
 */

export interface ParsedCard {
  question: string;
  answer: string;
}

const MAX_CARDS = 300;

/** Strip Anki/HTML noise a field may carry. */
const cleanField = (raw: string): string =>
  raw
    .replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, '$1') // cloze {{c1::text::hint}} -> text
    .replace(/\[sound:[^\]]*\]/g, '') // Anki audio tags
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '') // any other HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/""/g, '"') // CSV escaped quotes
    .replace(/\s+/g, ' ')
    .trim();

/** Split one CSV line respecting double quotes. */
const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
};

const isHeaderRow = (q: string, a: string): boolean => {
  const h = `${q} ${a}`.toLowerCase();
  return /^(front|question|term)\s+(back|answer|definition)$/.test(h.trim());
};

const pushCard = (out: ParsedCard[], q: string, a: string): void => {
  const question = cleanField(q);
  const answer = cleanField(a);
  if (question && answer && !isHeaderRow(question, answer) && out.length < MAX_CARDS) {
    out.push({ question, answer });
  }
};

export const parseFlashcards = (input: string): ParsedCard[] => {
  const text = (input || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];
  const out: ParsedCard[] = [];

  // --- Q:/A: block format (multiline answers supported) ---
  if (/^\s*Q[:.]/im.test(text) && /^\s*A[:.]/im.test(text)) {
    const blocks = text.split(/\n(?=\s*Q[:.])/i);
    for (const block of blocks) {
      const match = block.match(/^\s*Q[:.]\s*([\s\S]*?)^\s*A[:.]\s*([\s\S]*?)$/im);
      if (match) pushCard(out, match[1], match[2]);
    }
    if (out.length > 0) return out;
  }

  // --- Anki header-driven separator (e.g. "#separator:tab" / "#separator:Comma") ---
  let declaredSep: 'tab' | 'comma' | null = null;
  const sepHeader = text.match(/^#\s*separator:\s*(\S+)/im);
  if (sepHeader) {
    const s = sepHeader[1].toLowerCase();
    if (s.includes('tab')) declaredSep = 'tab';
    else if (s.includes('comma')) declaredSep = 'comma';
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue; // Anki metadata/comments

    // Markdown table row
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      if (cells.length >= 2 && !/^:?-{2,}:?$/.test(cells[0])) {
        pushCard(out, cells[0], cells[1]);
      }
      continue;
    }

    // Tab-separated (Anki default)
    if (declaredSep === 'tab' || (declaredSep === null && line.includes('\t'))) {
      const cells = line.split('\t');
      if (cells.length >= 2) pushCard(out, cells[0], cells[1]);
      continue;
    }

    // Pipe format
    if (line.includes('|')) {
      const parts = line.split(/\s*\|\s*/);
      if (parts.length >= 2) pushCard(out, parts[0], parts.slice(1).join(' '));
      continue;
    }

    // CSV (declared, or detected by a comma)
    if (declaredSep === 'comma' || line.includes(',')) {
      const cells = splitCsvLine(line);
      if (cells.length >= 2) pushCard(out, cells[0], cells.slice(1).join(', '));
      continue;
    }
  }

  return out;
};

export default parseFlashcards;
