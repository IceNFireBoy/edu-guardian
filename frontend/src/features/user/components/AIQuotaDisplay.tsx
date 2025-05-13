import React from 'react';
import { AIUsage } from '../userTypes';
import { FaRobot, FaLightbulb, FaInfoCircle } from 'react-icons/fa';
import { AI_USAGE_LIMITS_FRONTEND } from '../../../config/aiConfig';

interface AIQuotaDisplayProps {
  aiUsage: AIUsage | undefined;
  compact?: boolean;
  className?: string;
}

const getUsageColor = (percentage: number): string => {
  if (percentage <= 70) return 'bg-green-500';
  if (percentage <= 90) return 'bg-yellow-500';
  return 'bg-red-500';
};

const AIQuotaDisplay: React.FC<AIQuotaDisplayProps> = ({ aiUsage, compact = false, className = '' }) => {
  if (!aiUsage) {
    return null;
  }

  const { summaryUsed, flashcardUsed } = aiUsage;
  const { SUMMARY_PER_DAY, FLASHCARDS_PER_DAY } = AI_USAGE_LIMITS_FRONTEND;

  const summaryPercentage = Math.min(100, (summaryUsed / SUMMARY_PER_DAY) * 100);
  const flashcardPercentage = Math.min(100, (flashcardUsed / FLASHCARDS_PER_DAY) * 100);

  const summaryRemaining = Math.max(0, SUMMARY_PER_DAY - summaryUsed);
  const flashcardRemaining = Math.max(0, FLASHCARDS_PER_DAY - flashcardUsed);

  const summaryBarColor = getUsageColor(summaryPercentage);
  const flashcardBarColor = getUsageColor(flashcardPercentage);

  const tooltipText = "Usage quotas refresh daily.";

  if (compact) {
    return (
      <div className={`flex items-center gap-4 ${className}`} title={tooltipText}>
        <div className="flex items-center gap-1" title={`Summaries: ${summaryUsed}/${SUMMARY_PER_DAY} used today`}>
          <FaRobot className="text-blue-500" />
          <span className="text-sm">{summaryUsed}/{SUMMARY_PER_DAY}</span>
        </div>
        <div className="flex items-center gap-1" title={`Flashcards: ${flashcardUsed}/${FLASHCARDS_PER_DAY} used today`}>
          <FaLightbulb className="text-yellow-500" />
          <span className="text-sm">{flashcardUsed}/{FLASHCARDS_PER_DAY}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} title={tooltipText}>
      <div>
        <div className="flex justify-between mb-1">
          <div className="flex items-center">
            <FaRobot className="mr-2 text-blue-500" />
            <span className="font-medium">AI Summary Quota</span>
          </div>
          <span className="text-sm font-medium">
            {summaryUsed} / {SUMMARY_PER_DAY}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className={`${summaryBarColor} h-2.5 rounded-full transition-all duration-300 ease-in-out`} 
            style={{ width: `${summaryPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {summaryRemaining} AI summar{summaryRemaining === 1 ? 'y' : 'ies'} remaining today.
          {summaryRemaining === 1 && <span className="ml-1 font-semibold text-yellow-600 dark:text-yellow-400">(Warning: 1 left!)</span>}
          {summaryRemaining === 0 && <span className="ml-1 font-semibold text-red-600 dark:text-red-400">(None left)</span>}
        </p>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <div className="flex items-center">
            <FaLightbulb className="mr-2 text-yellow-500" />
            <span className="font-medium">AI Flashcard Quota</span>
          </div>
          <span className="text-sm font-medium">
            {flashcardUsed} / {FLASHCARDS_PER_DAY}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className={`${flashcardBarColor} h-2.5 rounded-full transition-all duration-300 ease-in-out`} 
            style={{ width: `${flashcardPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {flashcardRemaining} AI flashcard set{flashcardRemaining === 1 ? '' : 's'} remaining today.
          {flashcardRemaining === 1 && <span className="ml-1 font-semibold text-yellow-600 dark:text-yellow-400">(Warning: 1 left!)</span>}
          {flashcardRemaining === 0 && <span className="ml-1 font-semibold text-red-600 dark:text-red-400">(None left)</span>}
        </p>
      </div>
       <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-2">
        <FaInfoCircle className="mr-1.5" />
        <span>Quotas refresh daily.</span>
      </div>
    </div>
  );
};

export default AIQuotaDisplay; 