import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OverlayProps {
  isVisible: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  blur?: boolean;
  zIndex?: number;
  className?: string;
}

const Overlay: React.FC<OverlayProps> = ({
  isVisible,
  children,
  onClick,
  blur = false,
  zIndex = 40,
  className = '',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 ${blur ? 'backdrop-blur-sm' : ''} bg-black bg-opacity-50 dark:bg-opacity-75 transition-opacity ${className}`}
          style={{ zIndex }}
          onClick={onClick}
          role="presentation"
          aria-hidden="true"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Overlay; 