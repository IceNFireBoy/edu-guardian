import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Loader2, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { aiApi, QuizQuestion } from '../../../api/ai';
import { useToast } from '../../../hooks/useToast';

interface AIQuizProps {
  noteId: string;
}

/**
 * Generates an adaptive multiple-choice quiz from a note. After grading, the
 * student can push the questions they got wrong straight into their spaced-
 * repetition deck — so misses resurface right before they'd be forgotten.
 */
const AIQuiz: React.FC<AIQuizProps> = ({ noteId }) => {
  const toast = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const data = await aiApi.generateQuiz(noteId, 5);
      setQuestions(data.questions);
      if (data.questions.length === 0) toast.info('No quiz could be generated from this note.');
    } catch {
      /* toasted by API layer */
    } finally {
      setLoading(false);
    }
  };

  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;

  const addWrongToDeck = async () => {
    const wrong = questions
      .filter((q, i) => answers[i] !== q.correctIndex)
      .map((q) => ({ question: q.question, answer: q.options[q.correctIndex] }));
    if (wrong.length === 0) {
      toast.info('Nothing to review — you got them all right!');
      return;
    }
    try {
      const { added } = await aiApi.addToReviewDeck(wrong, noteId);
      toast.success(`Added ${added} missed questions to your review deck`);
    } catch {
      /* toasted by API layer */
    }
  };

  return (
    <div data-testid="ai-quiz" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <HelpCircle className="w-4 h-4 text-primary" /> Adaptive Quiz
        </h3>
        <button
          data-testid="ai-quiz-generate-btn"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-white
            hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
          {questions.length > 0 ? 'New quiz' : 'Start quiz'}
        </button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  const isCorrect = q.correctIndex === oi;
                  const showState = submitted && (chosen || isCorrect);
                  return (
                    <button
                      key={oi}
                      data-testid={`ai-quiz-q${qi}-opt${oi}`}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={`w-full text-left text-sm px-3 py-1.5 rounded-md border transition-colors
                        ${chosen ? 'border-primary' : 'border-gray-200 dark:border-slate-700'}
                        ${showState && isCorrect ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : ''}
                        ${showState && chosen && !isCorrect ? 'bg-red-50 dark:bg-red-900/30 border-red-500' : ''}
                        ${!submitted ? 'hover:bg-gray-50 dark:hover:bg-slate-700/50' : ''}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {showState && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {showState && chosen && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{q.explanation}</p>
              )}
            </div>
          ))}

          {!submitted ? (
            <button
              data-testid="ai-quiz-submit-btn"
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < questions.length}
              className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90
                disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Submit answers
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 flex-wrap"
            >
              <span data-testid="ai-quiz-score" className="text-sm font-semibold text-gray-900 dark:text-white">
                Score: {score}/{questions.length}
              </span>
              <button
                onClick={addWrongToDeck}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-primary
                  text-primary hover:bg-primary/10 transition-colors"
              >
                <BookOpen className="w-4 h-4" /> Review my mistakes
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIQuiz;
