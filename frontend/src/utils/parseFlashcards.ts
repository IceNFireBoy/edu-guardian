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
 *
 * This runs on user-uploaded files, so every regex here must be linear —
 * no lazy dot-alls or unbounded backtracking (a crafted file could otherwise
 * freeze the tab).
 */

export interface ParsedCard {
  question: string;
  answer: string;
}

const MAX_CARDS = 300;

/** Strip Anki/HTML noise a field may carry. */
const cleanField = (raw: string): string =>
  raw
    // cloze {{c1::text::hint}} -> text; [^}] keeps the scan linear
    .replace(/\{\{c\d+::([^}]*)\}\}/g, (_m, inner: string) => inner.split('::')[0])
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

const Q_LINE = /^\s*Q[:.]\s*(.*)$/i;
const A_LINE = /^\s*A[:.]\s*(.*)$/i;

/**
 * `Q: ... / A: ...` blocks, multiline answers supported. A simple line scan
 * (instead of a multiline lazy regex) so pathological input stays O(n).
 */
const parseQABlocks = (text: string): ParsedCard[] => {
  const out: ParsedCard[] = [];
  let question: string[] | null = null;
  let answer: string[] | null = null;

  const flush = () => {
    if (question && answer) pushCard(out, question.join('\n'), answer.join('\n'));
    question = null;
    answer = null;
  };

  for (const line of text.split('\n')) {
    const qMatch = Q_LINE.exec(line);
    if (qMatch) {
      flush();
      question = [qMatch[1]];
      continue;
    }
    const aMatch = A_LINE.exec(line);
    if (aMatch && question) {
      answer = [aMatch[1]];
      continue;
    }
    if (answer) answer.push(line);
    else if (question) question.push(line);
  }
  flush();
  return out;
};

type DeclaredSeparator = 'tab' | 'comma' | null;

/** Anki header-driven separator (e.g. "#separator:tab" / "#separator:Comma"). */
const detectDeclaredSeparator = (text: string): DeclaredSeparator => {
  const header = /^#\s*separator:\s*(\S+)/im.exec(text);
  if (!header) return null;
  const s = header[1].toLowerCase();
  if (s.includes('tab')) return 'tab';
  if (s.includes('comma')) return 'comma';
  return null;
};

/** Markdown table row; returns true if the line was one (even a separator row). */
const parseMarkdownTableRow = (line: string, out: ParsedCard[]): boolean => {
  if (!line.startsWith('|') || !line.endsWith('|')) return false;
  const cells = line.slice(1, -1).split('|').map((c) => c.trim());
  if (cells.length >= 2 && !/^:?-{2,}:?$/.test(cells[0])) {
    pushCard(out, cells[0], cells[1]);
  }
  return true;
};

/** One tab / pipe / comma separated line, in that priority order. */
const parseDelimitedLine = (line: string, sep: DeclaredSeparator, out: ParsedCard[]): void => {
  if (sep === 'tab' || (sep === null && line.includes('\t'))) {
    const cells = line.split('\t');
    if (cells.length >= 2) pushCard(out, cells[0], cells[1]);
    return;
  }
  if (line.includes('|')) {
    const parts = line.split(/\s*\|\s*/);
    if (parts.length >= 2) pushCard(out, parts[0], parts.slice(1).join(' '));
    return;
  }
  if (sep === 'comma' || line.includes(',')) {
    const cells = splitCsvLine(line);
    if (cells.length >= 2) pushCard(out, cells[0], cells.slice(1).join(', '));
  }
};

export const parseFlashcards = (input: string): ParsedCard[] => {
  const text = (input || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];

  const qaCards = parseQABlocks(text);
  if (qaCards.length > 0) return qaCards;

  const out: ParsedCard[] = [];
  const declaredSep = detectDeclaredSeparator(text);
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue; // Anki metadata/comments
    if (parseMarkdownTableRow(line, out)) continue;
    parseDelimitedLine(line, declaredSep, out);
  }
  return out;
};

export default parseFlashcards;
