import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  tabListClassName?: string;
  tabPanelClassName?: string;
  variant?: 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded';
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  className = '',
  tabListClassName = '',
  tabPanelClassName = '',
  variant = 'line',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variants = {
    line: {
      list: 'border-b border-gray-200 dark:border-gray-700',
      tab: (isActive: boolean) => `
        border-b-2 -mb-px
        ${isActive
          ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
      `,
    },
    enclosed: {
      list: 'space-x-2',
      tab: (isActive: boolean) => `
        rounded-t-lg border
        ${isActive
          ? 'border-gray-200 dark:border-gray-700 border-b-0 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
      `,
    },
    'soft-rounded': {
      list: 'space-x-2',
      tab: (isActive: boolean) => `
        rounded-lg
        ${isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `,
    },
    'solid-rounded': {
      list: 'space-x-2',
      tab: (isActive: boolean) => `
        rounded-lg
        ${isActive
          ? 'bg-blue-600 dark:bg-blue-500 text-white'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `,
    },
  };

  return (
    <div className={className}>
      <div
        className={`
          flex
          ${variants[variant].list}
          ${tabListClassName}
        `}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            className={`
              px-4 py-2 text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              ${variants[variant].tab(activeTab === tab.id)}
            `}
          >
            <div className="flex items-center space-x-2">
              {tab.icon && <span className="w-4 h-4" aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          className={`
            mt-4
            ${tabPanelClassName}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {tab.content}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Tabs; 