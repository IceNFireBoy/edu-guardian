import React from 'react';
import { X } from 'lucide-react';

interface FilterTagsProps {
  tags: string[];
  onRemove: (tag: string) => void;
  className?: string;
}

const FilterTags: React.FC<FilterTagsProps> = ({ tags, onRemove, className = '' }) => {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
        >
          {tag}
          <button
            onClick={() => onRemove(tag)}
            className="ml-2 hover:text-primary-dark"
            aria-label={`Remove ${tag} filter`}
          >
            <X size={14} />
          </button>
        </span>
      ))}
    </div>
  );
};

export default FilterTags; 