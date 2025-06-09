import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  itemClassName?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  itemClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(item => item.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${buttonClassName}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedItem?.label || placeholder}
      >
        <span className="block truncate text-gray-900 dark:text-white">
          {selectedItem?.label || placeholder}
        </span>
        <FaChevronDown
          className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${menuClassName}`}
            role="listbox"
          >
            {items.map((item) => (
              <div
                key={item.value}
                className={`relative flex cursor-pointer select-none items-center px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  item.disabled ? 'cursor-not-allowed opacity-50' : ''
                } ${itemClassName}`}
                onClick={() => {
                  if (!item.disabled) {
                    onChange(item.value);
                    setIsOpen(false);
                  }
                }}
                role="option"
                aria-selected={value === item.value}
                aria-disabled={item.disabled}
              >
                {item.icon && (
                  <span className="mr-2 flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="block truncate">{item.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown; 