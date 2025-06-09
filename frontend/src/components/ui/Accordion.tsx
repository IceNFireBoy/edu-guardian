import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string[];
  allowMultiple?: boolean;
  onChange?: (openItems: string[]) => void;
  className?: string;
  itemClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'bordered' | 'separated';
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpen = [],
  allowMultiple = false,
  onChange,
  className = '',
  itemClassName = '',
  titleClassName = '',
  contentClassName = '',
  variant = 'default',
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const handleToggle = (itemId: string) => {
    const newOpenItems = allowMultiple
      ? openItems.includes(itemId)
        ? openItems.filter(id => id !== itemId)
        : [...openItems, itemId]
      : openItems.includes(itemId)
        ? []
        : [itemId];

    setOpenItems(newOpenItems);
    onChange?.(newOpenItems);
  };

  const variants = {
    default: {
      item: 'border-b border-gray-200 dark:border-gray-700 last:border-0',
      title: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
    },
    bordered: {
      item: 'border border-gray-200 dark:border-gray-700 rounded-lg mb-2 last:mb-0',
      title: 'hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg',
    },
    separated: {
      item: 'mb-2 last:mb-0',
      title: 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg',
    },
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            ${variants[variant].item}
            ${itemClassName}
          `}
        >
          <button
            className={`
              w-full px-4 py-3 text-left
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              ${variants[variant].title}
              ${titleClassName}
            `}
            onClick={() => !item.disabled && handleToggle(item.id)}
            disabled={item.disabled}
            aria-expanded={openItems.includes(item.id)}
            aria-controls={`accordion-content-${item.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {item.icon && (
                  <span className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </span>
              </div>
              <motion.div
                animate={{ rotate: openItems.includes(item.id) ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
              >
                <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
              </motion.div>
            </div>
          </button>
          <AnimatePresence initial={false}>
            {openItems.includes(item.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  id={`accordion-content-${item.id}`}
                  className={`
                    px-4 py-3 text-gray-600 dark:text-gray-300
                    ${contentClassName}
                  `}
                >
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default Accordion; 