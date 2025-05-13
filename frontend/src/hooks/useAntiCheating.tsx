import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface RestingModeOverlayProps {
  onClose: () => void;
}

const RestingModeOverlay: React.FC<RestingModeOverlayProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-blue-900/90 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Resting Mode Active</h2>
        <p className="text-gray-600 mb-6">
          Your screen is currently in resting mode to prevent eye strain. Click the button below to continue.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

interface UseAntiCheatingReturn {
  isRestingMode: boolean;
  RestingModeOverlay: React.FC<RestingModeOverlayProps>;
  startRestingMode: () => void;
  stopRestingMode: () => void;
}

export const useAntiCheating = (): UseAntiCheatingReturn => {
  const [isRestingMode, setIsRestingMode] = useState(false);

  const startRestingMode = () => {
    setIsRestingMode(true);
  };

  const stopRestingMode = () => {
    setIsRestingMode(false);
  };

  return {
    isRestingMode,
    RestingModeOverlay,
    startRestingMode,
    stopRestingMode
  };
};