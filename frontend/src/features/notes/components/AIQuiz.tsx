import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Loader2, CheckCircle2, XCircle, BookOpen, ArrowRight, RotateCcw } from 'lucide-react';
import { aiApi, QuizQuestion } from '../../../api/ai';
import { useToast } from '../../../hooks/useToast';
import { readLocalCache, writeLocalCache, DAY_MS } from '../../../utils/localCache';

interface AIQuizProps {
  noteId: string;
}

type Stage = 'idle' | 'active' | 'results';

/**
 * Adaptive quiz, one question at a time: progress bar, instant right/wrong
 * feedback with the explanation, then a results screen with a score ring.
 * Generated questions are cached on-device for 24h so reopening the note costs
 * no API calls; "New quiz" regenerates. Missed questions can be pushed into the
 * spaced-repetition deck.
 */
const AIQuiz: React.FC<AIQuizProps> = ({ noteId }) => {
  const toast = useToast();
  const cacheKey = `eg_ai_quiz_${noteId}`;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [stage, setStage] = useState<Stage>('idle');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // A quiz cached from an earlier visit lets the student start instantly.
  useEffect(() => {
    const cached = readLocalCache<QuizQuestion[]>(cacheKey);
    if (cached && cached.length > 0) setQuestions(cached);
    setStage('idle');
    setAnswers({});
    setPicked(null);
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const generate = async (force = false) => {
    if (!force && questions.length > 0) {
      // Restart with the cached questions — zero API calls
      setStage('active');
      setIndex(0);
      setAnswers({});
      setPicked(null);
      return;
    }
    setLoading(true);
    try {
      const data = await aiApi.generateQuiz(noteId, 5);
      if (data.questions.length === 0) {
        toast.info('No quiz could be generated from this note.');
        return;
      }
      setQuestions(data.questions);
      writeLocalCache(cacheKey, data.questions, DAY_MS);
      setStage('active');
      setIndex(0);
      setAnswers({});
      setPicked(null);
    } catch {
      /* toasted by API layer */
    } finally {
      setLoading(false);
    }
  };

  const q = questions[index];
  const answered = picked !== null;
  const score = questions.filter((qq, i) => answers[i] === qq.correctIndex).length;
  const scoreRatio = score / Math.max(questions.length, 1);

  let ringClass = 'stroke-red-500';
  if (scoreRatio >= 0.7) ringClass = 'stroke-green-500';
  else if (scoreRatio >= 0.4) ringClass = 'stroke-yellow-500';

  let resultsMessage = 'Good effort — send your misses to the review deck and they will stick.';
  if (score === questions.length) resultsMessage = 'Perfect score! 🎉';
  else if (scoreRatio >= 0.7) resultsMessage = 'Nice work — a little review and you own this.';

  const pick = (oi: number) => {
    if (answered) return;
    setPicked(oi);
    setAnswers((a) => ({ ...a, [index]: oi }));
  };

  const next = () => {
    setPicked(null);
    if (index + 1 >= questions.length) setStage('results');
    else setIndex((i) => i + 1);
  };

  const addWrongToDeck = async () => {
    const wrong = questions
      .filter((qq, i) => answers[i] !== qq.correctIndex)
      .map((qq) => ({ question: qq.question, answer: qq.options[qq.correctIndex] }));
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
          /* idle: start (cache-first, zero API calls if cached); mid/post quiz: force fresh questions */
          onClick={() => generate(stage !== 'idle')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-white
            hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
          {stage === 'idle' ? 'Start quiz' : 'New quiz'}
        </button>
      </div>

      {stage === 'idle' && questions.length === 0 && !loading && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Test yourself with AI-generated questions from this note.
        </p>
      )}

      {/* ---- Active question ---- */}
      {stage === 'active' && q && (
        <div className="space-y-3">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {index + 1}/{questions.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctIndex;
                  const isPicked = oi === picked;
                  let cls = 'border-gray-200 dark:border-slate-700 hover:border-primary/60';
                  if (answered && isCorrect)
                    cls = 'border-green-500 bg-green-50 dark:bg-green-900/25';
                  else if (answered && isPicked)
                    cls = 'border-red-500 bg-red-50 dark:bg-red-900/25';
                  else if (answered) cls = 'border-gray-200 dark:border-slate-700 opacity-60';
                  return (
                    <motion.button
                      key={oi}
                      data-testid={`ai-quiz-q${index}-opt${oi}`}
                      onClick={() => pick(oi)}
                      disabled={answered}
                      whileTap={answered ? undefined : { scale: 0.99 }}
                      className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${cls}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                        {answered && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                        {opt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {answered && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-3">
                  {q.explanation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 border-l-2 border-primary/50 pl-2">
                      {q.explanation}
                    </p>
                  )}
                  <button
                    data-testid="ai-quiz-next-btn"
                    onClick={next}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90"
                  >
                    {index + 1 >= questions.length ? 'See results' : 'Next'} <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ---- Results ---- */}
      {stage === 'results' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-gray-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 text-center space-y-4"
        >
          {/* Score ring */}
          <div className="relative w-24 h-24 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-gray-100 dark:stroke-slate-700" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
                className={ringClass}
                strokeDasharray={2 * Math.PI * 42}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - scoreRatio) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <span data-testid="ai-quiz-score" className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
              {score}/{questions.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{resultsMessage}</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={addWrongToDeck}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-primary text-primary hover:bg-primary/10"
            >
              <BookOpen className="w-4 h-4" /> Review my mistakes
            </button>
            <button
              onClick={() => generate(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300"
            >
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </div>

          {/* Per-question recap */}
          <div className="text-left space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-700">
            {questions.map((qq, i) => {
              const right = answers[i] === qq.correctIndex;
              return (
                <div key={`${qq.question.slice(0, 40)}-${i}`} className="flex items-start gap-2 text-xs">
                  {right ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-gray-600 dark:text-gray-300 line-clamp-1">{qq.question}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIQuiz;
