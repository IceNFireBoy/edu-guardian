import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
  contentClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  className = '',
  contentClassName = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  let timeoutId: NodeJS.Timeout;

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const positions = {
      top: {
        top: trigger.top + scrollTop - tooltip.height - 8,
        left: trigger.left + scrollLeft + (trigger.width - tooltip.width) / 2,
      },
      right: {
        top: trigger.top + scrollTop + (trigger.height - tooltip.height) / 2,
        left: trigger.right + scrollLeft + 8,
      },
      bottom: {
        top: trigger.bottom + scrollTop + 8,
        left: trigger.left + scrollLeft + (trigger.width - tooltip.width) / 2,
      },
      left: {
        top: trigger.top + scrollTop + (trigger.height - tooltip.height) / 2,
        left: trigger.left + scrollLeft - tooltip.width - 8,
      },
    };

    setPosition(positions[placement]);
  };

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      className={`inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              fixed z-50 px-3 py-1.5
              text-sm font-medium
              text-white dark:text-gray-900
              bg-gray-900 dark:bg-white
              rounded-md shadow-lg
              pointer-events-none
              ${contentClassName}
            `}
            style={{
              top: position.top,
              left: position.left,
            }}
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip; 